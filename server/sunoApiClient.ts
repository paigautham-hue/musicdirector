/**
 * Suno API Client
 * Official API documentation: https://sunoapi.org/docs
 * Always uses the latest V5 model for superior musical expression
 */

export interface SunoGenerateRequest {
  prompt: string; // Lyrics (max 5000 chars for V5) or description
  style: string; // Music style/genre (max 1000 chars for V5)
  title: string; // Track title (max 80 chars)
  customMode: boolean; // true for custom mode with exact lyrics
  instrumental: boolean; // true for no vocals
  personaId?: string; // Optional persona ID
  model: "V5" | "V4_5PLUS" | "V4_5" | "V4" | "V3_5"; // Always use V5 by default
  negativeTags?: string; // Styles to exclude
  vocalGender?: "m" | "f"; // Preferred vocal gender
  styleWeight?: number; // 0-1, weight of style guidance
  weirdnessConstraint?: number; // 0-1, creative deviation
  audioWeight?: number; // 0-1, input audio influence
  callBackUrl?: string; // Webhook URL for completion notification
}

export interface SunoGenerateResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface SunoTaskStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: "pending" | "processing" | "completed" | "failed";
    progress?: number; // 0-100
    audioUrl?: string; // URL to download the generated audio
    duration?: number; // Duration in seconds
    error?: string; // Error message if failed
  };
}

export class SunoApiClient {
  private apiKey: string;
  private baseUrl = "https://api.sunoapi.org";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate music using Suno AI V5 model
   */
  async generateMusic(request: SunoGenerateRequest): Promise<SunoGenerateResponse> {
    const response = await fetch(`${this.baseUrl}/api/v1/generate`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...request,
        model: request.model || "V5", // Always default to V5
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ msg: response.statusText }));
      throw new Error(`Suno API error: ${error.msg || response.statusText}`);
    }

    const data: SunoGenerateResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`Suno API error (code ${data.code}): ${data.msg}`);
    }

    return data;
  }

  /**
   * Check the status of a music generation task
   */
  async getTaskStatus(taskId: string): Promise<SunoTaskStatus> {
    const response = await fetch(`${this.baseUrl}/api/v1/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ msg: response.statusText }));
      throw new Error(`Suno API error: ${error.msg || response.statusText}`);
    }

    const data: SunoTaskStatus = await response.json();

    if (data.code !== 200) {
      throw new Error(`Suno API error (code ${data.code}): ${data.msg}`);
    }

    return data;
  }

  /**
   * Download the generated audio file
   */
  async downloadAudio(audioUrl: string): Promise<Buffer> {
    const response = await fetch(audioUrl);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

/**
 * Get Suno API client instance with API key from settings
 */
export async function getSunoClient(): Promise<SunoApiClient | null> {
  const { getSystemSetting } = await import("./db");
  const setting = await getSystemSetting("suno_api_key");

  if (!setting || !setting.value) {
    console.warn("[Suno] API key not configured");
    return null;
  }

  return new SunoApiClient(setting.value);
}
