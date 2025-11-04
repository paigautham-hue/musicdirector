/**
 * Platform adapter types and interfaces
 */

export type PlatformName = "suno" | "udio" | "elevenlabs" | "mubert" | "stable_audio";

export interface FieldConstraint {
  name: string;
  maxChars?: number;
  required: boolean;
  description: string;
}

export interface PlatformConstraints {
  prompt: FieldConstraint;
  lyrics: FieldConstraint;
  title: FieldConstraint;
  style?: FieldConstraint;
  [key: string]: FieldConstraint | undefined;
}

export interface GenerationInput {
  prompt: string;
  lyrics?: string;
  style?: string;
  title?: string;
  seed?: number;
  [key: string]: any;
}

export interface GenerationResult {
  success: boolean;
  previewUrl?: string;
  platformPayload?: any;
  error?: string;
}

export interface PlatformAdapter {
  name: PlatformName;
  displayName: string;
  
  /**
   * Get field constraints for this platform
   */
  constraints(): PlatformConstraints;
  
  /**
   * Get best practices and tips for this platform
   */
  bestPractices(): string[];
  
  /**
   * Auto-fit content to platform constraints
   * Intelligently compresses while preserving emotional arc and singability
   */
  autoFit(content: {
    prompt: string;
    lyrics: string;
    title: string;
  }): Promise<{
    prompt: string;
    lyrics: string;
    title: string;
  }>;
  
  /**
   * Generate music (if API available)
   * Otherwise returns formatted payload for manual use
   */
  generate(input: GenerationInput): Promise<GenerationResult>;
  
  /**
   * Get export instructions for manual use
   */
  getExportInstructions(): string;
  
  /**
   * Generate music via API (when available)
   */
  generateMusic(params: {
    title: string;
    lyrics: string;
    prompt: string;
    style: string;
    duration?: number;
  }): Promise<{
    jobId: string;
    estimatedTime?: number;
  }>;
  
  /**
   * Check status of music generation job
   */
  checkJobStatus(jobId: string): Promise<{
    completed: boolean;
    failed: boolean;
    progress?: number;
    message?: string;
    error?: string;
    audioUrl?: string;
  }>;
}
