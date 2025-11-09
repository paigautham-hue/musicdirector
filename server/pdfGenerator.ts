/**
 * PDF Album Booklet Generator - Professional Magazine Style
 * Creates stunning, compact PDF booklets with two-column layouts and visual design
 */

import PDFDocument from 'pdfkit';
import { getDb } from './db';
import { albums, tracks, trackAssets } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface AlbumBookletData {
  album: typeof albums.$inferSelect;
  tracks: Array<typeof tracks.$inferSelect>;
  trackAssets: Array<typeof trackAssets.$inferSelect>;
}

/**
 * Generate a PDF album booklet
 */
export async function generateAlbumBooklet(albumId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Fetch album data
  const [album] = await db
    .select()
    .from(albums)
    .where(eq(albums.id, albumId))
    .limit(1);

  if (!album) {
    throw new Error(`Album ${albumId} not found`);
  }

  // Fetch tracks
  const albumTracks = await db
    .select()
    .from(tracks)
    .where(eq(tracks.albumId, albumId))
    .orderBy(tracks.index);

  // Fetch track assets for all tracks
  const assets: Array<typeof trackAssets.$inferSelect> = [];
  for (const track of albumTracks) {
    const trackAssetsList = await db
      .select()
      .from(trackAssets)
      .where(eq(trackAssets.trackId, track.id));
    assets.push(...trackAssetsList);
  }

  // Create PDF
  return createPDFBooklet({
    album,
    tracks: albumTracks,
    trackAssets: assets,
  });
}

/**
 * Create the actual PDF document with magazine-style layout
 */
async function createPDFBooklet(data: AlbumBookletData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    (async () => {
      try {
        // Cover Page
        await addCoverPage(doc, data);

        // Album Info & Track Listings (combined on same pages)
        doc.addPage();
        addAlbumInfoSection(doc, data);
        
        // Track listings with lyrics in two-column layout
        addAllTracksWithLyrics(doc, data);

        // Credits on last page
        addCreditsSection(doc, data);

        doc.end();
      } catch (error) {
        reject(error);
      }
    })();
  });
}

/**
 * Add cover page with album artwork
 */
async function addCoverPage(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;

  // Background gradient effect
  doc.rect(0, 0, doc.page.width, doc.page.height)
     .fillColor('#1a1a1a')
     .fill();

  // Title
  doc.fontSize(36)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text(album.title, 50, 80, {
       width: doc.page.width - 100,
       align: 'center',
     });

  // Album artwork
  if (album.coverUrl) {
    try {
      const imageResponse = await fetch(album.coverUrl);
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const imageWidth = 350;
        const imageHeight = 350;
        const x = (doc.page.width - imageWidth) / 2;
        const y = 180;
        
        doc.image(imageBuffer, x, y, {
          width: imageWidth,
          height: imageHeight,
          align: 'center',
        });
      }
    } catch (error) {
      console.error('Failed to fetch album cover:', error);
    }
  }

  // Platform badge
  doc.fontSize(14)
     .fillColor('#D4AF37')
     .text(`Generated on ${album.platform.toUpperCase()}`, 50, doc.page.height - 120, {
       width: doc.page.width - 100,
       align: 'center',
     });

  // Tagline
  doc.fontSize(16)
     .fillColor('#fff')
     .font('Helvetica-Oblique')
     .text('AI-Powered Music Album Creation', 50, doc.page.height - 80, {
       width: doc.page.width - 100,
       align: 'center',
     });
}

/**
 * Add album information section (compact)
 */
function addAlbumInfoSection(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;
  let y = 40;

  // Section header with decorative line
  doc.fontSize(22)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('About This Album', 40, y);
  
  y += 28;
  
  // Decorative line
  doc.moveTo(40, y)
     .lineTo(doc.page.width - 40, y)
     .strokeColor('#D4AF37')
     .lineWidth(2)
     .stroke();
  
  y += 15;

  // Theme in a box
  doc.roundedRect(40, y, doc.page.width - 80, 0)
     .fillColor('#f9f9f9')
     .fill();
  
  const themeBoxY = y;
  y += 10;
  
  doc.fontSize(11)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Theme:', 50, y);
  
  y += 14;
  
  doc.fontSize(10)
     .fillColor('#333')
     .font('Helvetica')
     .text(album.theme, 50, y, {
       width: doc.page.width - 100,
       align: 'justify',
       lineGap: 1,
     });
  
  const themeHeight = doc.heightOfString(album.theme, { width: doc.page.width - 100 });
  y += themeHeight + 10;
  
  // Draw the theme box
  doc.roundedRect(40, themeBoxY, doc.page.width - 80, y - themeBoxY, 5)
     .fillColor('#f9f9f9')
     .fill()
     .strokeColor('#ddd')
     .lineWidth(1)
     .stroke();
  
  y += 12;

  // Vibe, Audience, Influences in compact format
  const metadata: Array<{label: string, value: string}> = [];
  
  if (album.vibe) {
    const vibes = Array.isArray(album.vibe) ? album.vibe : JSON.parse(album.vibe || '[]');
    metadata.push({ label: 'Vibe', value: vibes.join(', ') });
  }
  
  if (album.audience) {
    metadata.push({ label: 'Audience', value: album.audience });
  }
  
  if (album.influences) {
    const influences = Array.isArray(album.influences) 
      ? album.influences 
      : JSON.parse(album.influences || '[]');
    metadata.push({ label: 'Influences', value: influences.join(', ') });
  }

  metadata.forEach(item => {
    doc.fontSize(9)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text(`${item.label}: `, 40, y, { continued: true })
       .fillColor('#555')
       .font('Helvetica')
       .text(item.value, {
         width: doc.page.width - 80,
       });
    y += 14;
  });

  return y + 10;
}

