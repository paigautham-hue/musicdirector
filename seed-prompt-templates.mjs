import { drizzle } from 'drizzle-orm/mysql2';
import { promptTemplates, users } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const promptsData = [
  {
    name: "Rain That Learns to Pray",
    theme: "Protest ballads that grow into meditations—questions that keep unfolding until anger becomes insight.",
    vibe: ["folk-rock", "protest ballad", "6/8 shuffle", "talk-sung verses", "chant-ready refrains"],
    platform: "suno",
    language: "en",
    audience: "students & civic groups, poets, night-drive playlists",
    influences: ["fingerpicked acoustic", "harmonica leads", "brushed snare + tambourine", "Hammond organ swells"],
    trackCount: 10
  },
  {
    name: "Color Theory for Hearts",
    theme: "From love to psyche to meaning—suite-like songs that move from chamber intimacy to kaleidoscopic bursts.",
    vibe: ["art-pop", "orchestral pop", "psychedelic pop", "multi-section song suites"],
    platform: "suno",
    language: "en",
    audience: "cross-gen pop fans, film/TV sync, playlist curators",
    influences: ["string quartet motifs", "Mellotron-style textures", "tape-loop interludes", "tempo/key shifts"],
    trackCount: 10
  },
  {
    name: "Borrowed Hours",
    theme: "Time, alienation, and the price of power—headphone odysseys that trade numbness for presence.",
    vibe: ["progressive rock", "ambient psych", "slow builds", "cinematic sound design"],
    platform: "suno",
    language: "en",
    audience: "late-night listeners, audiophiles, immersive show production",
    influences: ["clock-like foley", "lap-steel swells", "analog synth drones", "extended intros"],
    trackCount: 8
  },
  {
    name: "Where the Light Kneels",
    theme: "Sacred meets sensual—hymns for broken rooms, forgiveness as the bravest romance.",
    vibe: ["chamber-folk", "noir-pop", "baritone ballads", "intimate/minimal"],
    platform: "suno",
    language: "en",
    audience: "literary listeners, midnight radio, ceremony playlists",
    influences: ["nylon-string guitar", "low vocal close-mic", "small choir amen", "sparse drums"],
    trackCount: 9
  },
  {
    name: "Open Map",
    theme: "Radical honesty and harmony as philosophy—portraits of love, aging, and freedom in unusual chords.",
    vibe: ["folk-jazz", "confessional singer-songwriter", "alternate tunings", "sophisticated voicings"],
    platform: "suno",
    language: "en",
    audience: "songwriter communities, jazz-curious folk fans, coffeehouse→festival crossover",
    influences: ["open-tuned guitar", "lyrical woodwinds", "melodic bass counterpoint", "brushed kit"],
    trackCount: 10
  },
  {
    name: "City of Kindness",
    theme: "Joy and justice on the same dance floor—neighborhood stories that groove toward hope.",
    vibe: ["soul-pop", "funk", "gospel lift", "optimistic anthems"],
    platform: "suno",
    language: "en",
    audience: "families, schools/NGOs, festival mainstage",
    influences: ["clavinet grooves", "horn/strings call-and-response", "chromatic harmonica", "handclap breakdowns"],
    trackCount: 11
  },
  {
    name: "Systems & Ghosts",
    theme: "Anxiety in the machine and the self—fragile melodies floating over glitch and string warmth.",
    vibe: ["art-rock", "IDM-inflected alt", "ambient-orchestral", "dynamic switch-ups"],
    platform: "suno",
    language: "en",
    audience: "headphone crowds, tech creatives, late-night coders",
    influences: ["granular/bitcrush textures", "odd-meter pulses", "falsetto leads", "chamber strings"],
    trackCount: 9
  },
  {
    name: "Baptism on the Freeway",
    theme: "Identity, faith, and a nation's mirror—interlocking narratives where failure meets forgiveness.",
    vibe: ["hip-hop", "jazz-rap", "cinematic storytelling", "beat switch-ups", "hook-mantras"],
    platform: "suno",
    language: "en",
    audience: "hip-hop heads, activists, documentary/sync",
    influences: ["live jazz combos", "808 + choir lifts", "character skits", "spoken-word confessions"],
    trackCount: 12
  },
  {
    name: "Piano for the Storm",
    theme: "Dignity, rage, and liberation as art—ballads that glare, vamps that refuse to sit down.",
    vibe: ["jazz-soul", "piano-driven protest", "gospel-tinged climaxes"],
    platform: "suno",
    language: "en",
    audience: "civil society orgs, theatre/dance collaborators, late-night radio",
    influences: ["stern piano ostinatos", "dynamic crescendos", "call-and-response", "minimal string swells"],
    trackCount: 10
  },
  {
    name: "Freedom in Common Time",
    theme: "Resistance and redemption with community at the center—sermons you can dance to.",
    vibe: ["roots reggae", "one-drop uplift", "Nyabinghi→band builds", "dub interludes"],
    platform: "suno",
    language: "en",
    audience: "global reggae fans, street rallies→sunset festivals",
    influences: ["skank guitar", "deep round basslines", "harmony trios", "hand-drum breaks"],
    trackCount: 11
  },
  {
    name: "Blueprint for Blue Skies",
    theme: "Doubt, faith, and geopolitics turned into stadium prayers—feet marching, eyes on the horizon.",
    vibe: ["arena rock", "atmospheric rock", "anthemic", "protest-pop"],
    platform: "suno",
    language: "en",
    audience: "arena-pop fans, peace/civic groups, halftime rallies",
    influences: ["delay-drenched guitar arpeggios", "drumline tom builds", "gospel-choir bridge", "whoa-oh refrains"],
    trackCount: 10
  },
  {
    name: "Ledger of the Heart",
    theme: "Love, ego, and spiritual accounting—calling out the self and calling in grace.",
    vibe: ["neo-soul", "hip-hop soul", "acoustic confessional", "rap-sung flow"],
    platform: "suno",
    language: "en",
    audience: "couples, wellness/therapy spaces, reflective R&B listeners",
    influences: ["warm Rhodes", "unplugged guitar", "stacked harmonies", "boom-bap to live-band switch"],
    trackCount: 10
  },
  {
    name: "Sky Inside the Temple",
    theme: "Devotion meets modernity—East–West crescendos where prayer learns new instruments.",
    vibe: ["sufi-pop", "cinematic orchestral", "electronic fusion", "devotional anthem"],
    platform: "suno",
    language: "en",
    audience: "global diaspora, interfaith/cultural events, film/trailer sync",
    influences: ["bansuri and string ostinatos", "tabla/dholak grooves", "synth pads", "soaring mixed choir"],
    trackCount: 9
  },
  {
    name: "Hands of Fire",
    theme: "Ecstatic surrender as transcendence—call-and-response that climbs from ember to blaze.",
    vibe: ["qawwali-inspired world-pop", "long-form arcs", "devotional uplift"],
    platform: "suno",
    language: "en",
    audience: "spiritual festivals, yoga/meditation crowds, sunrise/sunset stages",
    influences: ["harmonium leads", "clapping cycles", "taal shifts", "ecstatic refrain vamps"],
    trackCount: 8
  },
  {
    name: "Breath, Becoming",
    theme: "Wordless prayer and disciplined freedom—melodic meditations that circle a single flame.",
    vibe: ["modal jazz", "spiritual jazz", "ambient-acoustic", "trance-like development"],
    platform: "suno",
    language: "en",
    audience: "jazz listeners, contemplative/therapy spaces, gallery/performance art",
    influences: ["tenor/soprano sax dialogues", "pedal drones", "polyrhythmic drum meditation", "bass ostinatos"],
    trackCount: 7
  }
];

async function seedPromptTemplates() {
  try {
    console.log('🌱 Starting to seed prompt templates...');
    
    const db = drizzle(process.env.DATABASE_URL);
    
    // Get admin user (owner)
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ No admin user found. Please ensure an admin user exists.');
      process.exit(1);
    }
    
    const adminUser = adminUsers[0];
    console.log(`✅ Found admin user: ${adminUser.name} (ID: ${adminUser.id})`);
    
    // Insert prompt templates
    for (const promptData of promptsData) {
      const result = await db.insert(promptTemplates).values({
        userId: adminUser.id,
        name: promptData.name,
        theme: promptData.theme,
        vibe: JSON.stringify(promptData.vibe),
        platform: promptData.platform,
        language: promptData.language,
        audience: promptData.audience,
        influences: JSON.stringify(promptData.influences),
        trackCount: promptData.trackCount,
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`✅ Added prompt: ${promptData.name}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${promptsData.length} prompt templates!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding prompt templates:', error);
    process.exit(1);
  }
}

seedPromptTemplates();
