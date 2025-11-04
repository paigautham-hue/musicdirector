import { drizzle } from "drizzle-orm/mysql2";
import { eq, and } from "drizzle-orm";
import { tracks, trackAssets } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const [track] = await db.select().from(tracks)
  .where(eq(tracks.title, "The Shepherd's Empty Pockets"))
  .limit(1);

if (track) {
  const [lyrics] = await db.select().from(trackAssets)
    .where(and(
      eq(trackAssets.trackId, track.id),
      eq(trackAssets.type, 'lyrics')
    ))
    .limit(1);
  
  if (lyrics) {
    console.log(`Track: ${track.title}`);
    console.log(`Length: ${lyrics.content.length} characters`);
    console.log(`\nLyrics:\n${lyrics.content}`);
  }
}
