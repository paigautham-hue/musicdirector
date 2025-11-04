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
        theme: z.string(),
        vibe: z.array(z.string()),
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
        
        // Generate the album using AI
        const generated = await generateAlbum(input);
        
        // Save to database
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
          
          // Save main assets
          await db.createTrackAsset({
            trackId: track.id,
            type: "prompt",
            content: trackData.prompt
          });
          
          await db.createTrackAsset({
            trackId: track.id,
            type: "lyrics",
            content: trackData.lyrics
          });
          
          await db.createTrackAsset({
            trackId: track.id,
            type: "structure",
            content: trackData.structure
          });
          
          await db.createTrackAsset({
            trackId: track.id,
            type: "production_notes",
            content: trackData.productionNotes
          });
          
          await db.createTrackAsset({
            trackId: track.id,
            type: "art_prompt",
            content: trackData.artPrompt
          });
          
          if (trackData.artUrl) {
            await db.createTrackAsset({
              trackId: track.id,
              type: "art_url",
              content: trackData.artUrl
            });
          }
          
          // Save alternates
          for (let i = 0; i < trackData.alternates.length; i++) {
            const alt = trackData.alternates[i];
            await db.createTrackAsset({
              trackId: track.id,
              type: i === 0 ? "alternate_1" : "alternate_2",
              content: JSON.stringify(alt),
              variant: alt.variant
            });
          }
        }
        
        // Log the action
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "album_created",
          payload: JSON.stringify({ albumId: album.id, platform: input.platform })
        });
        
        return { albumId: album.id };
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
      })
  }),

  knowledge: router({
    // Get latest published knowledge update
    latest: publicProcedure.query(async () => {
      return db.getLatestKnowledgeUpdate();
    })
  })
});

export type AppRouter = typeof appRouter;
