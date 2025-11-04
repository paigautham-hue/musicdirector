/**
 * Progress tracking for long-running album generation
 */

interface ProgressUpdate {
  stage: string;
  progress: number; // 0-100
  currentTrack?: number;
  totalTracks?: number;
  message: string;
}

const progressStore = new Map<string, ProgressUpdate>();

export function setProgress(jobId: string, update: ProgressUpdate) {
  progressStore.set(jobId, update);
}

export function getProgress(jobId: string): ProgressUpdate | undefined {
  return progressStore.get(jobId);
}

export function clearProgress(jobId: string) {
  progressStore.delete(jobId);
}

export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
