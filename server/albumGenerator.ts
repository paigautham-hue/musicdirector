import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { getPlatformAdapter } from "./adapters";
import type { PlatformName } from "./adapters/types";

export interface AlbumGenerationInput {
  theme: string;
  vibe: string[]; // genres, moods
  language: string;
  audience?: string;
  influences?: string[]; // artist/era descriptions
  trackCount: number;
  platform: PlatformName;
}

export interface TrackOutput {
  index: number;
  title: string;
  hook: string;
  description: string;
  prompt: string;
  lyrics: string;
  structure: string;
  tempoBpm: string;
  key: string;
  moodTags: string[];
  productionNotes: string;
  score: number;
  scoreBreakdown: {
    hookStrength: number;
    memorability: number;
    singability: number;
    emotionalResonance: number;
    thematicClarity: number;
    novelty: number;
    coherence: number;
  };
  alternates: Array<{
    variant: string;
    prompt: string;
    lyrics: string;
  }>;
  artPrompt: string;
  artUrl?: string;
}

export interface AlbumOutput {
  title: string;
  description: string;
  coverPrompt: string;
  coverUrl?: string;
  tracks: TrackOutput[];
  overallScore: number;
}

/**
 * Generate a complete album with all tracks, lyrics, and artwork
 */
export async function generateAlbum(input: AlbumGenerationInput): Promise<AlbumOutput> {
  const adapter = getPlatformAdapter(input.platform);
  const constraints = adapter.constraints();
  const bestPractices = adapter.bestPractices();
  
  // Step 1: Generate album concept and metadata
  const albumConcept = await generateAlbumConcept(input);
  
  // Step 2: Generate cover art
  let coverUrl: string | undefined;
  try {
    const coverResult = await generateImage({
      prompt: albumConcept.coverPrompt
    });
    coverUrl = coverResult.url;
  } catch (error) {
    console.error("Failed to generate cover art:", error);
  }
  
  // Step 3: Generate all tracks sequentially to avoid duplicates
  const tracks: TrackOutput[] = [];
  const usedTitles = new Set<string>();
  
  for (let i = 0; i < input.trackCount; i++) {
    const track = await generateTrack({
      albumTheme: input.theme,
      albumTitle: albumConcept.title,
      trackIndex: i + 1,
      totalTracks: input.trackCount,
      vibe: input.vibe,
      language: input.language,
      influences: input.influences,
      platform: input.platform,
      constraints,
      bestPractices,
      existingTitles: Array.from(usedTitles)
    });
    
    // Ensure unique title
    let finalTitle = track.title;
    let attempt = 1;
    while (usedTitles.has(finalTitle.toLowerCase())) {
      finalTitle = `${track.title} (${attempt})`;
      attempt++;
    }
    
    track.title = finalTitle;
    usedTitles.add(finalTitle.toLowerCase());
    tracks.push(track);
  }
  
  // Step 4: Calculate overall album score
  const overallScore = Math.round(
    tracks.reduce((sum, t) => sum + t.score, 0) / tracks.length
  );
  
  return {
    ...albumConcept,
    coverUrl,
    tracks,
    overallScore
  };
}

/**
 * Generate album title, description, and cover art prompt
 */
