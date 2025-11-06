/**
 * Background Job Processor
 * Processes album generation jobs asynchronously
 * Continues even when users leave the website
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { musicJobs, albums, tracks, trackAssets, audioFiles } from "../drizzle/schema";
import { getSunoClient } from "./sunoApiClient";

let isProcessing = false;
let processingInterval: NodeJS.Timeout | null = null;

/**
 * Start the background job processor
 * Polls for pending jobs every 30 seconds
 */
export function startJobProcessor() {
  if (processingInterval) {
    console.log("[Background Jobs] Processor already running");
    return;
  }
  
  console.log("[Background Jobs] Starting job processor...");
  
  // Process immediately on start
  processJobs().catch(err => {
    console.error("[Background Jobs] Initial processing error:", err);
  });
  
  // Then process every 30 seconds
  processingInterval = setInterval(() => {
    processJobs().catch(err => {
      console.error("[Background Jobs] Processing error:", err);
    });
  }, 30000); // 30 seconds
  
  console.log("[Background Jobs] Processor started");
}

/**
 * Stop the background job processor
 */
export function stopJobProcessor() {
  if (processingInterval) {
    clearInterval(processingInterval);
    processingInterval = null;
    console.log("[Background Jobs] Processor stopped");
  }
}

/**
 * Process pending jobs
 */
async function processJobs() {
  if (isProcessing) {
    return;
  }
  
  isProcessing = true;
  
  try {
    const db = await getDb();
    if (!db) {
      return;
    }
    
    // Get pending jobs with error handling
    let pendingJobs;
    try {
      pendingJobs = await db
        .select()
        .from(musicJobs)
        .where(eq(musicJobs.status, "pending"))
        .limit(5);
    } catch (dbError) {
      // Database connection error - skip this cycle
      console.warn("[Background Jobs] Database connection error, will retry next cycle");
      return;
    }
    
    if (pendingJobs.length === 0) {
      return;
    }
    
    console.log(`[Background Jobs] Found ${pendingJobs.length} pending jobs`);
    
    // Process each job
    for (const job of pendingJobs) {
      try {
        await processJob(job);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error(`[Background Jobs] Job ${job.id} failed:`, {
          error: errorMessage,
          stack: errorStack,
          trackId: job.trackId,
          albumId: job.albumId
        });
        
        await db
          .update(musicJobs)
          .set({
            status: "failed",
            errorMessage,
            completedAt: new Date(),
          })
          .where(eq(musicJobs.id, job.id));
      }
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a single job
 */
async function processJob(job: typeof musicJobs.$inferSelect) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log(`[Background Jobs] Processing job ${job.id} for album ${job.albumId}`);
  
  // Update status to processing
  await db
    .update(musicJobs)
    .set({
      status: "processing",
      startedAt: new Date(),
    })
    .where(eq(musicJobs.id, job.id));
  
  // Get album details
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, job.albumId))
    .limit(1);
  
  if (!album) {
    throw new Error(`Album ${job.albumId} not found`);
  }
  
  // If trackId is specified, generate music for that specific track
  if (job.trackId) {
    await generateMusicForTrack(job, album);
  }
  
  // Update job status to completed
  await db
    .update(musicJobs)
    .set({
      status: "completed",
      progress: 100,
      completedAt: new Date(),
    })
    .where(eq(musicJobs.id, job.id));
  
  console.log(`[Background Jobs] Job ${job.id} completed`);
}

/**
 * Generate music for a specific track
 */
