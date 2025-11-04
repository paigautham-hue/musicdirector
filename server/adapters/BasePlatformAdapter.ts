import { invokeLLM } from "../_core/llm";
import type { GenerationInput, GenerationResult, PlatformAdapter, PlatformConstraints, PlatformName } from "./types";

/**
 * Base class for platform adapters
 * Provides common functionality like auto-fit compression
 */
export abstract class BasePlatformAdapter implements PlatformAdapter {
  abstract name: PlatformName;
  abstract displayName: string;
  
  abstract constraints(): PlatformConstraints;
  abstract bestPractices(): string[];
  abstract getExportInstructions(): string;
  
  /**
   * Generate music via API - override in subclass when API is available
   * Default implementation throws error indicating API not configured
   */
  async generateMusic(params: {
    title: string;
    lyrics: string;
    prompt: string;
    style: string;
    duration?: number;
  }): Promise<{ jobId: string; estimatedTime?: number }> {
    throw new Error(`Music generation API not configured for ${this.displayName}. Please add API keys in admin settings.`);
  }
  
  /**
   * Check job status - override in subclass when API is available
   */
  async checkJobStatus(jobId: string): Promise<{
    completed: boolean;
    failed: boolean;
    progress?: number;
    message?: string;
    error?: string;
    audioUrl?: string;
  }> {
    throw new Error(`Job status checking not configured for ${this.displayName}`);
  }
  
  /**
   * Default implementation uses LLM to intelligently compress content
   */
  async autoFit(content: {
    prompt: string;
    lyrics: string;
    title: string;
  }): Promise<{
    prompt: string;
    lyrics: string;
    title: string;
  }> {
    const constraints = this.constraints();
    const needsCompression = 
      (constraints.prompt.maxChars && content.prompt.length > constraints.prompt.maxChars) ||
      (constraints.lyrics.maxChars && content.lyrics.length > constraints.lyrics.maxChars) ||
      (constraints.title.maxChars && content.title.length > constraints.title.maxChars);
    
    if (!needsCompression) {
      return content;
    }
    
    // Use LLM to intelligently compress while preserving key elements
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert music prompt optimizer for ${this.displayName}. Compress content to fit character limits while preserving:
- Emotional arc and hooks
- Singability and rhyme scheme
- Key sensory details and verbs
- Thematic clarity

Constraints:
${JSON.stringify(constraints, null, 2)}`
        },
        {
          role: "user",
          content: `Optimize this content to fit the platform limits:

Title (max ${constraints.title.maxChars || 'unlimited'} chars): ${content.title}

Prompt (max ${constraints.prompt.maxChars || 'unlimited'} chars): ${content.prompt}

Lyrics (max ${constraints.lyrics.maxChars || 'unlimited'} chars):
${content.lyrics}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "optimized_content",
          strict: true,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              prompt: { type: "string" },
              lyrics: { type: "string" }
            },
            required: ["title", "prompt", "lyrics"],
            additionalProperties: false
          }
        }
      }
    });
    
    const messageContent = response.choices[0].message.content;
    const optimized = JSON.parse(typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent));
    return optimized;
  }
  
  /**
   * Default implementation returns instructions for manual use
   * Override in subclass if platform has public API
   */
  async generate(input: GenerationInput): Promise<GenerationResult> {
    return {
      success: true,
      platformPayload: input,
      error: undefined
    };
  }
}
