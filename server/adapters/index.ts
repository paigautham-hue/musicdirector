import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformConstraints } from "./types";
import { SunoAdapter } from "./SunoAdapter";
import { UdioAdapter } from "./UdioAdapter";

/**
 * ElevenLabs Music adapter
 */
class ElevenLabsAdapter extends BasePlatformAdapter {
  name = "elevenlabs" as const;
  displayName = "ElevenLabs Music";
  
  constraints(): PlatformConstraints {
    return {
      title: {
        name: "title",
        maxChars: 120,
        required: true,
        description: "Track title"
      },
      prompt: {
        name: "prompt",
        maxChars: 500,
        required: true,
        description: "Detailed music description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 0,
        required: false,
        description: "ElevenLabs generates instrumental music (no lyrics support)"
      }
    };
  }
  
  bestPractices(): string[] {
    return [
      "Focus on instrumental descriptions (no vocal/lyric generation)",
      "Specify mood and atmosphere: ambient, energetic, mysterious",
      "Include instrumentation: orchestral, electronic, acoustic",
      "Mention tempo and rhythm: fast-paced, slow and contemplative",
      "Add production style: cinematic, lo-fi, high-energy",
      "Reference musical eras or styles: 80s synthwave, baroque, modern EDM"
    ];
  }
  
  getExportInstructions(): string {
    return `To use this on ElevenLabs Music:
1. Visit https://elevenlabs.io/music
2. Enter the prompt describing the instrumental track
3. Adjust duration and other settings
4. Click "Generate" to create the music

Note: ElevenLabs Music generates instrumental tracks only (no lyrics).`;
  }
}

/**
 * Mubert adapter
 */
class MubertAdapter extends BasePlatformAdapter {
  name = "mubert" as const;
  displayName = "Mubert";
  
  constraints(): PlatformConstraints {
    return {
      title: {
        name: "title",
        maxChars: 100,
        required: true,
        description: "Track title"
      },
      prompt: {
        name: "prompt",
        maxChars: 300,
        required: true,
        description: "Genre, mood, and activity description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 0,
        required: false,
        description: "Mubert generates instrumental music (no lyrics)"
      }
    };
  }
  
  bestPractices(): string[] {
    return [
      "Use activity-based prompts: workout, focus, relaxation, party",
      "Specify genre clearly: techno, ambient, hip-hop, classical",
      "Include mood: energetic, calm, uplifting, dark",
      "Mention use case: background music, meditation, gaming",
      "Keep prompts simple and direct",
      "Focus on atmosphere over specific instruments"
    ];
  }
  
  getExportInstructions(): string {
    return `To use this on Mubert:
1. Visit https://mubert.com
2. Select "Generate Track"
3. Enter the prompt or select mood/genre tags
4. Set duration
5. Click "Generate"

Mubert specializes in AI-generated background music and soundtracks.`;
  }
}

/**
 * Stable Audio adapter
 */
class StableAudioAdapter extends BasePlatformAdapter {
  name = "stable_audio" as const;
  displayName = "Stable Audio";
  
  constraints(): PlatformConstraints {
    return {
      title: {
        name: "title",
        maxChars: 100,
        required: true,
        description: "Track title"
      },
      prompt: {
        name: "prompt",
        maxChars: 400,
        required: true,
        description: "Detailed audio description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 0,
        required: false,
        description: "Stable Audio generates instrumental music (no lyrics)"
      }
    };
  }
  
  bestPractices(): string[] {
    return [
      "Provide detailed instrumentation: drums, bass, synths, guitars",
      "Specify BPM if important: 120 BPM, 80 BPM",
      "Include genre and subgenre: progressive house, jazz fusion",
      "Mention production quality: studio quality, lo-fi, vintage",
      "Add mood descriptors: euphoric, melancholic, aggressive",
      "Reference musical structure: intro, build-up, drop, outro",
      "Use technical terms: reverb, distortion, compression"
    ];
  }
  
  getExportInstructions(): string {
    return `To use this on Stable Audio:
1. Visit https://stableaudio.com
2. Enter the detailed prompt
3. Adjust duration and settings
4. Click "Generate"

Stable Audio excels at high-quality instrumental music generation with precise control.`;
  }
}

// Export all adapters
export const PLATFORM_ADAPTERS = {
  suno: new SunoAdapter(),
  udio: new UdioAdapter(),
  elevenlabs: new ElevenLabsAdapter(),
  mubert: new MubertAdapter(),
  stable_audio: new StableAudioAdapter()
} as const;

export function getPlatformAdapter(platform: string) {
  const adapter = PLATFORM_ADAPTERS[platform as keyof typeof PLATFORM_ADAPTERS];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}

export * from "./types";
export { SunoAdapter } from "./SunoAdapter";
export { UdioAdapter } from "./UdioAdapter";