async function generateAlbumConcept(input: AlbumGenerationInput): Promise<{
  title: string;
  description: string;
  coverPrompt: string;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert music album curator and creative director. Generate compelling album concepts that are:
- Thematically cohesive and emotionally resonant
- Commercially viable yet artistically ambitious
- Respectful of cultural and spiritual themes
- Non-infringing and original

For spiritual themes (e.g., Osho): keep language experiential, non-preachy, celebratory of awareness.
For political/social themes: avoid defamation and hate; focus on ideas and human connection.`
      },
      {
        role: "user",
        content: `Create an album concept for:

Theme: ${input.theme}
Vibe/Genres: ${input.vibe.join(", ")}
Language: ${input.language}
${input.audience ? `Audience: ${input.audience}` : ""}
${input.influences?.length ? `Influences: ${input.influences.join(", ")}` : ""}
Track Count: ${input.trackCount}
Platform: ${input.platform}

Generate:
1. Album title (memorable, evocative, 2-6 words)
2. Album description (2-3 sentences capturing the essence)
3. Cover art prompt (detailed visual description for AI image generation, non-infringing)`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "album_concept",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            coverPrompt: { type: "string" }
          },
          required: ["title", "description", "coverPrompt"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = response.choices[0].message.content;
  return JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
}

/**
 * Generate a single track with lyrics, prompts, and scoring
 */
async function generateTrack(params: {
  albumTheme: string;
  albumTitle: string;
  trackIndex: number;
  totalTracks: number;
  vibe: string[];
  language: string;
  influences?: string[];
  platform: PlatformName;
  constraints: any;
  bestPractices: string[];
  existingTitles?: string[];
}): Promise<TrackOutput> {
  const { albumTheme, albumTitle, trackIndex, totalTracks, vibe, language, influences, platform, constraints, bestPractices, existingTitles = [] } = params;
  
  // Generate main track content
  const trackContent = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert songwriter and music producer. Create songs that are:
- Emotionally compelling with strong hooks
- Singable with consistent meter and rhyme
- Thematically clear yet poetically rich
- Platform-optimized for ${platform}

Platform constraints:
${JSON.stringify(constraints, null, 2)}

Best practices:
${bestPractices.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Structure lyrics with clear sections: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus], [Outro]
Keep line lengths consistent (8-12 syllables per line for verses, 6-10 for chorus)
Use sensory language and avoid clichés`
      },
      {
        role: "user",
        content: `Create track ${trackIndex} of ${totalTracks} for album "${albumTitle}"

Album Theme: ${albumTheme}
Vibe/Genres: ${vibe.join(", ")}
Language: ${language}
${influences?.length ? `Influences: ${influences.join(", ")}` : ""}
${existingTitles.length > 0 ? `\nExisting track titles (DO NOT reuse): ${existingTitles.join(", ")}` : ""}

Generate:
1. Title (catchy, memorable)
2. Hook (one-line emotional core)
3. Description (what the song is about, 2-3 sentences)
4. Prompt (style/mood description for ${platform}, max ${constraints.prompt.maxChars} chars)
5. Lyrics (full song with structure tags, max ${constraints.lyrics.maxChars || 3000} chars)
6. Structure (e.g., "Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro")
7. Tempo/BPM range (e.g., "120-130 BPM")
8. Key suggestion (e.g., "C major" or "A minor")
9. Mood tags (array of 3-5 descriptors)
10. Production notes (instrumentation, mixing style, 1-2 sentences)`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "track_content",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            description: { type: "string" },
            prompt: { type: "string" },
            lyrics: { type: "string" },
            structure: { type: "string" },
            tempoBpm: { type: "string" },
            key: { type: "string" },
            moodTags: { type: "array", items: { type: "string" } },
            productionNotes: { type: "string" }
          },
          required: ["title", "hook", "description", "prompt", "lyrics", "structure", "tempoBpm", "key", "moodTags", "productionNotes"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = trackContent.choices[0].message.content;
  const track = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  
  // Generate quality score
  const scoreResult = await scoreTrack(track);
  
  // Generate alternates
  const alternates = await generateAlternates(track, vibe);
  
  // Generate track artwork
  const artPrompt = `Album artwork for song "${track.title}" from album "${albumTitle}". ${track.description}. Style: ${vibe.join(", ")}. Mood: ${track.moodTags.join(", ")}. High quality, professional music cover art.`;
  
  let artUrl: string | undefined;
  try {
    const artResult = await generateImage({ prompt: artPrompt });
    artUrl = artResult.url;
  } catch (error) {
    console.error(`Failed to generate art for track ${trackIndex}:`, error);
  }
  
  return {
    index: trackIndex,
    ...track,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown,
    alternates,
    artPrompt,
    artUrl
  };
}

/**
 * Score a track on multiple dimensions
 */
