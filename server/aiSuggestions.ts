import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { tracks, albums } from "../drizzle/schema";
import { inArray, ne, eq } from "drizzle-orm";

interface PlaylistTrack {
  id: number;
  title: string;
  albumTitle?: string;
}

interface TrackSuggestion {
  trackId: number;
  title: string;
  albumTitle: string;
  reason: string;
  matchScore: number;
}

/**
 * Analyze playlist tracks and suggest similar tracks using AI
 */
export async function suggestTracksForPlaylist(
  playlistTracks: PlaylistTrack[],
  excludeTrackIds: number[],
  limit: number = 10
): Promise<TrackSuggestion[]> {
  if (playlistTracks.length === 0) {
    return [];
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all available tracks from the platform (excluding already added ones)
  const allTracks = await db
    .select({
      id: tracks.id,
      title: tracks.title,
      albumId: tracks.albumId,
      albumTitle: albums.title,
      albumTheme: albums.theme,
    })
    .from(tracks)
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .limit(100); // Limit to avoid overwhelming the LLM

  const availableTracks = allTracks.filter(
    (t) => !excludeTrackIds.includes(t.id)
  );

  if (availableTracks.length === 0) {
    return [];
  }

  // Prepare playlist context for AI
  const playlistContext = playlistTracks.map((t) => ({
    title: t.title,
    albumTitle: t.albumTitle || "Unknown",
  }));

  // Prepare available tracks for AI
  const candidateTracks = availableTracks.map((t) => ({
    id: t.id,
    title: t.title,
    albumTitle: t.albumTitle || "Unknown Album",
    albumTheme: t.albumTheme || "unknown",
  }));

  // Use AI to analyze and suggest tracks
  const prompt = `You are a music curator helping users build cohesive playlists.

**Current Playlist Tracks:**
${JSON.stringify(playlistContext, null, 2)}

**Available Tracks to Choose From:**
${JSON.stringify(candidateTracks.slice(0, 40), null, 2)}

Analyze the current playlist's track titles and album themes. Suggest up to ${limit} tracks from the available tracks that would fit well in this playlist based on thematic similarity, mood, or lyrical content. For each suggestion, provide:
1. Track ID (must be from the available tracks list)
2. A brief reason why it matches (1 sentence, max 100 characters)
3. A match score (1-10, where 10 is perfect match)

Return your response as a JSON object with a "suggestions" array, ordered by match score (highest first).`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a music curator AI. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "track_suggestions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    trackId: { type: "number" },
                    reason: { type: "string" },
                    matchScore: { type: "number" },
                  },
                  required: ["trackId", "reason", "matchScore"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return [];
    }

    const parsed = JSON.parse(content);
    const suggestions = parsed.suggestions || [];

    // Enrich suggestions with track details
    const enriched: TrackSuggestion[] = suggestions
      .map((s: any) => {
        const track = candidateTracks.find((t) => t.id === s.trackId);
        if (!track) return null;
        return {
          trackId: track.id,
          title: track.title,
          albumTitle: track.albumTitle,
          reason: s.reason,
          matchScore: s.matchScore,
        };
      })
      .filter((s: any) => s !== null)
      .slice(0, limit);

    return enriched;
  } catch (error) {
    console.error("[AI Suggestions] Error:", error);
    return [];
  }
}
