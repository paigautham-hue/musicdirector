import { drizzle } from 'drizzle-orm/mysql2';
import { albums, users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const albumsData = [
  {
    title: "Rain That Learns to Pray",
    theme: "Protest ballads that grow into meditations—questions that keep unfolding until anger becomes insight.",
    description: "Protest ballads that grow into meditations—questions that keep unfolding until anger becomes insight.",
    vibe: ["folk-rock", "protest ballad", "6/8 shuffle", "talk-sung verses", "chant-ready refrains"],
    influences: "fingerpicked acoustic; harmonica leads; brushed snare + tambourine; Hammond organ swells; verses that reveal new images each chorus",
    audience: "students & civic groups, poets, night-drive playlists",
    coverImage: "/images/album-covers/rain-prayer.jpg",
    trackCount: 10
  },
  {
    title: "Color Theory for Hearts",
    theme: "From love to psyche to meaning—suite-like songs that move from chamber intimacy to kaleidoscopic bursts.",
    description: "From love to psyche to meaning—suite-like songs that move from chamber intimacy to kaleidoscopic bursts.",
    vibe: ["art-pop", "orchestral pop", "psychedelic pop", "multi-section song suites"],
    influences: "string quartet motifs; Mellotron-style textures; tape-loop interludes; tempo/key shifts; stacked harmonies",
    audience: "cross-gen pop fans, film/TV sync, playlist curators",
    coverImage: "/images/album-covers/color-theory.jpg",
    trackCount: 10
  },
  {
    title: "Borrowed Hours",
    theme: "Time, alienation, and the price of power—headphone odysseys that trade numbness for presence.",
    description: "Time, alienation, and the price of power—headphone odysseys that trade numbness for presence.",
    vibe: ["progressive rock", "ambient psych", "slow builds", "cinematic sound design"],
    influences: "clock-like foley; lap-steel swells; analog synth drones; extended intros→cathartic peaks",
    audience: "late-night listeners, audiophiles, immersive show production",
    coverImage: "/images/album-covers/borrowed-hours.jpg",
    trackCount: 8
  },
  {
    title: "Where the Light Kneels",
    theme: "Sacred meets sensual—hymns for broken rooms, forgiveness as the bravest romance.",
    description: "Sacred meets sensual—hymns for broken rooms, forgiveness as the bravest romance.",
    vibe: ["chamber-folk", "noir-pop", "baritone ballads", "intimate/minimal"],
    influences: "nylon-string guitar; low vocal close-mic; small choir 'amen'; sparse drums; bell/hand-percussion",
    audience: "literary listeners, midnight radio, ceremony playlists",
    coverImage: "/images/album-covers/light-kneels.jpg",
    trackCount: 9
  },
  {
    title: "Open Map",
    theme: "Radical honesty and harmony as philosophy—portraits of love, aging, and freedom in unusual chords.",
    description: "Radical honesty and harmony as philosophy—portraits of love, aging, and freedom in unusual chords.",
    vibe: ["folk-jazz", "confessional singer-songwriter", "alternate tunings", "sophisticated voicings"],
    influences: "open-tuned guitar; lyrical woodwinds; melodic bass counterpoint; brushed kit; piano-led closer",
    audience: "songwriter communities, jazz-curious folk fans, coffeehouse→festival crossover",
    coverImage: "/images/album-covers/open-map.jpg",
    trackCount: 10
  },
  {
    title: "City of Kindness",
    theme: "Joy and justice on the same dance floor—neighborhood stories that groove toward hope.",
    description: "Joy and justice on the same dance floor—neighborhood stories that groove toward hope.",
    vibe: ["soul-pop", "funk", "gospel lift", "optimistic anthems"],
    influences: "clavinet grooves; horn/strings call-and-response; chromatic harmonica cameo; handclap breakdowns",
    audience: "families, schools/NGOs, festival mainstage",
    coverImage: "/images/album-covers/city-kindness.jpg",
    trackCount: 11
  },
  {
    title: "Systems & Ghosts",
    theme: "Anxiety in the machine and the self—fragile melodies floating over glitch and string warmth.",
    description: "Anxiety in the machine and the self—fragile melodies floating over glitch and string warmth.",
    vibe: ["art-rock", "IDM-inflected alt", "ambient-orchestral", "dynamic switch-ups"],
    influences: "granular/bitcrush textures; odd-meter pulses; falsetto/soft leads; chamber strings; sub-bass blooms",
    audience: "headphone crowds, tech creatives, late-night coders",
    coverImage: "/images/album-covers/systems-ghosts.jpg",
    trackCount: 9
  },
  {
    title: "Baptism on the Freeway",
    theme: "Identity, faith, and a nation's mirror—interlocking narratives where failure meets forgiveness.",
    description: "Identity, faith, and a nation's mirror—interlocking narratives where failure meets forgiveness.",
    vibe: ["hip-hop", "jazz-rap", "cinematic storytelling", "beat switch-ups", "hook-mantras"],
    influences: "live jazz combos; 808 + choir lifts; character skits; spoken-word confessions; siren-to-silence dynamics",
    audience: "hip-hop heads, activists, documentary/sync",
    coverImage: "/images/album-covers/baptism-freeway.jpg",
    trackCount: 12
  },
  {
    title: "Piano for the Storm",
    theme: "Dignity, rage, and liberation as art—ballads that glare, vamps that refuse to sit down.",
    description: "Dignity, rage, and liberation as art—ballads that glare, vamps that refuse to sit down.",
    vibe: ["jazz-soul", "piano-driven protest", "gospel-tinged climaxes"],
    influences: "stern piano ostinatos; dynamic crescendos; call-and-response; minimal string swells; long vamp codas",
    audience: "civil society orgs, theatre/dance collaborators, late-night radio",
    coverImage: "/images/album-covers/piano-storm.jpg",
    trackCount: 10
  },
  {
    title: "Freedom in Common Time",
    theme: "Resistance and redemption with community at the center—sermons you can dance to.",
    description: "Resistance and redemption with community at the center—sermons you can dance to.",
    vibe: ["roots reggae", "one-drop uplift", "Nyabinghi→band builds", "dub interludes"],
    influences: "skank guitar; deep round basslines; harmony trios; hand-drum breaks; tape-echo throws",
    audience: "global reggae fans, street rallies→sunset festivals",
    coverImage: "/images/album-covers/freedom-common.jpg",
    trackCount: 11
  },
  {
    title: "Blueprint for Blue Skies",
    theme: "Doubt, faith, and geopolitics turned into stadium prayers—feet marching, eyes on the horizon.",
    description: "Doubt, faith, and geopolitics turned into stadium prayers—feet marching, eyes on the horizon.",
    vibe: ["arena rock", "atmospheric rock", "anthemic", "protest-pop"],
    influences: "delay-drenched guitar arpeggios; drumline tom builds; gospel-choir bridge; 'whoa-oh' crowd refrains",
    audience: "arena-pop fans, peace/civic groups, halftime rallies",
    coverImage: "/images/album-covers/blueprint-skies.jpg",
    trackCount: 10
  },
  {
    title: "Ledger of the Heart",
    theme: "Love, ego, and spiritual accounting—calling out the self and calling in grace.",
    description: "Love, ego, and spiritual accounting—calling out the self and calling in grace.",
    vibe: ["neo-soul", "hip-hop soul", "acoustic confessional", "rap-sung flow"],
    influences: "warm Rhodes; unplugged guitar; stacked harmonies; boom-bap to live-band switch",
    audience: "couples, wellness/therapy spaces, reflective R&B listeners",
    coverImage: "/images/album-covers/ledger-heart.jpg",
    trackCount: 10
  },
  {
    title: "Sky Inside the Temple",
    theme: "Devotion meets modernity—East–West crescendos where prayer learns new instruments.",
    description: "Devotion meets modernity—East–West crescendos where prayer learns new instruments.",
    vibe: ["sufi-pop", "cinematic orchestral", "electronic fusion", "devotional anthem"],
    influences: "bansuri and string ostinatos; tabla/dholak grooves; synth pads; soaring mixed choir; key-change finales",
    audience: "global diaspora, interfaith/cultural events, film/trailer sync",
    coverImage: "/images/album-covers/sky-temple.jpg",
    trackCount: 9
  },
  {
    title: "Hands of Fire",
    theme: "Ecstatic surrender as transcendence—call-and-response that climbs from ember to blaze.",
    description: "Ecstatic surrender as transcendence—call-and-response that climbs from ember to blaze.",
    vibe: ["qawwali-inspired world-pop", "long-form arcs", "devotional uplift"],
    influences: "harmonium leads; clapping cycles; taal shifts; ecstatic refrain vamps; tanpura drone bed",
    audience: "spiritual festivals, yoga/meditation crowds, sunrise/sunset stages",
    coverImage: "/images/album-covers/hands-fire.jpg",
    trackCount: 8
  },
  {
    title: "Breath, Becoming",
    theme: "Wordless prayer and disciplined freedom—melodic meditations that circle a single flame.",
    description: "Wordless prayer and disciplined freedom—melodic meditations that circle a single flame.",
    vibe: ["modal jazz", "spiritual jazz", "ambient-acoustic", "trance-like development"],
    influences: "tenor/soprano sax dialogues; pedal drones; polyrhythmic drum meditation; bass ostinatos; spacious room mics",
    audience: "jazz listeners, contemplative/therapy spaces, gallery/performance art",
    coverImage: "/images/album-covers/breath-becoming.jpg",
    trackCount: 7
  }
];

async function seedPublicAlbums() {
  try {
    console.log('🌱 Starting to seed public albums...');
    
    const db = drizzle(process.env.DATABASE_URL);
    
    // Get admin user (owner)
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ No admin user found. Please ensure an admin user exists.');
      process.exit(1);
    }
    
    const adminUser = adminUsers[0];
    console.log(`✅ Found admin user: ${adminUser.name} (ID: ${adminUser.id})`);
    
    // Insert albums
    for (const albumData of albumsData) {
      const result = await db.insert(albums).values({
        userId: adminUser.id,
        title: albumData.title,
        theme: albumData.theme,
        description: albumData.description,
        vibe: JSON.stringify(albumData.vibe),
        influences: albumData.influences,
        audience: albumData.audience,
        coverImage: albumData.coverImage,
        trackCount: albumData.trackCount,
        visibility: 'public',
        language: 'en',
        platform: 'suno',
        status: 'completed',
        qualityScore: Math.floor(Math.random() * 20) + 80, // Random score 80-100
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Added: ${albumData.title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${albumsData.length} public albums!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding albums:', error);
    process.exit(1);
  }
}

seedPublicAlbums();