async function scoreTrack(track: {
  title: string;
  hook: string;
  lyrics: string;
  prompt: string;
}): Promise<{
  score: number;
  breakdown: {
    hookStrength: number;
    memorability: number;
    singability: number;
    emotionalResonance: number;
    thematicClarity: number;
    novelty: number;
    coherence: number;
  };
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a music industry expert evaluating songs for hit potential. Score each dimension 0-10:

- Hook Strength: Is the hook catchy, memorable, emotionally immediate?
- Memorability: Will listeners remember and sing along?
- Singability: Are lyrics easy to sing? Consistent meter? Good rhyme?
- Emotional Resonance: Does it evoke genuine emotion?
- Thematic Clarity: Is the message clear and focused?
- Novelty: Is it fresh yet familiar? Avoids clichés?
- Coherence: Do all elements work together harmoniously?`
      },
      {
        role: "user",
        content: `Score this song:

Title: ${track.title}
Hook: ${track.hook}
Prompt: ${track.prompt}

Lyrics:
${track.lyrics}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "track_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            hookStrength: { type: "number" },
            memorability: { type: "number" },
            singability: { type: "number" },
            emotionalResonance: { type: "number" },
            thematicClarity: { type: "number" },
            novelty: { type: "number" },
            coherence: { type: "number" }
          },
          required: ["hookStrength", "memorability", "singability", "emotionalResonance", "thematicClarity", "novelty", "coherence"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = response.choices[0].message.content;
  const breakdown = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  
  const score = Math.round(
    (breakdown.hookStrength + breakdown.memorability + breakdown.singability + 
     breakdown.emotionalResonance + breakdown.thematicClarity + breakdown.novelty + 
     breakdown.coherence) / 7 * 10
  );
  
  return { score, breakdown };
}

/**
 * Generate alternate versions with different styles
 */
async function generateAlternates(
  track: { title: string; hook: string; lyrics: string; prompt: string },
  vibe: string[]
): Promise<Array<{ variant: string; prompt: string; lyrics: string }>> {
  const variants = ["more_cinematic", "more_minimal"];
  
  const alternatePromises = variants.map(async (variant) => {
    const variantInstruction = variant === "more_cinematic" 
      ? "Make it more cinematic and epic with orchestral elements and dramatic builds"
      : "Make it more minimal and intimate with stripped-down instrumentation and raw emotion";
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a music producer creating alternate versions of songs. ${variantInstruction}.`
        },
        {
          role: "user",
          content: `Create a ${variant} version of this song:

Title: ${track.title}
Original Prompt: ${track.prompt}
Original Lyrics:
${track.lyrics}

Generate an alternate prompt and lyrics that ${variantInstruction.toLowerCase()}.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "alternate_version",
          strict: true,
          schema: {
            type: "object",
            properties: {
              prompt: { type: "string" },
              lyrics: { type: "string" }
            },
            required: ["prompt", "lyrics"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0].message.content;
    const alternate = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    
    return {
      variant,
      ...alternate
    };
  });
  
  return Promise.all(alternatePromises);
}

/**
 * Regenerate/improve a track with style controls
 */
export async function improveTrack(params: {
  originalTrack: TrackOutput;
  improvements: string[]; // e.g., ["funnier", "more_poetic", "less_political"]
  platform: PlatformName;
}): Promise<Partial<TrackOutput>> {
  const { originalTrack, improvements, platform } = params;
  const adapter = getPlatformAdapter(platform);
  const constraints = adapter.constraints();
  
  const improvementInstructions = improvements.map(imp => {
    const map: Record<string, string> = {
      funnier: "Add more humor and wit",
      simpler: "Simplify language and structure",
      more_poetic: "Use more poetic and metaphorical language",
      more_cinematic: "Make it more epic and cinematic",
      more_spiritual: "Deepen spiritual themes",
      less_political: "Remove political references, focus on universal human themes"
    };
    return map[imp] || imp;
  }).join(". ");
  
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are improving a song based on user feedback. ${improvementInstructions}.

Platform constraints:
${JSON.stringify(constraints, null, 2)}`
      },
      {
        role: "user",
        content: `Improve this song:

Title: ${originalTrack.title}
Prompt: ${originalTrack.prompt}
Lyrics:
${originalTrack.lyrics}

Apply these improvements: ${improvementInstructions}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "improved_track",
        strict: true,
        schema: {
          type: "object",
          properties: {
            prompt: { type: "string" },
            lyrics: { type: "string" }
          },
          required: ["prompt", "lyrics"],
          additionalProperties: false
        }
      }
    }
  });
  
  const content = response.choices[0].message.content;
  const improved = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  
  // Re-score the improved version
  const scoreResult = await scoreTrack({
    title: originalTrack.title,
    hook: originalTrack.hook,
    ...improved
  });
  
  return {
    prompt: improved.prompt,
    lyrics: improved.lyrics,
    score: scoreResult.score,
    scoreBreakdown: scoreResult.breakdown
  };
}
