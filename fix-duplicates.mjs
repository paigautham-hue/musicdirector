import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { tracks } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// Get all tracks from albums with duplicates
const allTracks = await db.select().from(tracks).orderBy(tracks.albumId, tracks.index);

// Group by album
const albumGroups = {};
for (const track of allTracks) {
  if (!albumGroups[track.albumId]) {
    albumGroups[track.albumId] = [];
  }
  albumGroups[track.albumId].push(track);
}

// Fix duplicates in each album
for (const [albumId, albumTracks] of Object.entries(albumGroups)) {
  const titleCounts = {};
  const updates = [];
  
  for (const track of albumTracks) {
    const baseTitle = track.title;
    
    if (!titleCounts[baseTitle]) {
      titleCounts[baseTitle] = 0;
    } else {
      titleCounts[baseTitle]++;
      const newTitle = `${baseTitle} (Part ${titleCounts[baseTitle]})`;
      updates.push({ id: track.id, newTitle });
      console.log(`Album ${albumId}, Track ${track.index}: "${baseTitle}" → "${newTitle}"`);
    }
    
    titleCounts[baseTitle] = (titleCounts[baseTitle] || 0) + 1;
  }
  
  // Apply updates
  for (const { id, newTitle } of updates) {
    await db.update(tracks).set({ title: newTitle }).where(eq(tracks.id, id));
  }
}

console.log("✅ Fixed all duplicate titles!");
process.exit(0);
