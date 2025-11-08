import { getDb } from "./db";
import { musicJobs, users } from "../drizzle/schema";
import { eq, and, lt, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const TIMEOUT_MINUTES = 20;

/**
 * Check for stuck music generation jobs and mark them as failed
 * Runs periodically to detect jobs that have been pending for too long
 */
export async function checkStuckJobs() {
  const db = await getDb();
  if (!db) {
    console.warn("[TimeoutHandler] Database not available");
    return { checked: 0, failed: 0 };
  }

  try {
    // Calculate timeout threshold (20 minutes ago)
    const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

    // Find jobs that are pending/processing and older than threshold
    const stuckJobs = await db
      .select({
        id: musicJobs.id,
        albumId: musicJobs.albumId,
        trackId: musicJobs.trackId,
        status: musicJobs.status,
        createdAt: musicJobs.createdAt,
      })
      .from(musicJobs)
      .where(
        and(
          sql`${musicJobs.status} IN ('pending', 'processing')`,
          lt(musicJobs.createdAt, timeoutThreshold)
        )
      );

    if (stuckJobs.length === 0) {
      return { checked: 0, failed: 0 };
    }

    console.log(`[TimeoutHandler] Found ${stuckJobs.length} stuck jobs`);

    // Mark each stuck job as failed
    for (const job of stuckJobs) {
      await db
        .update(musicJobs)
        .set({
          status: "failed",
          errorMessage: `Generation timed out after ${TIMEOUT_MINUTES} minutes. Please retry.`,
        })
        .where(eq(musicJobs.id, job.id));
    }

    // Notify admin about stuck jobs
    await notifyOwner({
      title: `${stuckJobs.length} Music Generation Jobs Timed Out`,
      content: `${stuckJobs.length} music generation jobs were automatically marked as failed after ${TIMEOUT_MINUTES} minutes of inactivity. Users have been notified to retry.`,
    });

    console.log(`[TimeoutHandler] Marked ${stuckJobs.length} jobs as failed`);

    return { checked: stuckJobs.length, failed: stuckJobs.length };
  } catch (error) {
    console.error("[TimeoutHandler] Error checking stuck jobs:", error);
    return { checked: 0, failed: 0 };
  }
}

/**
 * Start the timeout handler background job
 * Checks every 5 minutes for stuck jobs
 */
export function startTimeoutHandler() {
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  console.log("[TimeoutHandler] Starting background job (checks every 5 minutes)");

  // Run immediately on start
  checkStuckJobs();

  // Then run periodically
  setInterval(() => {
    checkStuckJobs();
  }, CHECK_INTERVAL);
}
