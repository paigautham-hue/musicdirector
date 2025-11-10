import { invokeLLM } from "./_core/llm";
import * as db from "./db";

/**
 * AI-powered recommendation engine that analyzes tracks and scores them
 * for "hit potential" based on multiple factors
 */

export interface TrackAnalysis {
  score: number; // 0-100 overall hit potential
  breakdown: {
    lyricalQuality: number; // 0-100
    emotionalDepth: number; // 0-100
    universalAppeal: number; // 0-100
    memorability: number; // 0-100
    productionQuality: number; // 0-100
  };
  reasoning: string;
  category: "staff_pick" | "trending_potential" | "hidden_gem" | "standard";
}

/**
 * Analyze a track using AI to determine its hit potential
 */
export async function analyzeTrack(trackId: number): Promise<TrackAnalysis> {
  // Get track data with lyrics and metadata
  const track = await db.getTrackById(trackId);
  if (!track) {
    throw new Error("Track not found");
  }

  const album = await db.getAlbumById(track.albumId);
  if (!album) {
    throw new Error("Album not found");
  }

  const assets = await db.getTrackAssets(trackId);
  const lyrics = assets.find(a => a.type === "lyrics")?.content || "";
  const prompt = assets.find(a => a.type === "prompt")?.content || "";

  // Use AI to analyze the track
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a music industry expert analyzing songs for hit potential. Evaluate tracks based on:
1. Lyrical Quality - Sophistication, imagery, wordplay, storytelling
2. Emotional Depth - Ability to evoke feelings and connect with listeners
3. Universal Appeal - Themes that resonate across demographics
4. Memorability - Catchiness, hook strength, replay value
5. Production Quality - Musical arrangement, tempo, key choices

Provide scores (0-100) for each dimension and an overall score. Be critical but fair.`
      },
      {
        role: "user",
        content: `Analyze this track:

**Title:** ${track.title}
**Album:** ${album.title}
**Theme:** ${album.theme}
**Key:** ${track.key || "Unknown"}
**Tempo:** ${track.tempoBpm || "Unknown"}
**Vibe:** ${album.vibe || "Unknown"}

**Lyrics:**
${lyrics}

**Production Notes:**
${prompt}

Provide your analysis in JSON format with this structure:
{
  "lyricalQuality": <0-100>,
  "emotionalDepth": <0-100>,
  "universalAppeal": <0-100>,
  "memorability": <0-100>,
  "productionQuality": <0-100>,
  "overallScore": <0-100>,
  "reasoning": "<2-3 sentence explanation>",
  "category": "<staff_pick|trending_potential|hidden_gem|standard>"
}

Category guidelines:
- staff_pick: 85+ overall, exceptional in multiple dimensions
- trending_potential: 75-84, strong universal appeal and memorability
- hidden_gem: 70-84, high quality but needs discovery
- standard: Below 70`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "track_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            lyricalQuality: { type: "number" },
            emotionalDepth: { type: "number" },
            universalAppeal: { type: "number" },
            memorability: { type: "number" },
            productionQuality: { type: "number" },
            overallScore: { type: "number" },
            reasoning: { type: "string" },
            category: { 
              type: "string",
              enum: ["staff_pick", "trending_potential", "hidden_gem", "standard"]
            }
          },
          required: [
            "lyricalQuality",
            "emotionalDepth",
            "universalAppeal",
            "memorability",
            "productionQuality",
            "overallScore",
            "reasoning",
            "category"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const content = response.choices[0].message.content;
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
  const analysis = JSON.parse(contentStr);

  return {
    score: analysis.overallScore,
    breakdown: {
      lyricalQuality: analysis.lyricalQuality,
      emotionalDepth: analysis.emotionalDepth,
      universalAppeal: analysis.universalAppeal,
      memorability: analysis.memorability,
      productionQuality: analysis.productionQuality
    },
    reasoning: analysis.reasoning,
    category: analysis.category
  };
}

/**
 * Analyze all tracks in the database and update their scores
 */
export async function analyzeAllTracks(): Promise<{
  analyzed: number;
  staffPicks: number;
  trendingPotential: number;
  hiddenGems: number;
}> {
  const allTracks = await db.getAllTracksWithAudio();
  
  let analyzed = 0;
  let staffPicks = 0;
  let trendingPotential = 0;
  let hiddenGems = 0;

  for (const track of allTracks) {
    try {
      const analysis = await analyzeTrack(track.id);
      
      // Update track with AI scores
      await db.updateTrackScore(track.id, analysis.score, analysis.breakdown);
      
      analyzed++;
      
      if (analysis.category === "staff_pick") staffPicks++;
      else if (analysis.category === "trending_potential") trendingPotential++;
      else if (analysis.category === "hidden_gem") hiddenGems++;
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Failed to analyze track ${track.id}:`, error);
    }
  }

  return { analyzed, staffPicks, trendingPotential, hiddenGems };
}

/**
 * Get recommended tracks by category
 */
export async function getRecommendedTracks(
  category: "staff_pick" | "trending_potential" | "hidden_gem",
  limit: number = 20
) {
  const minScore = category === "staff_pick" ? 85 : category === "trending_potential" ? 75 : 70;
  const maxScore = category === "staff_pick" ? 100 : category === "trending_potential" ? 84 : 84;
  
  return await db.getTracksByScoreRange(minScore, maxScore, limit);
}
