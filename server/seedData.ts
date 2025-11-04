/**
 * Seed demo albums for showcase
 * Run with: node --loader tsx server/seedData.ts
 */

import { generateAlbum } from "./albumGenerator";
import * as db from "./db";

async function seedDemoAlbums() {
  console.log("🌱 Seeding demo albums...");

  // Get or create a demo user
  const demoUser = await db.getUserByOpenId("demo_user");
  let userId: number;
  
  if (!demoUser) {
    console.log("Creating demo user...");
    await db.upsertUser({
      openId: "demo_user",
      name: "Demo User",
      email: "demo@example.com",
      role: "user"
    });
    const createdUser = await db.getUserByOpenId("demo_user");
    userId = createdUser!.id;
  } else {
    userId = demoUser.id;
  }

  // Demo Album 1: Lotus in the Noise
  console.log("\n📀 Creating 'Lotus in the Noise' album...");
  try {
    const lotusAlbum = await generateAlbum({
      theme: "Songs inspired by Osho's teachings about awareness, meditation, and celebration of life",
      vibe: ["ambient", "meditative", "uplifting", "spiritual", "electronic"],
      language: "en",
      audience: "Seekers of spiritual growth and inner peace",
      influences: ["ambient electronic music", "world music fusion", "new age"],
      trackCount: 8,
      platform: "suno"
    });

    const album1 = await db.createAlbum({
      userId,
      title: lotusAlbum.title,
      theme: "Songs inspired by Osho's teachings about awareness, meditation, and celebration of life",
      platform: "suno",
      description: lotusAlbum.description,
      coverUrl: lotusAlbum.coverUrl,
      coverPrompt: lotusAlbum.coverPrompt,
      score: lotusAlbum.overallScore,
      vibe: JSON.stringify(["ambient", "meditative", "uplifting", "spiritual", "electronic"]),
      language: "en",
      audience: "Seekers of spiritual growth and inner peace",
      influences: JSON.stringify(["ambient electronic music", "world music fusion", "new age"]),
      trackCount: 8
    });

    // Save tracks
    for (const trackData of lotusAlbum.tracks) {
      const track = await db.createTrack({
        albumId: album1.id,
        index: trackData.index,
        title: trackData.title,
        tempoBpm: trackData.tempoBpm,
        key: trackData.key,
        moodTags: JSON.stringify(trackData.moodTags),
        score: trackData.score,
        scoreBreakdown: JSON.stringify(trackData.scoreBreakdown)
      });

      await db.createTrackAsset({ trackId: track.id, type: "prompt", content: trackData.prompt });
      await db.createTrackAsset({ trackId: track.id, type: "lyrics", content: trackData.lyrics });
      await db.createTrackAsset({ trackId: track.id, type: "structure", content: trackData.structure });
      await db.createTrackAsset({ trackId: track.id, type: "production_notes", content: trackData.productionNotes });
      await db.createTrackAsset({ trackId: track.id, type: "art_prompt", content: trackData.artPrompt });
      if (trackData.artUrl) {
        await db.createTrackAsset({ trackId: track.id, type: "art_url", content: trackData.artUrl });
      }
    }

    console.log(`✅ Created album: ${lotusAlbum.title} (${lotusAlbum.tracks.length} tracks)`);
  } catch (error) {
    console.error("❌ Failed to create Lotus in the Noise:", error);
  }

  // Demo Album 2: Lines in the Sand
  console.log("\n📀 Creating 'Lines in the Sand' album...");
  try {
    const linesAlbum = await generateAlbum({
      theme: "Social commentary on division vs unity - how politicians and religion divide instead of unite, with a message of compassion and human connection",
      vibe: ["indie rock", "folk", "anthemic", "thoughtful", "acoustic"],
      language: "en",
      audience: "Socially conscious listeners seeking unity",
      influences: ["protest folk music", "indie rock storytelling", "acoustic singer-songwriter"],
      trackCount: 8,
      platform: "udio"
    });

    const album2 = await db.createAlbum({
      userId,
      title: linesAlbum.title,
      theme: "Social commentary on division vs unity - compassionate, human-first",
      platform: "udio",
      description: linesAlbum.description,
      coverUrl: linesAlbum.coverUrl,
      coverPrompt: linesAlbum.coverPrompt,
      score: linesAlbum.overallScore,
      vibe: JSON.stringify(["indie rock", "folk", "anthemic", "thoughtful", "acoustic"]),
      language: "en",
      audience: "Socially conscious listeners seeking unity",
      influences: JSON.stringify(["protest folk music", "indie rock storytelling", "acoustic singer-songwriter"]),
      trackCount: 8
    });

    // Save tracks
    for (const trackData of linesAlbum.tracks) {
      const track = await db.createTrack({
        albumId: album2.id,
        index: trackData.index,
        title: trackData.title,
        tempoBpm: trackData.tempoBpm,
        key: trackData.key,
        moodTags: JSON.stringify(trackData.moodTags),
        score: trackData.score,
        scoreBreakdown: JSON.stringify(trackData.scoreBreakdown)
      });

      await db.createTrackAsset({ trackId: track.id, type: "prompt", content: trackData.prompt });
      await db.createTrackAsset({ trackId: track.id, type: "lyrics", content: trackData.lyrics });
      await db.createTrackAsset({ trackId: track.id, type: "structure", content: trackData.structure });
      await db.createTrackAsset({ trackId: track.id, type: "production_notes", content: trackData.productionNotes });
      await db.createTrackAsset({ trackId: track.id, type: "art_prompt", content: trackData.artPrompt });
      if (trackData.artUrl) {
        await db.createTrackAsset({ trackId: track.id, type: "art_url", content: trackData.artUrl });
      }
    }

    console.log(`✅ Created album: ${linesAlbum.title} (${linesAlbum.tracks.length} tracks)`);
  } catch (error) {
    console.error("❌ Failed to create Lines in the Sand:", error);
  }

  console.log("\n✨ Seeding complete!");
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  seedDemoAlbums().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { seedDemoAlbums };
