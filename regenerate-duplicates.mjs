import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { albums, tracks, trackAssets } from "./drizzle/schema.ts";
import { invokeLLM } from "./server/_core/llm.ts";
import { generateImage } from "./server/_core/imageGeneration.ts";
import { getPlatformAdapter } from "./server/adapters/index.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get the most recent album
const [album] = await db.select().from(albums).orderBy(albums.createdAt).limit(1);
if (!album) {
  console.error("No albums found");
  process.exit(1);
}

console.log(`📀 Processing album: ${album.title}`);

// Get all tracks
const allTracks = await db.select().from(tracks).where(eq(tracks.albumId, album.id)).orderBy(tracks.index);

// Find duplicates by title
const titleCounts = {};
const duplicateIndices = [];

for (const track of allTracks) {
  if (!titleCounts[track.title]) {
    titleCounts[track.title] = [];
  }
  titleCounts[track.title].push(track.index);
}

// Identify which tracks to regenerate (keep first occurrence, regenerate rest)
for (const [title, indices] of Object.entries(titleCounts)) {
  if (indices.length > 1) {
    console.log(`🔄 Found ${indices.length} tracks with title "${title}"`);
    // Keep first, regenerate the rest
    duplicateIndices.push(...indices.slice(1));
  }
}

if (duplicateIndices.length === 0) {
  console.log("✅ No duplicates found!");
  process.exit(0);
}

console.log(`🔧 Regenerating ${duplicateIndices.length} duplicate tracks: ${duplicateIndices.join(", ")}`);

// Get existing titles to avoid
const existingTitles = allTracks
  .filter(t => !duplicateIndices.includes(t.index))
  .map(t => t.title);

// Parse album data
const vibe = JSON.parse(album.vibe || "[]");
const influences = album.influences ? JSON.parse(album.influences) : [];

const adapter = getPlatformAdapter(album.platform);
const constraints = adapter.constraints();
const bestPractices = adapter.bestPractices();

// Regenerate each duplicate track
for (const trackIndex of duplicateIndices) {
  console.log(`\n🎵 Regenerating track ${trackIndex}...`);
  
  const trackToRegenerate = allTracks.find(t => t.index === trackIndex);
  if (!trackToRegenerate) continue;

  try {
    // Generate new track content
    const trackContent = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert songwriter and music producer. Create songs that are:
- Emotionally compelling with strong hooks
- Singable with consistent meter and rhyme
- Thematically clear yet poetically rich
- Platform-optimized for ${album.platform}

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
          content: `Create track ${trackIndex} of ${album.trackCount} for album "${album.title}"

Album Theme: ${album.theme}
Vibe/Genres: ${vibe.join(", ")}
Language: ${album.language}
${influences.length ? `Influences: ${influences.join(", ")}` : ""}

IMPORTANT: These track titles already exist - DO NOT reuse them:
${existingTitles.join(", ")}

Generate:
1. Title (catchy, memorable, MUST be unique)
2. Hook (one-line emotional core)
3. Description (what the song is about, 2-3 sentences)
4. Prompt (style/mood description for ${album.platform}, max ${constraints.prompt.maxChars} chars)
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
    const newTrack = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    // Ensure unique title
    let finalTitle = newTrack.title;
    let attempt = 1;
    while (existingTitles.includes(finalTitle)) {
      finalTitle = `${newTrack.title} (${attempt})`;
      attempt++;
    }
    newTrack.title = finalTitle;
    existingTitles.push(finalTitle);

    console.log(`   ✓ Generated: "${newTrack.title}"`);

    // Generate track artwork
    const artPrompt = `Album artwork for song "${newTrack.title}" from album "${album.title}". ${newTrack.description}. Style: ${vibe.join(", ")}. Mood: ${newTrack.moodTags.join(", ")}. High quality, professional music cover art.`;
    
    let artUrl = null;
    try {
      const artResult = await generateImage({ prompt: artPrompt });
      artUrl = artResult.url;
      console.log(`   ✓ Generated artwork`);
    } catch (error) {
      console.error(`   ✗ Failed to generate artwork:`, error.message);
    }

    // Update track in database
    await db.update(tracks)
      .set({
        title: newTrack.title,
        tempoBpm: newTrack.tempoBpm,
        key: newTrack.key,
        moodTags: JSON.stringify(newTrack.moodTags)
      })
      .where(eq(tracks.id, trackToRegenerate.id));

    // Delete old assets
    await db.delete(trackAssets).where(eq(trackAssets.trackId, trackToRegenerate.id));

    // Insert new assets
    await db.insert(trackAssets).values([
      { trackId: trackToRegenerate.id, type: "prompt", content: newTrack.prompt },
      { trackId: trackToRegenerate.id, type: "lyrics", content: newTrack.lyrics },
      { trackId: trackToRegenerate.id, type: "structure", content: newTrack.structure },
      { trackId: trackToRegenerate.id, type: "production_notes", content: newTrack.productionNotes },
      { trackId: trackToRegenerate.id, type: "art_prompt", content: artPrompt },
      ...(artUrl ? [{ trackId: trackToRegenerate.id, type: "art_url", content: artUrl }] : [])
    ]);

    console.log(`   ✅ Updated track ${trackIndex} in database`);

  } catch (error) {
    console.error(`   ❌ Failed to regenerate track ${trackIndex}:`, error);
  }
}

console.log("\n✨ Regeneration complete!");
process.exit(0);
