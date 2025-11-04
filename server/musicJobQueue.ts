import { getDb } from "./db";
import { musicJobs, audioFiles, tracks, trackAssets, albums } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getPlatformAdapter } from "./adapters";
import { storagePut } from "./storage";

/**
 * Music Generation Job Queue
 * Handles async music generation with platform APIs
 */

export interface MusicGenerationJob {
  id: number;
  albumId: number;
  trackId: number;
  platform: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
}

/**
 * Create a music generation job for a track
 */
export async function createMusicJob(albumId: number, trackId: number, platform: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [job] = await db.insert(musicJobs).values({
    albumId,
    trackId,
    platform,
    status: "pending",
    progress: 0,
  }).$returningId();

  return job.id;
}

/**
 * Process a music generation job
 */
export async function processMusicJob(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get job details
  const [job] = await db.select().from(musicJobs).where(eq(musicJobs.id, jobId)).limit(1);
  if (!job) throw new Error("Job not found");

  try {
    // Update status to processing
    await db.update(musicJobs)
      .set({ 
        status: "processing", 
        startedAt: new Date(),
        statusMessage: "Initializing music generation..."
      })
      .where(eq(musicJobs.id, jobId));

    // Get track details
    const [track] = await db.select().from(tracks).where(eq(tracks.id, job.trackId!)).limit(1);
    if (!track) throw new Error("Track not found");

    // Get track assets (lyrics, prompt, etc.)
    const assets = await db.select().from(trackAssets).where(eq(trackAssets.trackId, track.id));
    
    const lyrics = assets.find(a => a.type === "lyrics")?.content || "";
    const prompt = assets.find(a => a.type === "prompt")?.content || "";

    // Get platform adapter
    const adapter = getPlatformAdapter(job.platform);

    // Update progress
    await db.update(musicJobs)
      .set({ progress: 25, statusMessage: "Submitting to platform API..." })
      .where(eq(musicJobs.id, jobId));

    // Generate music using platform API
    const result = await adapter.generateMusic({
      title: track.title,
      lyrics,
      prompt,
      style: track.moodTags || "",
      duration: 180, // 3 minutes default
    });

    // Update progress
    await db.update(musicJobs)
      .set({ progress: 50, statusMessage: "Music generation in progress...", platformJobId: result.jobId })
      .where(eq(musicJobs.id, jobId));

    // Poll for completion (this would be replaced with webhook in production)
    const audioUrl = await pollForCompletion(adapter, result.jobId, jobId);

    // Update progress
    await db.update(musicJobs)
      .set({ progress: 75, statusMessage: "Downloading and storing audio..." })
      .where(eq(musicJobs.id, jobId));

    // Download audio and upload to S3
    const audioResponse = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    
    const fileKey = `music/${job.albumId}/${track.id}/${Date.now()}.mp3`;
    const { url: s3Url } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    // Store audio file record
    await db.insert(audioFiles).values({
      trackId: track.id,
      jobId: job.id,
      fileUrl: s3Url,
      fileKey,
      fileName: `${track.title}.mp3`,
      fileSize: audioBuffer.length,
      format: "mp3",
      isActive: true,
    });

    // Update job as completed
    await db.update(musicJobs)
      .set({ 
        status: "completed", 
        progress: 100,
        statusMessage: "Music generation completed!",
        completedAt: new Date()
      })
      .where(eq(musicJobs.id, jobId));

    return { success: true, audioUrl: s3Url };

  } catch (error: any) {
    // Update job as failed
    await db.update(musicJobs)
      .set({ 
        status: "failed",
        errorMessage: error.message,
        completedAt: new Date()
      })
      .where(eq(musicJobs.id, jobId));

    throw error;
  }
}

/**
 * Poll platform API for job completion
 * In production, this would be replaced with webhook callbacks
 */
async function pollForCompletion(adapter: any, platformJobId: string, jobId: number, maxAttempts = 60): Promise<string> {
  const db = await getDb();
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await adapter.checkJobStatus(platformJobId);
    
    if (status.completed) {
      return status.audioUrl;
    }
    
    if (status.failed) {
      throw new Error(status.error || "Music generation failed");
    }

    // Update progress based on platform feedback
    if (db && status.progress) {
      await db.update(musicJobs)
        .set({ 
          progress: Math.min(50 + Math.floor(status.progress / 2), 90),
          statusMessage: status.message || "Generating music..."
        })
        .where(eq(musicJobs.id, jobId));
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error("Music generation timeout");
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [job] = await db.select().from(musicJobs).where(eq(musicJobs.id, jobId)).limit(1);
  return job;
}

/**
 * Get all jobs for an album
 */
export async function getAlbumJobs(albumId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(musicJobs).where(eq(musicJobs.albumId, albumId));
}

/**
 * Retry a failed job
 */
export async function retryJob(jobId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [job] = await db.select().from(musicJobs).where(eq(musicJobs.id, jobId)).limit(1);
  if (!job) throw new Error("Job not found");

  const retryCount = job.retryCount || 0;
  
  if (retryCount >= 3) {
    throw new Error("Maximum retry attempts reached");
  }

  await db.update(musicJobs)
    .set({ 
      status: "pending",
      progress: 0,
      errorMessage: null,
      retryCount: retryCount + 1,
    })
    .where(eq(musicJobs.id, jobId));

  // Process the job
  return processMusicJob(jobId);
}

/**
 * Generate music for entire album
 */
export async function generateAlbumMusic(albumId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get album and tracks
  const [album] = await db.select().from(albums).where(eq(albums.id, albumId)).limit(1);
  if (!album) throw new Error("Album not found");

  const albumTracks = await db.select().from(tracks).where(eq(tracks.albumId, albumId));

  // Create jobs for all tracks
  const jobIds = [];
  for (const track of albumTracks) {
    const jobId = await createMusicJob(albumId, track.id, album.platform);
    jobIds.push(jobId);
  }

  // Process jobs sequentially (could be parallelized with worker pool)
  const results = [];
  for (const jobId of jobIds) {
    try {
      const result = await processMusicJob(jobId);
      results.push({ jobId, success: true, result });
    } catch (error: any) {
      results.push({ jobId, success: false, error: error.message });
    }
  }

  return results;
}
