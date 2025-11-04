import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformConstraints } from "./types";

/**
 * Udio platform adapter
 */
export class UdioAdapter extends BasePlatformAdapter {
  name = "udio" as const;
  displayName = "Udio";
  
  constraints(): PlatformConstraints {
    return {
      title: {
        name: "title",
        maxChars: 100,
        required: true,
        description: "Song title"
      },
      prompt: {
        name: "prompt",
        maxChars: 250,
        required: true,
        description: "Genre, style, and mood description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 2500,
        required: false,
        description: "Song lyrics"
      }
    };
  }
  
  bestPractices(): string[] {
    return [
      "Specify clear genre combinations: indie pop, synthwave, jazz fusion",
      "Include vocal style: raspy male vocals, ethereal female voice, choir",
      "Mention instrumentation: piano-driven, guitar-heavy, electronic beats",
      "Add production style: lo-fi, polished studio, raw live recording",
      "Use tempo descriptors: upbeat, slow burn, driving rhythm",
      "Include emotional tone: nostalgic, triumphant, introspective",
      "Structure lyrics naturally without strict tags (Udio infers structure)",
      "Keep line lengths consistent for better flow",
      "Avoid overly abstract or complex metaphors"
    ];
  }
  
  getExportInstructions(): string {
    return `To use this song on Udio:
1. Visit https://udio.com
2. Click "Create" to start a new generation
3. Enter the title
4. Paste the prompt into the description field
5. Toggle "Custom Lyrics" and paste the lyrics
6. Click "Create" to generate

Udio will create variations. You can extend, remix, or adjust the prompt for refinement.`;
  }
}
