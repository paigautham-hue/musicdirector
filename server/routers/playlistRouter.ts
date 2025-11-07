import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { suggestTracksForPlaylist } from "../aiSuggestions";
import { getPlaylistStats } from "../db";
import {
  createPlaylist,
  getUserPlaylists,
  getPublicPlaylists,
  getPlaylistWithTracks,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  incrementPlaylistPlayCount,
  ratePlaylist,
  getUserPlaylistRating,
  getPlaylistRatingStats,
  deletePlaylistRating,
} from "../db";

export const playlistRouter = router({
  /**
   * Create a new playlist
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        visibility: z.enum(["private", "public"]).default("private"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const playlistId = await createPlaylist({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        coverImage: input.coverImage,
        visibility: input.visibility,
      });

      return { playlistId };
    }),

  /**
   * Get current user's playlists
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const playlists = await getUserPlaylists(ctx.user.id);
    return playlists;
  }),

  /**
   * Get public playlists (for discovery)
   */
  public: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        sortBy: z.enum(["recent", "popular", "top_rated"]).optional().default("popular"),
      })
    )
    .query(async ({ input }) => {
      const playlists = await getPublicPlaylists({
        limit: input.limit,
        offset: input.offset,
        search: input.search,
        sortBy: input.sortBy,
      });
      return playlists;
    }),

  /**
   * Get playlist by ID with tracks
   */
  get: publicProcedure
    .input(z.object({ playlistId: z.number() }))
    .query(async ({ ctx, input }) => {
      const playlist = await getPlaylistWithTracks(
        input.playlistId,
        ctx.user?.id
      );
      return playlist;
    }),

  /**
   * Update playlist
   */
  update: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        visibility: z.enum(["private", "public"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { playlistId, ...data } = input;
      await updatePlaylist(playlistId, ctx.user.id, data);
      return { success: true };
    }),

  /**
   * Delete playlist
   */
  delete: protectedProcedure
    .input(z.object({ playlistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePlaylist(input.playlistId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Add track to playlist
   */
  addTrack: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        trackId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await addTrackToPlaylist(input.playlistId, input.trackId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Remove track from playlist
   */
  removeTrack: protectedProcedure
    .input(z.object({ playlistTrackId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await removeTrackFromPlaylist(input.playlistTrackId, ctx.user.id);
      return { success: true };
    }),

  /**
   * Reorder tracks in playlist
   */
  reorder: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        trackOrder: z.array(z.number()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await reorderPlaylistTracks(
        input.playlistId,
        ctx.user.id,
        input.trackOrder
      );
      return { success: true };
    }),

  /**
   * Increment play count
   */
  incrementPlayCount: publicProcedure
    .input(z.object({ playlistId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementPlaylistPlayCount(input.playlistId);
      return { success: true };
    }),

  /**
   * Rate a playlist
   */
  rate: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        rating: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ratePlaylist(ctx.user.id, input.playlistId, input.rating);
      return { success: true };
    }),

  /**
   * Get user's rating for a playlist
   */
  getUserRating: protectedProcedure
    .input(z.object({ playlistId: z.number() }))
    .query(async ({ ctx, input }) => {
      const rating = await getUserPlaylistRating(ctx.user.id, input.playlistId);
      return rating;
    }),

  /**
   * Get rating stats for a playlist
   */
  getRatingStats: publicProcedure
    .input(z.object({ playlistId: z.number() }))
    .query(async ({ input }) => {
      const stats = await getPlaylistRatingStats(input.playlistId);
      return stats;
    }),

  /**
   * Delete user's rating
   */
  deleteRating: protectedProcedure
    .input(z.object({ playlistId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deletePlaylistRating(ctx.user.id, input.playlistId);
      return { success: true };
    }),

  /**
   * Get AI track suggestions for a playlist
   */
  getSuggestions: protectedProcedure
    .input(
      z.object({
        playlistId: z.number(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      const playlist = await getPlaylistWithTracks(input.playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }

      const playlistTracks = playlist.tracks.map((t) => ({
        id: t.trackId || 0,
        title: t.trackTitle || "Unknown",
        albumTitle: t.albumTitle || undefined,
      }));

      const excludeTrackIds = playlistTracks.map((t) => t.id);

      const suggestions = await suggestTracksForPlaylist(
        playlistTracks,
        excludeTrackIds,
        input.limit
      );

      return suggestions;
    }),

  /**
   * Get playlist statistics for current user
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getPlaylistStats(ctx.user.id);
    return stats;
  }),
});
