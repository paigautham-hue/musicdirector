/**
 * PDF Album Booklet Generator
 * Creates beautiful PDF booklets with album artwork, track listings, and write-ups
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
 * Create the actual PDF document
 */
async function createPDFBooklet(data: AlbumBookletData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    (async () => {
      try {
        // Cover Page
        await addCoverPage(doc, data);

      // Album Info Page
      doc.addPage();
      addAlbumInfoPage(doc, data);

      // Track Listings
      doc.addPage();
      addTrackListings(doc, data);

      // Credits & Platform Info
      doc.addPage();
      addCreditsPage(doc, data);

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
     .text(album.title, 50, 100, {
       width: doc.page.width - 100,
       align: 'center',
     });

  // Album artwork (fetch and embed actual image)
  if (album.coverUrl) {
    try {
      const imageResponse = await fetch(album.coverUrl);
      if (imageResponse.ok) {
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const imageWidth = 300;
        const imageHeight = 300;
        const x = (doc.page.width - imageWidth) / 2;
        const y = 200;
        
        doc.image(imageBuffer, x, y, {
          width: imageWidth,
          height: imageHeight,
          align: 'center',
        });
      }
    } catch (error) {
      console.error('Failed to fetch album cover:', error);
      // Fallback to placeholder
      doc.fontSize(12)
         .fillColor('#888')
         .text('[Album Artwork]', 50, 200, {
           width: doc.page.width - 100,
           align: 'center',
         });
    }
  }

  // Platform badge
  doc.fontSize(14)
     .fillColor('#D4AF37')
     .text(`Generated on ${album.platform.toUpperCase()}`, 50, doc.page.height - 150, {
       width: doc.page.width - 100,
       align: 'center',
     });

  // Tagline
  doc.fontSize(16)
     .fillColor('#fff')
     .font('Helvetica-Oblique')
     .text('AI-Powered Music Album Creation', 50, doc.page.height - 100, {
       width: doc.page.width - 100,
       align: 'center',
     });
}

/**
 * Add album information page
 */
function addAlbumInfoPage(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;

  // Page title
  doc.fontSize(24)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('About This Album', 50, 50);

  let y = 100;

  // Album description
  if (album.description) {
    doc.fontSize(12)
       .fillColor('#333')
       .font('Helvetica')
       .text(album.description, 50, y, {
         width: doc.page.width - 100,
         align: 'justify',
         lineGap: 5,
       });
    y += doc.heightOfString(album.description, { width: doc.page.width - 100 }) + 30;
  }

  // Theme
  doc.fontSize(14)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Theme', 50, y);
  
  y += 25;
  
  doc.fontSize(11)
     .fillColor('#333')
     .font('Helvetica')
     .text(album.theme, 50, y, {
       width: doc.page.width - 100,
       align: 'justify',
       lineGap: 3,
     });

  y += doc.heightOfString(album.theme, { width: doc.page.width - 100 }) + 25;

  // Vibe/Genre
  if (album.vibe) {
    doc.fontSize(14)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text('Vibe & Genre', 50, y);
    
    y += 25;
    
    const vibes = Array.isArray(album.vibe) ? album.vibe : JSON.parse(album.vibe || '[]');
    doc.fontSize(11)
       .fillColor('#333')
       .font('Helvetica')
       .text(vibes.join(', '), 50, y, {
         width: doc.page.width - 100,
       });
    
    y += 40;
  }

  // Target Audience
  if (album.audience) {
    doc.fontSize(14)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text('Target Audience', 50, y);
    
    y += 25;
    
    doc.fontSize(11)
       .fillColor('#333')
       .font('Helvetica')
       .text(album.audience, 50, y, {
         width: doc.page.width - 100,
       });
    
    y += 40;
  }

  // Musical Influences
  if (album.influences) {
    doc.fontSize(14)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text('Musical Influences', 50, y);
    
    y += 25;
    
    const influences = Array.isArray(album.influences) 
      ? album.influences 
      : JSON.parse(album.influences || '[]');
    doc.fontSize(11)
       .fillColor('#333')
       .font('Helvetica')
       .text(influences.join(', '), 50, y, {
         width: doc.page.width - 100,
       });
  }
}

/**
 * Add track listings page
 */
function addTrackListings(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { tracks: albumTracks, trackAssets } = data;

  // Page title
  doc.fontSize(24)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Track Listing', 50, 50);

  let y = 100;

  albumTracks.forEach((track, index) => {
    // Check if we need a new page
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = 50;
    }

    // Track number and title
    doc.fontSize(14)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text(`${index + 1}. ${track.title}`, 50, y);

    y += 25;

    // Track details
    const details: string[] = [];
    if (track.tempoBpm) details.push(`Tempo: ${track.tempoBpm} BPM`);
    if (track.key) details.push(`Key: ${track.key}`);
    if (track.score) details.push(`Hit Score: ${track.score}/100`);

    if (details.length > 0) {
      doc.fontSize(10)
         .fillColor('#666')
         .font('Helvetica')
         .text(details.join(' • '), 70, y);
      y += 20;
    }

    // Mood tags
    if (track.moodTags) {
      const moods = Array.isArray(track.moodTags) 
        ? track.moodTags 
        : JSON.parse(track.moodTags || '[]');
      if (moods.length > 0) {
        doc.fontSize(9)
           .fillColor('#888')
           .font('Helvetica-Oblique')
           .text(`Mood: ${moods.join(', ')}`, 70, y);
        y += 20;
      }
    }

    // Add lyrics if available
    const lyricsAsset = trackAssets.find(a => a.trackId === track.id && a.type === 'lyrics');
    if (lyricsAsset && lyricsAsset.content) {
      y += 10;
      
      // Check if we need a new page for lyrics
      const lyricsHeight = doc.heightOfString(lyricsAsset.content, { 
        width: doc.page.width - 140,
        lineGap: 3
      });
      
      if (y + lyricsHeight > doc.page.height - 100) {
        doc.addPage();
        y = 50;
      }
      
      doc.fontSize(9)
         .fillColor('#555')
         .font('Helvetica')
         .text(lyricsAsset.content, 70, y, {
           width: doc.page.width - 140,
           align: 'left',
           lineGap: 3,
         });
      
      y += lyricsHeight + 20;
    }

    y += 15; // Space between tracks
  });

  // Total tracks summary
  y += 20;
  doc.fontSize(12)
     .fillColor('#333')
     .font('Helvetica-Bold')
     .text(`Total Tracks: ${albumTracks.length}`, 50, y);
}

/**
 * Add credits and platform information page
 */
function addCreditsPage(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;

  // Page title
  doc.fontSize(24)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Credits & Information', 50, 50);

  let y = 120;

  // Platform
  doc.fontSize(14)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Music Generation Platform', 50, y);
  
  y += 25;
  
  doc.fontSize(11)
     .fillColor('#333')
     .font('Helvetica')
     .text(album.platform.toUpperCase(), 50, y);
  
  y += 40;

  // Creation date
  doc.fontSize(14)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Created', 50, y);
  
  y += 25;
  
  doc.fontSize(11)
     .fillColor('#333')
     .font('Helvetica')
     .text(new Date(album.createdAt).toLocaleDateString('en-US', {
       year: 'numeric',
       month: 'long',
       day: 'numeric',
     }), 50, y);
  
  y += 60;

  // Powered by section
  doc.fontSize(12)
     .fillColor('#888')
     .font('Helvetica-Oblique')
     .text('Powered by AI Album Creator', 50, y, {
       width: doc.page.width - 100,
       align: 'center',
     });
  
  y += 30;
  
  doc.fontSize(10)
     .fillColor('#666')
     .font('Helvetica')
     .text('Create music that unites people, inspires change,', 50, y, {
       width: doc.page.width - 100,
       align: 'center',
     });
  
  y += 15;
  
  doc.fontSize(10)
     .fillColor('#666')
     .text('and brings positive impact to humanity', 50, y, {
       width: doc.page.width - 100,
       align: 'center',
     });

  // Footer
  doc.fontSize(8)
     .fillColor('#999')
     .text('© 2025 AI Album Creator. All rights reserved.', 50, doc.page.height - 80, {
       width: doc.page.width - 100,
       align: 'center',
     });
}