/**
 * Add all tracks with lyrics in magazine-style two-column layout
 */
function addAllTracksWithLyrics(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { tracks: albumTracks, trackAssets } = data;
  
  let y = doc.y + 20;
  
  // Check if we need a new page
  if (y > doc.page.height - 150) {
    doc.addPage();
    y = 40;
  }

  // Section header
  doc.fontSize(22)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Track Listing & Lyrics', 40, y);
  
  y += 28;
  
  // Decorative line
  doc.moveTo(40, y)
     .lineTo(doc.page.width - 40, y)
     .strokeColor('#D4AF37')
     .lineWidth(2)
     .stroke();
  
  y += 20;

  albumTracks.forEach((track, index) => {
    // Check if we need a new page for track header
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 40;
    }

    // Track header with background
    const headerHeight = 35;
    doc.roundedRect(40, y, doc.page.width - 80, headerHeight, 3)
       .fillColor('#f5f5f5')
       .fill()
       .strokeColor('#D4AF37')
       .lineWidth(1.5)
       .stroke();

    // Track number and title
    doc.fontSize(14)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text(`${index + 1}. ${track.title}`, 50, y + 10);

    // Track details on same line
    const details: string[] = [];
    if (track.tempoBpm) details.push(`${track.tempoBpm} BPM`);
    if (track.key) details.push(track.key);
    
    if (details.length > 0) {
      doc.fontSize(9)
         .fillColor('#666')
         .font('Helvetica')
         .text(details.join(' • '), 50, y + 22);
    }

    y += headerHeight + 8;

    // Add lyrics in TWO-COLUMN layout
    const lyricsAsset = trackAssets.find(a => a.trackId === track.id && a.type === 'lyrics');
    if (lyricsAsset && lyricsAsset.content) {
      y = addLyricsInTwoColumns(doc, lyricsAsset.content, y);
    }

    // Separator between tracks
    y += 8;
    doc.moveTo(40, y)
       .lineTo(doc.page.width - 40, y)
       .strokeColor('#ddd')
       .lineWidth(0.5)
       .stroke();
    y += 15;
  });
}

/**
 * Add lyrics in two-column magazine layout
 */
function addLyricsInTwoColumns(doc: PDFKit.PDFDocument, lyrics: string, startY: number): number {
  const columnWidth = (doc.page.width - 120) / 2; // Two columns with gap
  const columnGap = 20;
  const leftX = 50;
  const rightX = leftX + columnWidth + columnGap;
  const maxHeight = doc.page.height - 80; // Leave room for footer
  
  let currentY = startY;
  let currentColumn = 'left';
  
  // Split lyrics into lines
  const lines = lyrics.split('\n');
  
  for (const line of lines) {
    const lineHeight = doc.heightOfString(line || ' ', { 
      width: columnWidth,
      lineGap: 1
    }) + 2;
    
    // Check if we need to switch columns or pages
    if (currentY + lineHeight > maxHeight) {
      if (currentColumn === 'left') {
        // Switch to right column
        currentColumn = 'right';
        currentY = startY;
      } else {
        // Need new page
        doc.addPage();
        currentY = 40;
        currentColumn = 'left';
      }
    }
    
    const x = currentColumn === 'left' ? leftX : rightX;
    
    // Render line
    doc.fontSize(8)
       .fillColor('#444')
       .font(line.startsWith('[') ? 'Helvetica-Bold' : 'Helvetica')
       .text(line, x, currentY, {
         width: columnWidth,
         align: 'left',
         lineGap: 1,
       });
    
    currentY += lineHeight;
  }
  
  // Return the max Y position used (for next track)
  return currentColumn === 'right' ? currentY : Math.max(currentY, startY);
}

/**
 * Add credits section (compact footer on last page)
 */
function addCreditsSection(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;
  
  let y = doc.y + 30;
  
  // Check if we need space, otherwise add new page
  if (y > doc.page.height - 150) {
    doc.addPage();
    y = 40;
  }

  // Decorative line
  doc.moveTo(40, y)
     .lineTo(doc.page.width - 40, y)
     .strokeColor('#D4AF37')
     .lineWidth(2)
     .stroke();
  
  y += 15;

  // Credits in compact format
  doc.fontSize(10)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Platform: ', 40, y, { continued: true })
     .fillColor('#555')
     .font('Helvetica')
     .text(album.platform.toUpperCase());
  
  y += 16;
  
  doc.fontSize(10)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Created: ', 40, y, { continued: true })
     .fillColor('#555')
     .font('Helvetica')
     .text(new Date(album.createdAt).toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
     }));
  
  y += 16;
  
  doc.fontSize(10)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Total Tracks: ', 40, y, { continued: true })
     .fillColor('#555')
     .font('Helvetica')
     .text(`${data.tracks.length}`);
  
  y += 30;

  // Footer
  doc.fontSize(9)
     .fillColor('#888')
     .font('Helvetica-Oblique')
     .text('Powered by AI Album Creator', 40, y, {
       width: doc.page.width - 80,
       align: 'center',
     });
  
  y += 14;
  
  doc.fontSize(8)
     .fillColor('#999')
     .font('Helvetica')
     .text('© 2025 AI Album Creator. All rights reserved.', 40, y, {
       width: doc.page.width - 80,
       align: 'center',
     });
}
