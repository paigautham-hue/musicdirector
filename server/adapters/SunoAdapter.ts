import { BasePlatformAdapter } from "./BasePlatformAdapter";
import type { PlatformConstraints } from "./types";

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
        maxChars: 200,
        required: true,
        description: "Style and mood description"
      },
      lyrics: {
        name: "lyrics",
        maxChars: 3000,
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
}
