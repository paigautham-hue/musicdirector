/**
 * Curated vibe/mood suggestions to help users describe their desired album aesthetic
 */

export interface VibeCategory {
  name: string;
  vibes: string[];
}

export const VIBE_CATEGORIES: VibeCategory[] = [
  {
    name: "Emotional Tone",
    vibes: [
      "melancholic",
      "euphoric",
      "nostalgic",
      "hopeful",
      "bittersweet",
      "contemplative",
      "joyful",
      "somber",
      "passionate",
      "serene",
      "anxious",
      "triumphant",
    ],
  },
  {
    name: "Energy Level",
    vibes: [
      "high-energy",
      "mellow",
      "intense",
      "laid-back",
      "explosive",
      "gentle",
      "driving",
      "relaxed",
      "aggressive",
      "soothing",
      "dynamic",
      "calm",
    ],
  },
  {
    name: "Aesthetic Style",
    vibes: [
      "dreamy",
      "gritty",
      "ethereal",
      "raw",
      "polished",
      "lo-fi",
      "cinematic",
      "minimalist",
      "lush",
      "sparse",
      "atmospheric",
      "intimate",
    ],
  },
  {
    name: "Character",
    vibes: [
      "rebellious",
      "romantic",
      "mysterious",
      "playful",
      "dark",
      "uplifting",
      "edgy",
      "whimsical",
      "haunting",
      "empowering",
      "vulnerable",
      "confident",
    ],
  },
  {
    name: "Production Style",
    vibes: [
      "experimental",
      "vintage",
      "modern",
      "organic",
      "electronic",
      "acoustic",
      "psychedelic",
      "ambient",
      "distorted",
      "clean",
      "layered",
      "stripped-down",
    ],
  },
];

/**
 * Get all vibes as a flat array
 */
export function getAllVibes(): string[] {
  return VIBE_CATEGORIES.flatMap((category) => category.vibes);
}

/**
 * Get random vibes for inspiration
 */
export function getRandomVibes(count: number = 5): string[] {
  const allVibes = getAllVibes();
  const shuffled = [...allVibes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
