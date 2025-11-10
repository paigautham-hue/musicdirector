import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

/**
 * Social features router - Gallery, Comments, Likes, Follows, Leaderboards
 */
export const socialRouter = router({
  // ============================================================================
  // PUBLIC GALLERY & EXPLORE
  // ============================================================================

  /**
   * Get public albums with filters and pagination
   */
  getPublicAlbums: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        platform: z.string().optional(),
        sortBy: z.enum(["newest", "trending", "top_rated", "most_played"]).optional(),
        hasAudio: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return db.getPublicAlbumsWithFilters(input);
    }),

  /**
   * Get album details with social stats
   */
  getAlbumDetails: publicProcedure
    .input(z.object({ albumId: z.number(), userId: z.number().optional() }))
    .query(async ({ input }) => {
      const result = await db.getAlbumWithSocialStats(input.albumId, input.userId);
      if (!result) {
        throw new Error("Album not found");
      }
      return result;
    }),

  /**
   * Increment album view count
   */
  incrementViews: publicProcedure
    .input(z.object({ albumId: z.number() }))
    .mutation(async ({ input }) => {
      await db.incrementAlbumViews(input.albumId);
      return { success: true };
    }),

  /**
   * Increment album play count
   */
  incrementPlays: publicProcedure
    .input(z.object({ albumId: z.number() }))
    .mutation(async ({ input }) => {
      await db.incrementAlbumPlays(input.albumId);
      return { success: true };
    }),

  /**
   * Get album tracks with audio files
   */
  getAlbumTracks: publicProcedure
    .input(z.object({ albumId: z.number() }))
    .query(async ({ input }) => {
      const tracks = await db.getTracksByAlbumId(input.albumId);
      const audioFiles = await db.getAudioFilesByAlbumId(input.albumId);
      
      // Map audio files to tracks
      const tracksWithAudio = tracks.map(track => {
        const audio = audioFiles.find(a => a.trackId === track.id);
        return {
          ...track,
          audioUrl: audio?.fileUrl || null,
          audioDuration: audio?.duration || null,
        };
      });
      
      return tracksWithAudio;
    }),

  // ============================================================================
  // COMMENTS & REVIEWS
  // ============================================================================

  /**
   * Get comments for an album
   */
  getComments: publicProcedure
    .input(z.object({ albumId: z.number() }))
    .query(async ({ input }) => {
      return db.getAlbumComments(input.albumId);
    }),

  /**
   * Add comment to album (protected)
   */
  addComment: protectedProcedure
    .input(
      z.object({
        albumId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const commentId = await db.addAlbumComment({
        userId: ctx.user.id,
        albumId: input.albumId,
        content: input.content,
      });
      return { commentId, success: true };
    }),

  // ============================================================================
  // LIKES & FAVORITES
  // ============================================================================

  /**
   * Toggle like on album (protected)
   */
  toggleLike: protectedProcedure
    .input(z.object({ albumId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.toggleAlbumLike(ctx.user.id, input.albumId);
    }),

  // ============================================================================
  // USER PROFILES & FOLLOWS
  // ============================================================================

  /**
   * Get user profile with stats
   */
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number(), viewerId: z.number().optional() }))
    .query(async ({ input }) => {
      const profile = await db.getUserProfileWithStats(input.userId, input.viewerId);
      if (!profile) {
        throw new Error("User not found");
      }
      return profile;
    }),

  /**
   * Get user's public albums
   */
  getUserAlbums: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      return db.getPublicAlbumsWithFilters({
        limit: input.limit,
        offset: 0,
      }).then((albums) => albums.filter((a) => a.userId === input.userId));
    }),

  /**
   * Toggle follow on user (protected)
   */
  toggleFollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.toggleUserFollow(ctx.user.id, input.userId);
    }),

  // ============================================================================
  // PROMPT SHARING
  // ============================================================================

  /**
   * Get public prompts
   */
  getPublicPrompts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return db.getPublicPromptsWithUsers(input);
    }),

  /**
   * Increment prompt usage count
   */
  incrementPromptUsage: publicProcedure
    .input(z.object({ promptId: z.number() }))
    .mutation(async ({ input }) => {
      await db.incrementPromptUsageCount(input.promptId);
      return { success: true };
    }),

  /**
   * Update prompt visibility (protected)
   */
  updatePromptVisibility: protectedProcedure
    .input(
      z.object({
        promptId: z.number(),
        visibility: z.enum(["private", "public"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const prompt = await db.getPromptTemplateById(input.promptId);
      if (!prompt || prompt.userId !== ctx.user.id) {
        throw new Error("Prompt not found or unauthorized");
      }

      await db.updatePromptTemplate(input.promptId, {
        visibility: input.visibility,
      });

      return { success: true };
    }),

  // ============================================================================
  // LEADERBOARDS & TRENDING
  // ============================================================================

  /**
   * Get leaderboard data
   */
  getLeaderboard: publicProcedure
    .input(
      z.object({
        type: z.enum(["albums", "creators"]),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      return db.getLeaderboardData(input.type, input.limit);
    }),

  /**
   * Get trending albums (last 7 days)
   */
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ input }) => {
      return db.getPublicAlbumsWithFilters({
        sortBy: "trending",
        limit: input.limit,
        offset: 0,
      });
    }),

  /**
   * Update album visibility (protected)
   */
  updateAlbumVisibility: protectedProcedure
    .input(
      z.object({
        albumId: z.number(),
        visibility: z.enum(["private", "public"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const album = await db.getAlbumById(input.albumId);
      if (!album || album.userId !== ctx.user.id) {
        throw new Error("Album not found or unauthorized");
      }

      await db.updateAlbum(input.albumId, {
        visibility: input.visibility,
      });

      return { success: true };
    }),

  /**
   * Update user profile (protected)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("./db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      await db
        .update(users)
        .set({
          bio: input.bio,
          avatarUrl: input.avatarUrl,
        })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),
});
