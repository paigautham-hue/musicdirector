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
      margins: { top: 60, bottom: 60, left: 40, right: 40 }, // Increased top/bottom for header/footer
      bufferPages: true, // Enable page buffering for headers/footers
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    (async () => {
      try {
        // Cover Page
        await addCoverPage(doc, data);

        // Table of Contents on page 2
        doc.addPage();
        const trackPageMap = addTableOfContents(doc, data);

        // Album Info & Track Listings (combined on same pages)
        doc.addPage();
        addAlbumInfoSection(doc, data);
        
        // Philosophical Introduction
        addPhilosophicalIntroduction(doc, data);
        
        // Track listings with lyrics in two-column layout
        addAllTracksWithLyrics(doc, data);

        // Credits on last page
        addCreditsSection(doc, data);

        // Add headers and page numbers to all pages (except cover)
        addHeadersAndPageNumbers(doc, data);

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
 * Add table of contents with clickable track links
 */
function addTableOfContents(doc: PDFKit.PDFDocument, data: AlbumBookletData): Map<number, number> {
  const { album, tracks: albumTracks } = data;
  const trackPageMap = new Map<number, number>();
  
  let y = 60;

  // Title
  doc.fontSize(26)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('Table of Contents', 40, y);
  
  y += 35;
  
  // Decorative line
  doc.moveTo(40, y)
     .lineTo(doc.page.width - 40, y)
     .strokeColor('#D4AF37')
     .lineWidth(2)
     .stroke();
  
  y += 25;

  // Add each track with placeholder page numbers
  // We'll update these later when we know actual page numbers
  albumTracks.forEach((track, index) => {
    if (y > doc.page.height - 100) {
      doc.addPage();
      y = 60;
    }

    const trackNumber = `${index + 1}.`;
    const trackTitle = track.title;
    
    // Track number and title
    doc.fontSize(11)
       .fillColor('#333')
       .font('Helvetica')
       .text(trackNumber, 50, y, { continued: true })
       .text(` ${trackTitle}`, { 
         link: `track_${track.id}`,
         underline: false,
       });
    
    // Dotted line
    const titleWidth = doc.widthOfString(`${trackNumber} ${trackTitle}`);
    const dotsX = 50 + titleWidth + 10;
    const pageNumX = doc.page.width - 80;
    
    doc.fontSize(11)
       .fillColor('#ccc')
       .text('.'.repeat(Math.floor((pageNumX - dotsX) / 3)), dotsX, y, {
         width: pageNumX - dotsX,
       });
    
    // Placeholder for page number (will be updated later)
    doc.fontSize(11)
       .fillColor('#D4AF37')
       .font('Helvetica-Bold')
       .text('--', pageNumX, y, {
         width: 30,
         align: 'right',
       });
    
    y += 20;
  });

  return trackPageMap;
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
 * Add philosophical introduction about the album
 */
function addPhilosophicalIntroduction(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;
  
  let y = doc.y + 25;
  
  // Check if we need a new page
  if (y > doc.page.height - 300) {
    doc.addPage();
    y = 40;
  }

  // Section header with decorative line
  doc.fontSize(18)
     .fillColor('#D4AF37')
     .font('Helvetica-Bold')
     .text('A Journey Through Sound', 40, y);
  
  y += 24;
  
  // Decorative line
  doc.moveTo(40, y)
     .lineTo(doc.page.width - 40, y)
     .strokeColor('#D4AF37')
     .lineWidth(1.5)
     .stroke();
  
  y += 18;

  // Generate philosophical introduction based on album theme
  const introduction = generatePhilosophicalText(album);
  
  // Render introduction text in elegant format
  doc.fontSize(10)
     .fillColor('#333')
     .font('Helvetica')
     .text(introduction, 40, y, {
       width: doc.page.width - 80,
       align: 'justify',
       lineGap: 3,
     });
  
  const introHeight = doc.heightOfString(introduction, { 
    width: doc.page.width - 80,
    lineGap: 3
  });
  
  y += introHeight + 20;
  
  // Add a subtle quote or tagline
  doc.fontSize(11)
     .fillColor('#D4AF37')
     .font('Helvetica-Oblique')
     .text('"Music is the bridge between the soul and the infinite."', 40, y, {
       width: doc.page.width - 80,
       align: 'center',
     });
  
  return y + 30;
}

/**
 * Generate philosophical text based on album theme
 */
function generatePhilosophicalText(album: typeof albums.$inferSelect): string {
  const theme = album.theme.toLowerCase();
  
  // Create compelling philosophical introduction based on common themes
  if (theme.includes('decency') || theme.includes('honest') || theme.includes('integrity')) {
    return `In a world that often celebrates the grand gesture and the headline-making moment, this album stands as a testament to the quiet power of everyday decency. Each track explores the profound truth that civilization is not built by heroes alone, but by millions of small, honest acts performed by ordinary people in extraordinary moments of choice.\n\nThese songs are not anthems of revolution in the traditional sense—they are hymns to the revolutionary act of choosing kindness when no one is watching, of maintaining integrity when compromise would be easier, of building trust through consistency rather than spectacle. They remind us that the foundation of any just society is laid not in marble halls, but in the countless moments when individuals choose to do what is right simply because it is right.\n\nThis is music for those who understand that true change begins not with grand declarations, but with the simple decision to be decent, to be honest, to be true—one choice, one moment, one person at a time.`;
  } else if (theme.includes('peace') || theme.includes('unity') || theme.includes('together')) {
    return `Music has always been humanity's universal language, transcending borders, beliefs, and barriers to speak directly to the human heart. This album embodies that timeless truth, weaving together melodies and messages that remind us of our shared humanity and our collective capacity for compassion.\n\nEach composition serves as a meditation on the power of unity—not uniformity, but the beautiful harmony that emerges when diverse voices come together in mutual respect and understanding. These tracks explore the delicate balance between individual expression and collective harmony, showing us that true peace is not the absence of difference, but the presence of grace in how we navigate those differences.\n\nListen with an open heart, and you may find that these songs do more than entertain—they invite you to participate in the ancient and ongoing work of building bridges, healing divisions, and recognizing the divine spark that connects us all.`;
  } else if (theme.includes('hope') || theme.includes('light') || theme.includes('dream')) {
    return `Hope is not naive optimism—it is the courageous act of believing in possibility even when surrounded by evidence to the contrary. This album captures that essential human quality, the stubborn refusal to surrender to despair, the persistent belief that tomorrow can be better than today.\n\nThrough melody and verse, these tracks chart the journey from darkness to light, from doubt to determination, from isolation to connection. They acknowledge the weight of our challenges while celebrating the resilience of the human spirit. Each song is a reminder that hope is not passive waiting, but active creation—the decision to plant seeds even in uncertain soil, to light candles rather than curse the darkness.\n\nThis music invites you to remember your own capacity for renewal, your own power to transform pain into purpose, and your own role in creating the future we all hope to see.`;
  } else if (theme.includes('justice') || theme.includes('rights') || theme.includes('freedom')) {
    return `Justice is not a destination but a direction—a constant striving toward a more equitable and compassionate world. This album gives voice to that eternal struggle, honoring both the victories won and the work yet to be done in humanity's long march toward fairness and dignity for all.\n\nThese songs understand that true justice is not merely about laws and systems, but about the fundamental recognition of human worth and the courage to stand up when that worth is threatened. They celebrate the quiet heroes who speak truth to power, the everyday activists who choose solidarity over comfort, and the communities that refuse to accept injustice as inevitable.\n\nLet this music strengthen your resolve, deepen your empathy, and remind you that the arc of history bends toward justice only because people like you choose to bend it—through action, through advocacy, through the simple but profound act of caring about the welfare of others as much as your own.`;
  } else {
    // Generic but compelling introduction for any theme
    return `Every album is a journey, but this one invites you to travel deeper—beyond the surface of sound into the realm of meaning, beyond entertainment into transformation. These tracks are more than songs; they are meditations, provocations, and invitations to see the world and yourself with fresh eyes.\n\nDrawn from the theme of "${album.theme}", this collection explores the intersections of personal experience and universal truth, of individual struggle and collective wisdom. Each composition offers a different lens through which to examine the questions that matter most: Who are we? What do we value? How do we live with integrity in a complex world?\n\nAs you listen, allow yourself to be present with both the music and the message. Let the melodies carry you, let the words challenge you, and let the silence between the notes remind you that sometimes the most profound truths are found not in what is said, but in what is felt. This is music that asks something of you—not just your attention, but your reflection, your empathy, your willingness to be moved.`;
  }
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

    // Add destination anchor for TOC linking
    doc.addNamedDestination(`track_${track.id}`);

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
  
  let leftColumnY = startY;
  let rightColumnY = startY;
  let currentColumn = 'left';
  
  // Split lyrics into lines
  const lines = lyrics.split('\n');
  
  for (const line of lines) {
    const lineHeight = doc.heightOfString(line || ' ', { 
      width: columnWidth,
      lineGap: 1
    }) + 2;
    
    const currentY = currentColumn === 'left' ? leftColumnY : rightColumnY;
    
    // Check if we need to switch columns or pages
    if (currentY + lineHeight > maxHeight) {
      if (currentColumn === 'left') {
        // Switch to right column
        currentColumn = 'right';
      } else {
        // Need new page - both columns are full
        doc.addPage();
        leftColumnY = 40;
        rightColumnY = 40;
        currentColumn = 'left';
      }
    }
    
    const x = currentColumn === 'left' ? leftX : rightX;
    const y = currentColumn === 'left' ? leftColumnY : rightColumnY;
    
    // Render line
    doc.fontSize(8)
       .fillColor('#444')
       .font(line.startsWith('[') ? 'Helvetica-Bold' : 'Helvetica')
       .text(line, x, y, {
         width: columnWidth,
         align: 'left',
         lineGap: 1,
       });
    
    // Update the Y position for the current column
    if (currentColumn === 'left') {
      leftColumnY += lineHeight;
    } else {
      rightColumnY += lineHeight;
    }
  }
  
  // Return the max Y position used (whichever column is lower)
  return Math.max(leftColumnY, rightColumnY);
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

/**
 * Add headers and page numbers to all pages (except cover)
 */
function addHeadersAndPageNumbers(doc: PDFKit.PDFDocument, data: AlbumBookletData) {
  const { album } = data;
  const pageCount = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pageCount; i++) {
    // Skip cover page (page 0)
    if (i === 0) continue;
    
    doc.switchToPage(i);
    
    // Add header with album title
    doc.fontSize(9)
       .fillColor('#D4AF37')
       .font('Helvetica')
       .text(album.title, 40, 30, {
         width: doc.page.width - 80,
         align: 'center',
       });
    
    // Add decorative line under header
    doc.moveTo(40, 45)
       .lineTo(doc.page.width - 40, 45)
       .strokeColor('#D4AF37')
       .lineWidth(0.5)
       .stroke();
    
    // Add page number at bottom
    doc.fontSize(9)
       .fillColor('#888')
       .font('Helvetica')
       .text(`${i + 1}`, 40, doc.page.height - 40, {
         width: doc.page.width - 80,
         align: 'center',
       });
  }
}