async function generateMusicForTrack(
  job: typeof musicJobs.$inferSelect,
  album: typeof albums.$inferSelect
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (!job.trackId) {
    throw new Error("Track ID not specified");
  }
  
  // Get track details
  const [track] = await db
    .select()
    .from(tracks)
    .where(eq(tracks.id, job.trackId))
    .limit(1);
  
  if (!track) {
    throw new Error(`Track ${job.trackId} not found`);
  }
  
  // Get track assets (prompt, lyrics, etc.)
  const assets = await db
    .select()
    .from(trackAssets)
    .where(eq(trackAssets.trackId, track.id));
  
  const promptAsset = assets.find(a => a.type === "prompt");
  const lyricsAsset = assets.find(a => a.type === "lyrics");
  
  if (!promptAsset) {
    throw new Error(`No prompt found for track ${track.id}`);
  }
  
  // Generate music using Suno API
  const sunoClient = await getSunoClient();
  if (!sunoClient) {
    throw new Error("Suno API client not configured");
  }
  
  // Parse prompt to extract style information
  const prompt = promptAsset.content;
  const lyrics = lyricsAsset?.content || "";
  
  const result = await sunoClient.generateMusic({
    prompt: lyrics || prompt, // Use lyrics as prompt if available
    style: prompt, // Style description
    title: track.title,
    customMode: !!lyrics, // Custom mode if we have lyrics
    instrumental: !lyrics, // Instrumental if no lyrics
    model: "V5",
    callBackUrl: "https://webhook.site/suno-callback", // Required by Suno API
  });
  
  // Update job with platform job ID
  await db
    .update(musicJobs)
    .set({
      platformJobId: result.data.taskId,
      progress: 50,
      statusMessage: "Music generation in progress",
    })
    .where(eq(musicJobs.id, job.id));
  
  // Poll for completion
  await pollMusicGenerationStatus(job, result.data.taskId, track.id);
}

/**
 * Poll Suno API for music generation status
 */
async function pollMusicGenerationStatus(
  job: typeof musicJobs.$inferSelect,
  platformJobId: string,
  trackId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const sunoClient = await getSunoClient();
  if (!sunoClient) {
    throw new Error("Suno API client not configured");
  }
  
  const maxAttempts = 120; // 10 minutes max (5 second intervals)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait 5 seconds between polls
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const status = await sunoClient.getTaskStatus(platformJobId);
      
      // Suno API returns uppercase status values: PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS
      const statusValue = status.data.status?.toUpperCase();
      
      if (statusValue === "SUCCESS" || statusValue === "FIRST_SUCCESS") {
        // Music generation completed
        if (status.data.audioUrl) {
          // Save audio file to database
          await db.insert(audioFiles).values({
            trackId,
            jobId: job.id,
            fileUrl: status.data.audioUrl,
            fileKey: `suno/${platformJobId}`,
            fileName: `track-${trackId}.mp3`,
            duration: Math.floor(status.data.duration || 0),
            format: "mp3",
            isActive: true,
          });
          
          console.log(`[Background Jobs] Music generated for track ${trackId}`);
          return;
        }
      } else if (statusValue === "FAILED" || statusValue === "ERROR") {
        throw new Error(`Music generation failed: ${status.data.error || 'Unknown error'}`);
      }
      
      // Still processing, continue polling
      console.log(`[Background Jobs] Track ${trackId} status: ${statusValue || status.data.status}`);
      
      // Update job progress based on status
      if (statusValue === "TEXT_SUCCESS") {
        await db
          .update(musicJobs)
          .set({ progress: 50, statusMessage: "Generating audio..." })
          .where(eq(musicJobs.id, job.id));
      } else if (statusValue === "FIRST_SUCCESS") {
        await db
          .update(musicJobs)
          .set({ progress: 90, statusMessage: "Finalizing..." })
          .where(eq(musicJobs.id, job.id));
      }
    } catch (error) {
      console.error(`[Background Jobs] Error polling status:`, error);
      throw error;
    }
  }
  
  throw new Error("Music generation timed out");
}

/**
 * Create a background job for track generation
 */
export async function createTrackGenerationJob(
  albumId: number,
  trackId: number,
  platform: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [job] = await db
    .insert(musicJobs)
    .values({
      albumId,
      trackId,
      platform,
      status: "pending",
      progress: 0,
    })
    .$returningId();
  
  console.log(`[Background Jobs] Created job ${job.id} for track ${trackId}`);
  
  return job.id;
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [job] = await db
    .select()
    .from(musicJobs)
    .where(eq(musicJobs.id, jobId))
    .limit(1);
  
  return job;
}
