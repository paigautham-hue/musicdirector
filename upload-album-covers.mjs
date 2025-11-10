import { storagePut } from './server/storage.ts';
import { getDb } from './server/db.ts';
import { albums } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import path from 'path';

const albumCoverMappings = [
  { title: 'Rain That Learns to Pray', filename: 'rain-that-learns-to-pray.png' },
  { title: 'Color Theory for Hearts', filename: 'color-theory-for-hearts.png' },
  { title: 'Borrowed Hours', filename: 'borrowed-hours.png' },
  { title: 'Where the Light Kneels', filename: 'where-the-light-kneels.png' },
  { title: 'Open Map', filename: 'open-map.png' },
  { title: 'City of Kindness', filename: 'city-of-kindness.png' },
  { title: 'Systems & Ghosts', filename: 'systems-and-ghosts.png' },
  { title: 'Baptism on the Freeway', filename: 'baptism-on-the-freeway.png' },
  { title: 'Piano for the Storm', filename: 'piano-for-the-storm.png' },
  { title: 'Freedom in Common Time', filename: 'freedom-in-common-time.png' },
  { title: 'Blueprint for Blue Skies', filename: 'blueprint-for-blue-skies.png' },
  { title: 'Ledger of the Heart', filename: 'ledger-of-the-heart.png' },
  { title: 'Sky Inside the Temple', filename: 'sky-inside-the-temple.png' },
  { title: 'Hands of Fire', filename: 'hands-of-fire.png' },
  { title: 'Breath, Becoming', filename: 'breath-becoming.png' },
];

async function uploadAlbumCovers() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    return;
  }

  console.log('Starting album cover upload...');

  for (const mapping of albumCoverMappings) {
    try {
      // Read the image file
      const filePath = path.join('/home/ubuntu/ai-album-creator/album-covers', mapping.filename);
      const fileBuffer = readFileSync(filePath);

      // Upload to S3
      const s3Key = `album-covers/${mapping.filename}`;
      const { url } = await storagePut(s3Key, fileBuffer, 'image/png');

      console.log(`✓ Uploaded ${mapping.filename} to S3: ${url}`);

      // Update database
      const result = await db
        .update(albums)
        .set({ coverImage: url })
        .where(eq(albums.title, mapping.title));

      console.log(`✓ Updated database for "${mapping.title}"`);
    } catch (error) {
      console.error(`✗ Error processing ${mapping.title}:`, error);
    }
  }

  console.log('\n✅ Album cover upload complete!');
}

uploadAlbumCovers().catch(console.error);
