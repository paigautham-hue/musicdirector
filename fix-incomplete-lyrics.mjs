import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { albums, tracks, trackAssets } from "./drizzle/schema.ts";
import { invokeLLM } from "./server/_core/llm.ts";
import { getPlatformAdapter } from "./server/adapters/index.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get the most recent album
const [album] = await db.select().from(albums).orderBy(albums.createdAt).limit(1);
if (!album) {
  console.error("No albums found");
  process.exit(1);
}

console.log(`📀 Processing album: ${album.title}`);

// Get all tracks with their lyrics
const allTracks = await db.select().from(tracks).where(eq(tracks.albumId, album.id)).orderBy(tracks.index);

const incompleteTracks = [];

for (const track of allTracks) {
  const [lyricsAsset] = await db.select().from(trackAssets)
    .where(eq(trackAssets.trackId, track.id))
    .where(eq(trackAssets.type, 'lyrics'))
    .limit(1);
  
  if (lyricsAsset) {
    const lyrics = lyricsAsset.content;
    const hasVerse2 = lyrics.includes('[Verse 2]') || lyrics.includes('[verse 2]') || lyrics.includes('Verse 2');
    const hasChorus = lyrics.includes('[Chorus]') || lyrics.includes('[chorus]') || lyrics.includes('Chorus');
    const hasBridge = lyrics.includes('[Bridge]') || lyrics.includes('[bridge]') || lyrics.includes('Bridge');
    
    // Count how many lines of actual lyrics (not just tags)
    const lyricsLines = lyrics.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.match(/^\[.*\]$/);
    }).length;
    
    // Check if lyrics are incomplete (less than 500 chars, less than 20 lines, or missing key sections)
    if (lyrics.length < 500 || lyricsLines < 20 || !hasVerse2 || !hasBridge) {
      incompleteTracks.push({ track, lyricsAsset });
      console.log(`⚠️  Track ${track.index} "${track.title}" has incomplete lyrics (${lyrics.length} chars, ${lyricsLines} lines, v2:${hasVerse2}, bridge:${hasBridge})`);
    }
  }
}

if (incompleteTracks.length === 0) {
  console.log("✅ All tracks have complete lyrics!");
  process.exit(0);
}

console.log(`\n🔧 Regenerating lyrics for ${incompleteTracks.length} tracks...\n`);

// Parse album data
const vibe = JSON.parse(album.vibe || "[]");
const influences = album.influences ? JSON.parse(album.influences) : [];

const adapter = getPlatformAdapter(album.platform);
const constraints = adapter.constraints();
const bestPractices = adapter.bestPractices();

// Regenerate each incomplete track's lyrics
for (const { track, lyricsAsset } of incompleteTracks) {
  console.log(`🎵 Regenerating lyrics for track ${track.index}: "${track.title}"...`);
  
  // Get the prompt for context
  const [promptAsset] = await db.select().from(trackAssets)
    .where(eq(trackAssets.trackId, track.id))
    .where(eq(trackAssets.type, 'prompt'))
    .limit(1);

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert songwriter. Generate COMPLETE song lyrics with ALL sections.

CRITICAL REQUIREMENTS:
- MUST include ALL sections: [Verse 1], [Chorus], [Verse 2], [Chorus], [Bridge], [Chorus], [Outro]
- Each verse MUST have 4-8 complete lines
- Each chorus MUST have 4-6 complete lines
- Bridge MUST have 4-6 complete lines
- Outro MUST have 2-4 complete lines
- Total lyrics should be 800-1500 characters
- Use consistent meter and rhyme scheme
- Keep line lengths: 8-12 syllables for verses, 6-10 for chorus

Platform: ${album.platform}
Max characters: ${constraints.lyrics.maxChars || 3000}`
        },
        {
          role: "user",
          content: `Generate COMPLETE lyrics for this song:

Title: "${track.title}"
Album: "${album.title}"
Theme: ${album.theme}
Vibe: ${vibe.join(", ")}
Tempo: ${track.tempoBpm}
Key: ${track.key}
${promptAsset ? `Style: ${promptAsset.content}` : ""}

Generate full, complete lyrics with ALL sections marked with structure tags.
DO NOT generate partial or incomplete lyrics.`
        }
      ]
    });

    const newLyrics = response.choices[0].message.content;
    const lyricsText = typeof newLyrics === 'string' ? newLyrics : JSON.stringify(newLyrics);

    // Update lyrics in database
    await db.update(trackAssets)
      .set({ content: lyricsText })
      .where(eq(trackAssets.id, lyricsAsset.id));

    console.log(`   ✅ Updated (${lyricsText.length} chars)`);

  } catch (error) {
    console.error(`   ❌ Failed:`, error.message);
  }
}

console.log("\n✨ Lyrics regeneration complete!");
process.exit(0);
