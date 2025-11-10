import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as aiRec from "../aiRecommendations";
import * as db from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const recommendationsRouter = router({
  /**
   * Get Staff Picks - Top-rated tracks (85+)
   */
  getStaffPicks: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20)
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 20;
      return await aiRec.getRecommendedTracks("staff_pick", limit);
    }),

  /**
   * Get Trending Potential - Songs likely to go viral (75-84)
   */
  getTrendingPotential: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20)
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 20;
      return await aiRec.getRecommendedTracks("trending_potential", limit);
    }),

  /**
   * Get Hidden Gems - High quality but undiscovered (70-84)
   */
  getHiddenGems: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20)
    }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit || 20;
      return await aiRec.getRecommendedTracks("hidden_gem", limit);
    }),

  /**
   * Admin: Analyze a single track
   */
  analyzeTrack: adminProcedure
    .input(z.object({
      trackId: z.number()
    }))
    .mutation(async ({ input }) => {
      try {
        const analysis = await aiRec.analyzeTrack(input.trackId);
        return {
          success: true,
          analysis
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to analyze track'
        });
      }
    }),

  /**
   * Admin: Analyze all tracks in the database
   */
  analyzeAllTracks: adminProcedure
    .mutation(async () => {
      try {
        const results = await aiRec.analyzeAllTracks();
        return {
          success: true,
          ...results
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to analyze tracks'
        });
      }
    }),

  /**
   * Get track analysis details (for admins)
   */
  getTrackAnalysis: adminProcedure
    .input(z.object({
      trackId: z.number()
    }))
    .query(async ({ input }) => {
      const track = await db.getTrackById(input.trackId);
      if (!track) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Track not found' });
      }

      return {
        id: track.id,
        title: track.title,
        score: track.score,
        scoreBreakdown: track.scoreBreakdown ? JSON.parse(track.scoreBreakdown) : null
      };
    }),
});
