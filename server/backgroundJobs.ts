/**
 * Background Job Processor
 * Processes album generation jobs asynchronously
 * Continues even when users leave the website
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { musicJobs, albums, tracks, trackAssets, audioFiles } from "../drizzle/schema";
import { getSunoClient } from "./sunoApiClient";
import { storagePut } from "./storage";

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
    
    // Get ONE pending job at a time to avoid API rate limits
    let pendingJobs;
    try {
      pendingJobs = await db
        .select()
        .from(musicJobs)
        .where(eq(musicJobs.status, "pending"))
        .limit(1); // Process one song at a time
    } catch (dbError) {
      // Database connection error - skip this cycle
      console.warn("[Background Jobs] Database connection error, will retry next cycle");
      return;
    }
    
    if (pendingJobs.length === 0) {
      return;
    }
    
    if (pendingJobs.length > 0) {
      console.log(`[Background Jobs] Processing job ${pendingJobs[0].id} for track ${pendingJobs[0].trackId}`);
    }
    
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
  
  console.log(`[Background Jobs] ======================================`);
  console.log(`[Background Jobs] Processing job ${job.id} for album ${job.albumId}`);
  console.log(`[Background Jobs] Job details: trackId=${job.trackId}, platform=${job.platform}, platformJobId=${job.platformJobId || 'null'}`);
  
  // Update status to processing
  await db
    .update(musicJobs)
    .set({
      status: "processing",
      startedAt: new Date(),
    })
    .where(eq(musicJobs.id, job.id));
  
  console.log(`[Background Jobs] Updated job ${job.id} status to 'processing'`);
  
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
  
  console.log(`[Background Jobs] Requesting NEW music generation for track ${track.id}: "${track.title}"`);
  console.log(`[Background Jobs] Request params: customMode=${!!lyrics}, instrumental=${!lyrics}, model=V5`);
  
  let result;
  try {
    result = await sunoClient.generateMusic({
      prompt: lyrics || prompt, // Use lyrics as prompt if available
      style: prompt, // Style description
      title: track.title,
      customMode: !!lyrics, // Custom mode if we have lyrics
      instrumental: !lyrics, // Instrumental if no lyrics
      model: "V5",
      callBackUrl: "https://webhook.site/suno-callback", // Required by Suno API
    });
    console.log(`[Background Jobs] Suno API request successful! Got taskId: ${result.data.taskId}`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[Background Jobs] Suno API generateMusic FAILED for track ${track.id}:`, {
      error: errorMsg,
      stack: errorStack
    });
    throw new Error(`Failed to start music generation: ${errorMsg}`);
  }
  
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
  
  const maxAttempts = 180; // 15 minutes max (5 second intervals)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Wait 5 seconds between polls
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      const status = await sunoClient.getTaskStatus(platformJobId);
      
      // Suno API returns uppercase status values: PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS
      const statusValue = status.data.status;
      
      // Update progress based on status
      if (statusValue === "TEXT_SUCCESS") {
        await db.update(musicJobs)
          .set({ progress: 50 })
          .where(eq(musicJobs.id, job.id));
      } else if (statusValue === "FIRST_SUCCESS") {
        await db.update(musicJobs)
          .set({ progress: 90 })
          .where(eq(musicJobs.id, job.id));
      }
      
      if (statusValue === "SUCCESS") {
        // Music generation completed - extract audio URL from response
        // API docs show both 'sunoData' and 'data' formats
        const audioData = status.data.response?.sunoData?.[0] || status.data.response?.data?.[0];
        const audioUrl = audioData?.audioUrl || audioData?.audio_url;
        
        if (audioData && audioUrl) {
          // Download audio from Suno and upload to S3 for permanent storage
          console.log(`[Background Jobs] Downloading audio for track ${trackId} from ${audioUrl}`);
          const audioResponse = await fetch(audioUrl);
          if (!audioResponse.ok) {
            throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
          }
          const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
          
          // Upload to S3
          const fileKey = `music/${job.albumId}/${trackId}/${Date.now()}.mp3`;
          const { url: s3Url } = await storagePut(fileKey, audioBuffer, "audio/mpeg");
          console.log(`[Background Jobs] Uploaded audio to S3: ${s3Url}`);
          
          // Save audio file to database with S3 URL
          await db.insert(audioFiles).values({
            trackId,
            jobId: job.id,
            fileUrl: s3Url,
            fileKey,
            fileName: `track-${trackId}.mp3`,
            fileSize: audioBuffer.length,
            duration: Math.floor(audioData.duration || 0),
            format: "mp3",
            isActive: true,
          });
          
          console.log(`[Background Jobs] Music generated and stored for track ${trackId}`);
          return;
        } else {
          throw new Error('Audio URL not found in response');
        }
      } else if (statusValue === "CREATE_TASK_FAILED" || statusValue === "GENERATE_AUDIO_FAILED" || statusValue === "CALLBACK_EXCEPTION" || statusValue === "SENSITIVE_WORD_ERROR") {
        const errorDetail = status.data.errorMessage || statusValue;
        console.error(`[Background Jobs] Suno API error for track ${trackId}:`, {
          status: statusValue,
          errorCode: status.data.errorCode,
          errorMessage: status.data.errorMessage,
          fullResponse: JSON.stringify(status.data)
        });
        throw new Error(`Music generation failed: ${errorDetail}`);
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
  
  // Timeout after 15 minutes of polling
  console.error(`[Background Jobs] Music generation timed out for track ${trackId} after ${maxAttempts * 5} seconds`);
  throw new Error(`Generation timed out after ${Math.floor(maxAttempts * 5 / 60)} minutes. The Suno API is taking longer than expected. Please try again later or contact support if this persists.`);
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
