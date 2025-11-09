import { storagePut } from './server/storage.ts';
import fs from 'fs';

const covers = [
  { file: '/home/ubuntu/ai-album-creator-covers/cover-mercy.png', key: 'album-covers/mercy-cartography.png', albumId: null },
  { file: '/home/ubuntu/ai-album-creator-covers/cover-decency.png', key: 'album-covers/decency-anthem.png', albumId: null },
  { file: '/home/ubuntu/ai-album-creator-covers/cover-megaphones.png', key: 'album-covers/mercy-megaphones.png', albumId: null },
  { file: '/home/ubuntu/ai-album-creator-covers/cover-uprising.png', key: 'album-covers/gentle-uprising.png', albumId: null }
];

for (const cover of covers) {
  const buffer = fs.readFileSync(cover.file);
  const result = await storagePut(cover.key, buffer, 'image/png');
  console.log(JSON.stringify({ key: cover.key, url: result.url }));
}
