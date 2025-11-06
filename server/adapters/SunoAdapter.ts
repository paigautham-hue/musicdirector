import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformConstraints, GenerationResult } from "./types";
import { getSunoClient } from "../sunoApiClient";

/**
 * Suno AI platform adapter
 * Based on current Suno v3.5 constraints (as of 2024)
 */
export class SunoAdapter extends BasePlatformAdapter {
  name = "suno" as const;
  displayName = "Suno AI";
  
  constraints(): PlatformConstraints {
    return {
      title: {
        name: "title",
        maxChars: 80,
        required: true,
        description: "Song title"
      },
      prompt: {
        name: "prompt",
        maxChars: 1000, // V5 supports up to 1000 chars for style
        required: true,
        description: "Style and mood description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 5000, // V5 supports up to 5000 chars for lyrics
        required: false,
        description: "Song lyrics with [Verse], [Chorus], [Bridge] tags"
      }
    };
  }
  
  bestPractices(): string[] {
    return [
      "Use genre tags like [pop], [rock], [electronic] in the prompt",
      "Include mood descriptors: upbeat, melancholic, energetic, dreamy",
      "Structure lyrics with [Verse], [Chorus], [Bridge], [Outro] tags",
      "Keep verses 4-8 lines, choruses 2-4 lines for best results",
      "Specify tempo hints: fast-paced, slow ballad, mid-tempo groove",
      "Add instrumental hints: acoustic guitar, synth pads, heavy drums",
      "Use descriptive language: soaring vocals, gritty bass, shimmering keys",
      "Avoid overly complex or tongue-twisting lyrics",
      "Keep consistent syllable counts per line for singability"
    ];
  }
  
  getExportInstructions(): string {
    return `To use this song on Suno AI:
1. Visit https://suno.ai
2. Click "Create" and choose "Custom Mode"
3. Paste the title into the title field
4. Paste the prompt into the style/genre field
5. Paste the lyrics into the lyrics field
6. Click "Create" to generate your song

Suno will generate 2 variations. You can extend, remix, or regenerate as needed.`;
  }

  /**
   * Generate music using Suno AI V5 API
   */
  async generateMusic(params: {
    title: string;
    prompt: string;
    lyrics?: string;
    instrumental?: boolean;
  }): Promise<GenerationResult> {
    const client = await getSunoClient();
    
    if (!client) {
      throw new Error("Suno API key not configured. Please add it in Admin Settings.");
    }

    try {
      // Generate music using V5 model
      const response = await client.generateMusic({
        title: params.title,
        style: params.prompt,
        prompt: params.lyrics || params.prompt,
        customMode: true, // Always use custom mode for precise control
        instrumental: params.instrumental || false,
        model: "V5", // Always use latest V5 model
      });

      return {
        success: true,
        jobId: response.data.taskId,
        message: "Music generation started. This may take 1-2 minutes."
      };
    } catch (error: any) {
      console.error("[Suno] Generation failed:", error);
      return {
        success: false,
        error: error.message || "Failed to generate music"
      };
    }
  }

  /**
   * Check the status of a music generation job
   */
  async checkJobStatus(jobId: string): Promise<{
    completed: boolean;
    failed: boolean;
    progress?: number;
    message?: string;
    error?: string;
    audioUrl?: string;
  }> {
    const client = await getSunoClient();
    
    if (!client) {
      return {
        completed: false,
        failed: true,
        error: "Suno API key not configured"
      };
    }

    try {
      const taskStatus = await client.getTaskStatus(jobId);
      const statusValue = taskStatus.data.status;
      
      // Calculate progress based on status
      let progress = 0;
      if (statusValue === "TEXT_SUCCESS") progress = 50;
      else if (statusValue === "FIRST_SUCCESS") progress = 90;
      else if (statusValue === "SUCCESS") progress = 100;
      
      // Extract audio URL from response (handles both 'sunoData' and 'data' formats)
      const audioData = taskStatus.data.response?.sunoData?.[0] || taskStatus.data.response?.data?.[0];
      const audioUrl = audioData?.audioUrl || audioData?.audio_url;
      
      return {
        completed: statusValue === "SUCCESS",
        failed: statusValue === "CREATE_TASK_FAILED" || statusValue === "GENERATE_AUDIO_FAILED" || statusValue === "CALLBACK_EXCEPTION" || statusValue === "SENSITIVE_WORD_ERROR",
        progress,
        audioUrl,
        error: taskStatus.data.errorMessage,
        message: statusValue === "SUCCESS" ? "Music generation completed" : undefined
      };
    } catch (error: any) {
      console.error("[Suno] Status check failed:", error);
      return {
        completed: false,
        failed: true,
        error: error.message
      };
    }
  }
}
