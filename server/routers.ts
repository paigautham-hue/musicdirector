import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { tracks, musicJobs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { generateAlbum, improveTrack } from "./albumGenerator";
import { generateJobId, setProgress, getProgress, clearProgress } from "./progressTracker";
import { getPlatformAdapter, PLATFORM_ADAPTERS } from "./adapters";
import { checkContentSafety } from "./contentSafety";
import { exportAlbumBundle } from "./exportAlbum";
import { socialRouter } from "./socialRouter";
import { playlistRouter } from "./routers/playlistRouter";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  social: socialRouter,
  playlists: playlistRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  profile: router({
    update: protectedProcedure
      .input(z.object({
        bio: z.string().max(500).optional().nullable(),
        avatarUrl: z.string().url().optional().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updatedUser = await db.updateUserProfile(ctx.user.id, input);
        return updatedUser;
      }),
    
    uploadAvatar: protectedProcedure
      .input(z.object({
        base64Image: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const base64Data = input.base64Image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const extension = input.mimeType.split('/')[1] || 'jpg';
        const fileKey = `user-${ctx.user.id}/avatar-${timestamp}-${randomSuffix}.${extension}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        // Update user profile
        const updatedUser = await db.updateUserProfile(ctx.user.id, { avatarUrl: url });
        
        return { avatarUrl: url, user: updatedUser };
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
        platform: z.enum(["suno", "udio", "elevenlabs", "mubert", "stable_audio"]),
        visibility: z.enum(["public", "private"]).default("private")
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
            console.log(`[Album Generation] Starting job ${jobId} for user ${ctx.user.id}`);
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
              trackCount: input.trackCount,
              visibility: input.visibility
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
            
            console.log(`[Album Generation] Job ${jobId} completed successfully. Album ID: ${album.id}`);
            
            // Clear after 5 minutes
            setTimeout(() => clearProgress(jobId), 5 * 60 * 1000);
          } catch (error: any) {
            console.error(`[Album Generation] Job ${jobId} failed:`, error);
            setProgress(jobId, {
              stage: "Error",
              progress: 0,
              message: error.message || "Failed to generate album"
            });
            
            // Clear error progress after 5 minutes
            setTimeout(() => clearProgress(jobId), 5 * 60 * 1000);
          }
        })().catch((error) => {
          // Catch any unhandled promise rejections
          console.error(`[Album Generation] Unhandled error in job ${jobId}:`, error);
        });
        
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
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        // Allow album owner or admin to access
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
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
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        // Allow album owner or admin to access
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const shareToken = Math.random().toString(36).substring(2, 15);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "share_link_created",
          payload: JSON.stringify({ albumId: input.albumId, shareToken })
        });
        
        return { shareToken, shareUrl: `/share/${shareToken}` };
      }),
    
    // Generate music for all tracks in album
    generateMusic: protectedProcedure
      .input(z.object({ albumId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        // Allow album owner or admin to access
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Check retry limit
        const retryCheck = await db.checkRetryLimit(input.albumId);
        if (!retryCheck.allowed) {
          throw new TRPCError({ 
            code: 'TOO_MANY_REQUESTS', 
            message: retryCheck.message || 'Retry limit exceeded'
          });
        }
        
        const albumTracks = await db.getTracksByAlbumId(input.albumId);
        if (albumTracks.length === 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'No tracks found in album' });
        }
        
        // Create music generation jobs for all tracks
        const jobPromises = albumTracks.map(track => 
          db.createMusicJob({
            albumId: input.albumId,
            trackId: track.id,
            platform: album.platform,
          })
        );
        
        await Promise.all(jobPromises);
        
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "music_generation_started",
          payload: JSON.stringify({ albumId: input.albumId, trackCount: albumTracks.length })
        });
        
        return { success: true, jobCount: albumTracks.length };
      }),
    
    // Get music generation status for album with queue info
    getMusicStatus: protectedProcedure
      .input(z.object({ albumId: z.number() }))
      .query(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        // Allow album owner or admin to access
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const jobs = await db.getMusicJobsByAlbumId(input.albumId);
        const audioFiles = await db.getAudioFilesByAlbumId(input.albumId);
        const generationStatus = await db.getAlbumGenerationStatus(input.albumId);
        
        return { 
          jobs, 
          audioFiles,
          ...generationStatus
        };
      }),
    
    // Get music status for multiple albums (for library view)
    getBulkMusicStatus: protectedProcedure
      .input(z.object({ albumIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        const statusMap: Record<number, { hasMusic: boolean; trackCount: number; completedCount: number }> = {};
        
        for (const albumId of input.albumIds) {
          const album = await db.getAlbumById(albumId);
          if (album && album.userId === ctx.user.id) {
            const audioFiles = await db.getAudioFilesByAlbumId(albumId);
            const tracks = await db.getTracksByAlbumId(albumId);
            statusMap[albumId] = {
              hasMusic: audioFiles.length > 0,
              trackCount: tracks.length,
              completedCount: audioFiles.length
            };
          }
        }
        
        return statusMap;
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
      }),
    
    // Add more tracks to existing album
    addTracks: protectedProcedure
      .input(z.object({
        albumId: z.number(),
        additionalTrackCount: z.number().min(1).max(11)
      }))
      .mutation(async ({ ctx, input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        // Only album owner or admin can add tracks
        if (album.userId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        // Get current tracks
        const currentTracks = await db.getAlbumTracks(input.albumId);
        const currentTrackCount = currentTracks.length;
        const newTrackCount = currentTrackCount + input.additionalTrackCount;
        
        // Validate total doesn't exceed 20
        if (newTrackCount > 20) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Cannot add ${input.additionalTrackCount} tracks. Album would have ${newTrackCount} tracks (max: 20)`
          });
        }
        
        // Start background job for generating additional tracks
        const jobId = generateJobId();
        
        (async () => {
          try {
            setProgress(jobId, {
              stage: "Generating",
              progress: 0,
              message: `Generating ${input.additionalTrackCount} additional tracks...`
            });
            
            // Generate new tracks using album's existing theme/style
            const albumInput = {
              theme: album.theme,
              vibe: album.vibe ? JSON.parse(album.vibe) : ["General"],
              language: album.language || "en",
              audience: album.audience || undefined,
              influences: album.influences ? JSON.parse(album.influences) : undefined,
              trackCount: input.additionalTrackCount,
              platform: album.platform as any,
              visibility: album.visibility
            };
            
            const generated = await generateAlbum(albumInput, (update) => {
              setProgress(jobId, update);
            });
            
            setProgress(jobId, {
              stage: "Saving",
              progress: 90,
              message: "Adding tracks to album..."
            });
            
            // Add new tracks to existing album
            for (const trackData of generated.tracks) {
              const track = await db.createTrack({
                albumId: album.id,
                index: currentTrackCount + trackData.index,
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
            
            // Update album trackCount
            await db.updateAlbum(input.albumId, { trackCount: newTrackCount });
            
            setProgress(jobId, {
              stage: "Complete",
              progress: 100,
              message: `Successfully added ${input.additionalTrackCount} tracks!`
            });
            
            await db.createAuditLog({
              userId: ctx.user.id,
              action: "tracks_added",
              payload: JSON.stringify({ albumId: input.albumId, tracksAdded: input.additionalTrackCount })
            });
            
            setTimeout(() => clearProgress(jobId), 5 * 60 * 1000);
          } catch (error: any) {
            console.error(`[Add Tracks] Job ${jobId} failed:`, error);
            setProgress(jobId, {
              stage: "Error",
              progress: 0,
              message: error.message || "Failed to add tracks"
            });
            setTimeout(() => clearProgress(jobId), 5 * 60 * 1000);
          }
        })();
        
        return { jobId };
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
      }),
    
    // Rate a track
    rate: protectedProcedure
      .input(z.object({
        trackId: z.number(),
        rating: z.number().min(1).max(5)
      }))
      .mutation(async ({ ctx, input }) => {
        const rating = await db.upsertTrackRating(input.trackId, ctx.user.id, input.rating);
        return { success: true, rating };
      }),
    
    // Get user's rating for a track
    getRating: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getTrackRating(input.trackId, ctx.user.id);
      }),
    
    // Get all ratings for a track (for average calculation)
    getAllRatings: publicProcedure
      .input(z.object({ trackId: z.number() }))
      .query(async ({ input }) => {
        return db.getTrackRatings(input.trackId);
      }),
    
    // Retry failed music generation for a track
    retryGeneration: protectedProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        }
        
        // Get track to verify ownership
        const [track] = await dbInstance.select().from(tracks).where(eq(tracks.id, input.trackId)).limit(1);
        if (!track) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
        }
        
        // Get album to check ownership
        const album = await db.getAlbumById(track.albumId);
        if (!album || album.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Find existing failed job and reset it to pending
        const [existingJob] = await dbInstance
          .select()
          .from(musicJobs)
          .where(and(eq(musicJobs.trackId, input.trackId), eq(musicJobs.status, "failed")))
          .limit(1);
        
        if (existingJob) {
          // Reset existing job to pending
          await dbInstance
            .update(musicJobs)
            .set({
              status: "pending",
              progress: 0,
              errorMessage: null,
              statusMessage: null,
              startedAt: null,
              completedAt: null,
            })
            .where(eq(musicJobs.id, existingJob.id));
        } else {
          // Create new job if none exists
          const { createTrackGenerationJob } = await import("./backgroundJobs");
          await createTrackGenerationJob(album.id, input.trackId, album.platform);
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
        timeRange: z.enum(["hour", "day", "week"]).default("day")
      }))
      .query(async ({ input }) => {
        return db.getApiUsageStats(input.timeRange);
      }),
    
    // Get API endpoint breakdown
    apiEndpointBreakdown: adminProcedure
      .input(z.object({
        timeRange: z.enum(["hour", "day", "week"]).default("day")
      }))
      .query(async ({ input }) => {
        return db.getApiEndpointBreakdown(input.timeRange);
      }),
    
    // Get LLM usage statistics
    llmUsageStats: adminProcedure
      .input(z.object({
        timeRange: z.enum(["hour", "day", "week"]).default("day")
      }))
      .query(async ({ input }) => {
        return db.getLlmUsageStats(input.timeRange);
      }),
    
    // Get user statistics
    userStats: adminProcedure.query(async () => {
      const { getUserStats } = await import("./analytics");
      return getUserStats();
    }),
    
    // Get all users with detailed statistics
    getAllUsers: adminProcedure.query(async () => {
      return db.getAllUsersWithStats();
    }),
    
    // Get user details by ID
    getUserDetails: adminProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserDetailsById(input.userId);
      }),
    
    // Update user role
    updateUserRole: adminProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"])
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserRole(input.userId, input.role);
        await db.createAuditLog({
          userId: ctx.user.id,
          action: "user_role_updated",
          payload: JSON.stringify({ targetUserId: input.userId, newRole: input.role })
        });
        return { success: true };
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
    
    // Update user quota
    updateUserQuota: adminProcedure
      .input(z.object({
        userId: z.number(),
        quota: z.number()
      }))
      .mutation(async ({ input }) => {
        await db.updateUserQuota(input.userId, input.quota);
        return { success: true };
      }),
    
    // Audio Health Check
    getBrokenAudioTracks: adminProcedure.query(async () => {
      return db.getBrokenAudioTracks();
    }),
    
    getAlbumsWithBrokenAudio: adminProcedure.query(async () => {
      return db.getAlbumsWithBrokenAudio();
    }),
    
    // Regenerate audio for a single track
    regenerateTrackAudio: adminProcedure
      .input(z.object({ trackId: z.number() }))
      .mutation(async ({ input }) => {
        const track = await db.getTrackById(input.trackId);
        if (!track) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
        }
        
        // Create new music generation job
        const album = await db.getAlbumById(track.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        await db.createMusicJob({
          albumId: album.id,
          trackId: track.id,
          platform: album.platform || 'suno'
        });
        
        return { success: true, message: 'Audio regeneration started' };
      }),
    
    // Regenerate audio for all tracks in an album
    regenerateAlbumAudio: adminProcedure
      .input(z.object({ albumId: z.number() }))
      .mutation(async ({ input }) => {
        const album = await db.getAlbumById(input.albumId);
        if (!album) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Album not found' });
        }
        
        const albumTracks = await db.getTracksByAlbumId(input.albumId);
        
        // Create jobs for all tracks
        for (const track of albumTracks) {
          await db.createMusicJob({
            albumId: album.id,
            trackId: track.id,
            platform: album.platform || 'suno'
          });
        }
        
        return { success: true, message: `Started regeneration for ${albumTracks.length} tracks` };
      }),
    
    // Audio Analytics
    getAudioAnalytics: adminProcedure.query(async () => {
      return db.getAudioAnalytics();
    }),
    
    // Get all audio files with filtering
    getAllAudioFiles: adminProcedure
      .input(z.object({
        format: z.string().optional(),
        platform: z.string().optional(),
        limit: z.number().default(100),
        offset: z.number().default(0)
      }))
      .query(async ({ input }) => {
        return db.getAllAudioFiles(input);
      }),
    
    // Get audio format distribution
    getAudioFormatDistribution: adminProcedure.query(async () => {
      return db.getAudioFormatDistribution();
    }),
    
    // Get storage statistics
    getStorageStats: adminProcedure.query(async () => {
      return db.getStorageStats();
    }),
    
    // Bulk regenerate all broken audio
    regenerateAllBrokenAudio: adminProcedure
      .mutation(async () => {
        const brokenTracks = await db.getBrokenAudioTracks();
        
        let regeneratedCount = 0;
        for (const track of brokenTracks) {
          if (!track.albumId) continue;
          
          const album = await db.getAlbumById(track.albumId);
          if (album) {
            await db.createMusicJob({
              albumId: album.id,
              trackId: track.trackId,
              platform: album.platform || 'suno'
            });
            regeneratedCount++;
          }
        }
        
        return { success: true, message: `Started regeneration for ${regeneratedCount} tracks` };
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
  }),

  // Prompt template operations
  promptTemplates: router({
    // Get user's prompt templates
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserPromptTemplates(ctx.user.id);
      }),
    
    // Create new prompt template
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        theme: z.string().min(1, "Theme is required"),
        vibe: z.array(z.string()),
        platform: z.enum(["suno", "udio", "elevenlabs", "mubert", "stable_audio"]),
        language: z.string().default("en"),
        audience: z.string().optional(),
        influences: z.array(z.string()).optional(),
        trackCount: z.number().min(1).max(20).default(10),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createPromptTemplate({
          userId: ctx.user.id,
          name: input.name,
          theme: input.theme,
          vibe: JSON.stringify(input.vibe),
          platform: input.platform,
          language: input.language,
          audience: input.audience || null,
          influences: input.influences ? JSON.stringify(input.influences) : null,
          trackCount: input.trackCount,
        });
      }),
    
    // Update prompt template
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        theme: z.string().min(1).optional(),
        vibe: z.array(z.string()).optional(),
        platform: z.enum(["suno", "udio", "elevenlabs", "mubert", "stable_audio"]).optional(),
        language: z.string().optional(),
        audience: z.string().optional(),
        influences: z.array(z.string()).optional(),
        trackCount: z.number().min(1).max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPromptTemplateById(input.id);
        if (!template) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        if (template.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        const updates: any = {};
        if (input.name) updates.name = input.name;
        if (input.theme) updates.theme = input.theme;
        if (input.vibe) updates.vibe = JSON.stringify(input.vibe);
        if (input.platform) updates.platform = input.platform;
        if (input.language) updates.language = input.language;
        if (input.audience !== undefined) updates.audience = input.audience || null;
        if (input.influences !== undefined) updates.influences = input.influences ? JSON.stringify(input.influences) : null;
        if (input.trackCount) updates.trackCount = input.trackCount;
        
        await db.updatePromptTemplate(input.id, updates);
        return { success: true };
      }),
    
    // Delete prompt template
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const template = await db.getPromptTemplateById(input.id);
        if (!template) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' });
        }
        if (template.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        
        await db.deletePromptTemplate(input.id);
        return { success: true };
      }),
  })
});

export type AppRouter = typeof appRouter;
