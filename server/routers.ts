import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { tracks } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateAlbum, improveTrack } from "./albumGenerator";
import { generateJobId, setProgress, getProgress, clearProgress } from "./progressTracker";
import { getPlatformAdapter, PLATFORM_ADAPTERS } from "./adapters";
import { checkContentSafety } from "./contentSafety";
import { exportAlbumBundle } from "./exportAlbum";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  albums: router({
    // Create a new album with AI generation
    create: protectedProcedure
      .input(z.object({
        theme: z.string().min(1, "Theme is required"),
        vibe: z.array(z.string()).default(["General"]),
        language: z.string().default("en"),
        audience: z.string().optional(),
        influences: z.array(z.string()).optional(),
        trackCount: z.number().min(1).max(20).default(10),
        platform: z.enum(["suno", "udio", "elevenlabs", "mubert", "stable_audio"])
      }))
      .mutation(async ({ ctx, input }) => {
        // Check content safety
        const safetyCheck = await checkContentSafety({ theme: input.theme });
        if (!safetyCheck.safe) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Content safety issues: ${safetyCheck.issues.join(", ")}. ${safetyCheck.suggestions || ""}`
          });
        }
        
        // Start background job for album generation
        const jobId = generateJobId();
        
        // Start generation in background
        (async () => {
          try {
            setProgress(jobId, {
              stage: "Initializing",
              progress: 0,
              message: "Starting album generation..."
            });
            
            const generated = await generateAlbum(input, (update) => {
              setProgress(jobId, update);
            });
            
            setProgress(jobId, {
              stage: "Saving",
              progress: 90,
              message: "Saving album to database..."
            });
            
            // Save to database (existing code will be moved here)
            const album = await db.createAlbum({
              userId: ctx.user.id,
              title: generated.title,
              theme: input.theme,
              platform: input.platform,
              description: generated.description,
              coverUrl: generated.coverUrl,
              coverPrompt: generated.coverPrompt,
              score: generated.overallScore,
              vibe: JSON.stringify(input.vibe),
              language: input.language,
              audience: input.audience,
              influences: input.influences ? JSON.stringify(input.influences) : null,
              trackCount: input.trackCount
            });
            
            // Save tracks and assets
            for (const trackData of generated.tracks) {
              const track = await db.createTrack({
                albumId: album.id,
                index: trackData.index,
                title: trackData.title,
                tempoBpm: trackData.tempoBpm,
                key: trackData.key,
                moodTags: JSON.stringify(trackData.moodTags),
                score: trackData.score,
                scoreBreakdown: JSON.stringify(trackData.scoreBreakdown)
              });
              
              await db.createTrackAsset({ trackId: track.id, type: "prompt", content: trackData.prompt });
              await db.createTrackAsset({ trackId: track.id, type: "lyrics", content: trackData.lyrics });
              await db.createTrackAsset({ trackId: track.id, type: "structure", content: trackData.structure });
              await db.createTrackAsset({ trackId: track.id, type: "production_notes", content: trackData.productionNotes });
              
              if (trackData.artUrl) {
                await db.createTrackAsset({ trackId: track.id, type: "art_url", content: trackData.artUrl });
              }
            }
            
            setProgress(jobId, {
              stage: "Complete",
              progress: 100,
              message: "Album created successfully!"
            });
            
            // Store album ID in progress for retrieval
            const finalProgress = getProgress(jobId);
            if (finalProgress) {
              (finalProgress as any).albumId = album.id;
              setProgress(jobId, finalProgress);
            }
            
            // Clear after 5 minutes
            setTimeout(() => clearProgress(jobId), 5 * 60 * 1000);
          } catch (error: any) {
            setProgress(jobId, {
              stage: "Error",
              progress: 0,
              message: error.message || "Failed to generate album"
            });
          }
        })();
        
        // Return job ID immediately
        return { jobId };
      }),
    
    // Poll for album generation progress
    getProgress: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(({ input }) => {
        const progress = getProgress(input.jobId);
        if (!progress) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Job not found' });
        }
        return progress;
      }),
    
    // Get user's albums
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50)
      }))
      .query(async ({ ctx, input }) => {
        return db.getUserAlbums(ctx.user.id, input.limit);
      }),
    
    // Get album details with tracks
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.id);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const tracks = await db.getAlbumTracks(input.id);
        const tracksWithAssets = await Promise.all(
          tracks.map(async (track) => {
            const assets = await db.getTrackAssets(track.id);
            return { ...track, assets };
          })
        );
        
        return {
          ...album,
          tracks: tracksWithAssets
        };
      }),
    
    // Delete album
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.id);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        await db.deleteAlbum(input.id);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "album_deleted",
          payload: JSON.stringify({ albumId: input.id })
        });
        
        return { success: true };
      }),
    
    // Optimize album for different platform
    optimizeForPlatform: protectedProcedure
      .input(z.object({
        albumId: z.number(),
        targetPlatform: z.enum(["suno", "udio", "elevenlabs", "mubert", "stable_audio"])
      }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album || album.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        const adapter = getPlatformAdapter(input.targetPlatform);
        const tracks = await db.getAlbumTracks(input.albumId);
        
        // Optimize each track
        for (const track of tracks) {
          const assets = await db.getTrackAssets(track.id);
          const promptAsset = assets.find(a => a.type === "prompt");
          const lyricsAsset = assets.find(a => a.type === "lyrics");
          
          if (promptAsset && lyricsAsset) {
            const optimized = await adapter.autoFit({
              title: track.title,
              prompt: promptAsset.content,
              lyrics: lyricsAsset.content
            });
            
            // Update assets
            await db.createTrackAsset({
              trackId: track.id,
              type: "prompt",
              content: optimized.prompt
            });
            
            await db.createTrackAsset({
              trackId: track.id,
              type: "lyrics",
              content: optimized.lyrics
            });
          }
        }
        
        // Update album platform
        await db.updateAlbum(input.albumId, { platform: input.targetPlatform });
        
        return { success: true };
      }),
    
    // Export album bundle
    export: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.id);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const exportData = await exportAlbumBundle(input.id);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "album_exported",
          payload: JSON.stringify({ albumId: input.id })
        });
        
        return exportData;
      }),
    
    // Generate share link
    createShareLink: protectedProcedure
      .input(z.object({ albumId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album || album.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        const shareToken = Math.random().toString(36).substring(2, 15);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "share_link_created",
          payload: JSON.stringify({ albumId: input.albumId, shareToken })
        });
        
        return { shareToken, shareUrl: `/share/${shareToken}` };
      }),
    
    // Get public albums for gallery
    getPublicAlbums: publicProcedure
      .input(z.object({
        search: z.string().optional(),
        sortBy: z.enum(["recent", "popular"]).default("recent"),
        limit: z.number().default(50)
      }))
      .query(async ({ input }) => {
        return db.getPublicAlbums(input);
      })
  }),

  tracks: router({
    // Improve a track
    improve: protectedProcedure
      .input(z.object({
        trackId: z.number(),
        improvements: z.array(z.string())
      }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        }
        
        const track = await dbInstance.select().from(tracks).where(eq(tracks.id, input.trackId)).limit(1);
        
        if (!track || track.length === 0) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        // Get album to check ownership
        const album = await db.getAlbumById(track[0].albumId);
        if (!album || album.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Get track assets
        const assets = await db.getTrackAssets(input.trackId);
        const promptAsset = assets.find(a => a.type === "prompt");
        const lyricsAsset = assets.find(a => a.type === "lyrics");
        
        if (!promptAsset || !lyricsAsset) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Track missing required assets' });
        }
        
        // Build track output for improvement
        const trackOutput = {
          index: track[0].index,
          title: track[0].title,
          hook: "",
          description: "",
          prompt: promptAsset.content,
          lyrics: lyricsAsset.content,
          structure: "",
          tempoBpm: track[0].tempoBpm || "",
          key: track[0].key || "",
          moodTags: JSON.parse(track[0].moodTags || "[]"),
          productionNotes: "",
          score: track[0].score || 0,
          scoreBreakdown: JSON.parse(track[0].scoreBreakdown || "{}"),
          alternates: [],
          artPrompt: "",
          artUrl: undefined
        };
        
        const improved = await improveTrack({
          originalTrack: trackOutput,
          improvements: input.improvements,
          platform: album.platform as any
        });
        
        // Update track assets
        if (improved.prompt) {
          await db.createTrackAsset({
            trackId: input.trackId,
            type: "prompt",
            content: improved.prompt
          });
        }
        
        if (improved.lyrics) {
          await db.createTrackAsset({
            trackId: input.trackId,
            type: "lyrics",
            content: improved.lyrics
          });
        }
        
        if (improved.score) {
          await db.updateTrack(input.trackId, {
            score: improved.score,
            scoreBreakdown: JSON.stringify(improved.scoreBreakdown)
          });
        }
        
        return { success: true };
      })
  }),

  platforms: router({
    // Get all platform info
    list: publicProcedure.query(() => {
      return Object.entries(PLATFORM_ADAPTERS).map(([key, adapter]) => ({
        name: key,
        displayName: adapter.displayName,
        constraints: adapter.constraints(),
        bestPractices: adapter.bestPractices(),
        exportInstructions: adapter.getExportInstructions()
      }));
    }),
    
    // Get specific platform
    get: publicProcedure
      .input(z.object({ platform: z.string() }))
      .query(({ input }) => {
        const adapter = getPlatformAdapter(input.platform);
        return {
          name: adapter.name,
          displayName: adapter.displayName,
          constraints: adapter.constraints(),
          bestPractices: adapter.bestPractices(),
          exportInstructions: adapter.getExportInstructions()
        };
      })
  }),

  ratings: router({
    // Rate an album or track
    create: protectedProcedure
      .input(z.object({
        albumId: z.number().optional(),
        trackId: z.number().optional(),
        rating: z.number().min(1).max(5),
        review: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createRating({
          userId: ctx.user.id,
          albumId: input.albumId,
          trackId: input.trackId,
          rating: input.rating,
          review: input.review
        });
      }),
    
    // Get ratings for an album
    getForAlbum: publicProcedure
      .input(z.object({ albumId: z.number() }))
      .query(({ input }) => {
        return db.getAlbumRatings(input.albumId);
      })
  }),

  admin: router({
    // Get analytics
    analytics: adminProcedure.query(async () => {
      return db.getAdminAnalytics();
    }),
    
    // Get API usage statistics
    apiUsageStats: adminProcedure
      .input(z.object({
        timeRange: z.enum(["hour", "day", "week", "month"]).default("day")
      }))
      .query(async ({ input }) => {
        const { getApiUsageStats } = await import("./analytics");
        return getApiUsageStats(input.timeRange);
      }),
    
    // Get LLM usage statistics
    llmUsageStats: adminProcedure
      .input(z.object({
        timeRange: z.enum(["hour", "day", "week", "month"]).default("day")
      }))
      .query(async ({ input }) => {
        const { getLlmUsageStats } = await import("./analytics");
        return getLlmUsageStats(input.timeRange);
      }),
    
    // Get user statistics
    userStats: adminProcedure.query(async () => {
      const { getUserStats } = await import("./analytics");
      return getUserStats();
    }),
    
    // Get all feature flags
    featureFlags: adminProcedure.query(async () => {
      return db.getAllFeatureFlags();
    }),
    
    // Update feature flag
    updateFeatureFlag: adminProcedure
      .input(z.object({
        name: z.string(),
        enabled: z.boolean(),
        description: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        await db.upsertFeatureFlag(input);
        return { success: true };
      }),
    
    // Get draft knowledge updates
    knowledgeDrafts: adminProcedure.query(async () => {
      return db.getDraftKnowledgeUpdates();
    }),
    
    // Publish knowledge update
    publishKnowledgeUpdate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateKnowledgeUpdate(input.id, {
          status: "published",
          publishedAt: new Date()
        });
        return { success: true };
      }),
    
    // Get system settings
    getSettings: adminProcedure.query(async () => {
      return db.getAllSystemSettings();
    }),
    
    // Update system setting
    updateSetting: adminProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        description: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertSystemSetting({
          key: input.key,
          value: input.value,
          description: input.description,
          updatedBy: ctx.user.id
        });
        return { success: true };
      }),
    
    // Get music generation jobs
    getMusicJobs: adminProcedure
      .input(z.object({
        status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
        limit: z.number().default(50)
      }))
      .query(async ({ input }) => {
        return db.getMusicJobs(input);
      }),
    
    // Get all users
    getAllUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    // Update user quota
    updateUserQuota: adminProcedure
      .input(z.object({
        userId: z.number(),
        quota: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.updateUserQuota(input.userId, input.quota);
        return { success: true };
      })
  }),

  knowledge: router({
    // Get latest published knowledge update
    latest: publicProcedure.query(async () => {
      return db.getLatestKnowledgeUpdate();
    })
  }),

  downloads: router({
    // Download track audio file
    track: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ ctx, input }) => {
        const track = await db.getTrackById(input.trackId);
        if (!track) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
        }
        
        // Get album to check ownership
        const album = await db.getAlbumById(track.albumId);
        if (!album || (album.userId !== ctx.user.id && ctx.user.role !== 'admin')) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Get audio file
        const audioFile = await db.getTrackAudioFile(input.trackId);
        if (!audioFile) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Audio file not found' });
        }
        
        return {
          url: audioFile.fileUrl,
          filename: audioFile.fileName,
          format: audioFile.format
        };
      }),
    
    // Generate and download album PDF booklet
    albumBooklet: protectedProcedure
      .input(z.object({ albumId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Generate PDF
        const { generateAlbumBooklet } = await import('./pdfGenerator');
        const pdfBuffer = await generateAlbumBooklet(input.albumId);
        
        // Convert to base64 for transfer
        const pdfBase64 = pdfBuffer.toString('base64');
        
        return {
          pdf: pdfBase64,
          filename: `${album.title.replace(/[^a-z0-9]/gi, '_')}_Booklet.pdf`
        };
      })
  }),

  // Payment operations
  payment: router({
    // Create checkout session
    createCheckout: protectedProcedure
      .input(z.object({ productId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession } = await import('./stripe');
        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        return createCheckoutSession({
          userId: ctx.user.id,
          userEmail: ctx.user.email || '',
          userName: ctx.user.name || 'User',
          productId: input.productId,
          origin
        });
      }),
    
    // Get user's payment history
    history: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserPayments(ctx.user.id);
      }),
    
    // Get user's credit transactions
    transactions: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserCreditTransactions(ctx.user.id);
      }),
  })
});

export type AppRouter = typeof appRouter;
