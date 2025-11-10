import { drizzle } from 'drizzle-orm/mysql2';
import { tracks, albums } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Sample tracks data for each album
const albumTracks = {
  "Rain That Learns to Pray": [
    { title: "Questions in the Rain", lyrics: "[Verse 1]\nWhy do the clouds gather when we speak?\nWhy does silence sound like thunder?\nEvery drop that falls is asking\nEvery puddle holds a wonder\n\n[Chorus]\nRain that learns to pray\nWashes anger away\nQuestions keep unfolding\nUntil we see the day", trackNumber: 1, key: "Am", tempoBpm: 90 },
    { title: "The Protest Hymn", lyrics: "[Verse 1]\nWe march with open hands\nOur voices rise like morning\nNo hate in what we demand\nJust truth without adorning\n\n[Chorus]\nSing it loud, sing it clear\nLet the powerful hear\nThis is our prayer\nThis is our year", trackNumber: 2, key: "G", tempoBpm: 85 },
    { title: "Meditation on Anger", lyrics: "[Verse 1]\nI held my rage like a stone\nUntil it softened in my palm\nNow I see I'm not alone\nIn this journey toward calm\n\n[Bridge]\nAnger becomes insight\nWhen we hold it to the light", trackNumber: 3, key: "Dm", tempoBpm: 75 }
  ],
  "Color Theory for Hearts": [
    { title: "Red (The Beginning)", lyrics: "[Verse 1]\nLove starts as crimson fire\nBurning bright without control\nPassion's first desire\nIgnites the waiting soul\n\n[Chorus]\nRed is where we start\nThe color of the heart\nBefore we learn the art\nOf every other part", trackNumber: 1, key: "C", tempoBpm: 120 },
    { title: "Blue (The Depths)", lyrics: "[Verse 1]\nDeeper than the ocean\nCooler than the night\nBlue is pure devotion\nWhen love becomes insight\n\n[Bridge]\nDive into the blue\nFind what's always true", trackNumber: 2, key: "Am", tempoBpm: 95 },
    { title: "Yellow (The Joy)", lyrics: "[Verse 1]\nSunlight through the window\nLaughter in the air\nYellow is the glow\nOf love beyond compare\n\n[Chorus]\nYellow like the morning\nNo need for warning\nJoy is here to stay\nIn every golden ray", trackNumber: 3, key: "D", tempoBpm: 140 }
  ],
  "Borrowed Hours": [
    { title: "Clock Without Hands", lyrics: "[Verse 1]\nTime moves but I stand still\nWatching seconds slip away\nBorrowed hours to fill\nWith nothing left to say\n\n[Chorus]\nThese are borrowed hours\nNot truly ours\nWe trade our power\nFor empty towers", trackNumber: 1, key: "Em", tempoBpm: 65 },
    { title: "The Price of Power", lyrics: "[Verse 1]\nWhat did it cost to climb so high?\nWhat did we leave behind?\nEvery answer asks us why\nWe chose to be so blind\n\n[Bridge]\nPower has its price\nPaid in sacrifice", trackNumber: 2, key: "Bm", tempoBpm: 70 }
  ],
  "Where the Light Kneels": [
    { title: "Hymn for Broken Rooms", lyrics: "[Verse 1]\nIn this room where walls remember\nEvery word we couldn't say\nLight kneels down like tender ember\nShowing us another way\n\n[Chorus]\nWhere the light kneels\nWounds can heal\nWhat was hidden\nIs revealed", trackNumber: 1, key: "F", tempoBpm: 80 },
    { title: "Forgiveness Romance", lyrics: "[Verse 1]\nForgiveness is the bravest love\nThe hardest dance to learn\nIt asks for nothing from above\nJust courage at each turn\n\n[Bridge]\nTo forgive is to be free\nTo love is to see", trackNumber: 2, key: "Dm", tempoBpm: 75 }
  ],
  "Open Map": [
    { title: "Unusual Chords", lyrics: "[Verse 1]\nI found a chord that doesn't fit\nThe rules they taught in school\nBut when I play it, truth is lit\nIn ways that break the rule\n\n[Chorus]\nOpen map, no destination\nJust honest navigation\nLove and freedom in the sound\nOf chords we've never found", trackNumber: 1, key: "DADGAD", tempoBpm: 95 },
    { title: "Portraits of Aging", lyrics: "[Verse 1]\nLines upon my face like maps\nOf everywhere I've been\nTime has left its gentle gaps\nWhere light comes filtering in\n\n[Bridge]\nAging is becoming\nNot undoing", trackNumber: 2, key: "Em7", tempoBpm: 85 }
  ],
  "City of Kindness": [
    { title: "Neighborhood Stories", lyrics: "[Verse 1]\nOn this street where children play\nWhere neighbors know your name\nKindness grows in every way\nNo two days the same\n\n[Chorus]\nCity of kindness\nWhere joy meets justice\nDancing together\nNow and forever", trackNumber: 1, key: "G", tempoBpm: 110 },
    { title: "Groove Toward Hope", lyrics: "[Verse 1]\nWe're grooving toward tomorrow\nWith hope in every step\nNo time for fear or sorrow\nWe've got promises to keep\n\n[Bridge]\nHope is in the rhythm\nLove is in the system", trackNumber: 2, key: "C", tempoBpm: 115 }
  ],
  "Systems & Ghosts": [
    { title: "Anxiety Machine", lyrics: "[Verse 1]\nThe machine hums with worry\nCircuits filled with doubt\nEverything's a hurry\nCan't find the way out\n\n[Chorus]\nSystems and ghosts\nWhat we fear the most\nFragile melodies\nFloating over broken keys", trackNumber: 1, key: "F#m", tempoBpm: 100 },
    { title: "Glitch in the Self", lyrics: "[Verse 1]\nI found a glitch inside my code\nA loop that won't complete\nCarrying this heavy load\nOf patterns on repeat\n\n[Bridge]\nThe glitch is where I'm human\nThe error is illumination", trackNumber: 2, key: "Bm", tempoBpm: 95 }
  ],
  "Baptism on the Freeway": [
    { title: "Identity Crisis", lyrics: "[Verse 1]\nWho am I when the mirror lies?\nWho am I when the mask falls down?\nSearching for truth in disguise\nIn this restless town\n\n[Chorus]\nBaptism on the freeway\nWashing away what they say\nFinding faith in the breakdown\nRising up from the ground", trackNumber: 1, key: "Am", tempoBpm: 85 },
    { title: "Nation's Mirror", lyrics: "[Verse 1]\nThis nation is a mirror\nReflecting what we hide\nThe truth is getting clearer\nWe can't run, can't hide\n\n[Bridge]\nFailure meets forgiveness\nIn the mirror's witness", trackNumber: 2, key: "Em", tempoBpm: 90 }
  ],
  "Piano for the Storm": [
    { title: "Ballad That Glares", lyrics: "[Verse 1]\nThis piano speaks with fire\nEach note a righteous claim\nDignity won't tire\nWon't bow to fear or shame\n\n[Chorus]\nPiano for the storm\nPlaying to transform\nRage becomes an art\nLiberation starts", trackNumber: 1, key: "Cm", tempoBpm: 70 },
    { title: "Vamp of Liberation", lyrics: "[Verse 1]\nWe vamp until the morning\nRefusing to sit down\nThis is our warning\nJustice wears the crown\n\n[Bridge]\nVamp won't stop\nRise to the top", trackNumber: 2, key: "Gm", tempoBpm: 75 }
  ],
  "Freedom in Common Time": [
    { title: "One Drop Uplift", lyrics: "[Verse 1]\nOne drop, one heart\nOne love from the start\nResistance in the rhythm\nRedemption in the system\n\n[Chorus]\nFreedom in common time\nYour struggle is mine\nCommunity at the center\nTogether we enter", trackNumber: 1, key: "D", tempoBpm: 75 },
    { title: "Sermons You Can Dance To", lyrics: "[Verse 1]\nThe preacher's on the bass\nThe choir's in the drums\nGrace moves with grace\nWhen the rhythm comes\n\n[Bridge]\nDance to the sermon\nLove is the lesson", trackNumber: 2, key: "G", tempoBpm: 80 }
  ],
  "Blueprint for Blue Skies": [
    { title: "Stadium Prayer", lyrics: "[Verse 1]\nThousands raise their hands\nVoices join as one\nFeet marching across the lands\nUntil the work is done\n\n[Chorus]\nBlueprint for blue skies\nWhere hope never dies\nFaith and doubt collide\nEyes on the horizon wide", trackNumber: 1, key: "E", tempoBpm: 130 },
    { title: "Marching Toward Tomorrow", lyrics: "[Verse 1]\nWe march with steady feet\nToward a world we've never seen\nEvery heart a drumbeat\nFor what could be, what might have been\n\n[Bridge]\nTomorrow calls our name\nNothing stays the same", trackNumber: 2, key: "A", tempoBpm: 125 }
  ],
  "Ledger of the Heart": [
    { title: "Spiritual Accounting", lyrics: "[Verse 1]\nI kept a ledger of my love\nDebits and credits in a row\nBut grace came from above\nAnd taught me to let go\n\n[Chorus]\nLedger of the heart\nWhere do I start?\nCalling out the self\nCalling in the wealth", trackNumber: 1, key: "F", tempoBpm: 85 },
    { title: "Ego and Grace", lyrics: "[Verse 1]\nMy ego built a wall\nSo high I couldn't see\nBut grace began to call\nAnd set my spirit free\n\n[Bridge]\nEgo falls away\nGrace is here to stay", trackNumber: 2, key: "Bb", tempoBpm: 90 }
  ],
  "Sky Inside the Temple": [
    { title: "East Meets West", lyrics: "[Verse 1]\nBansuri whispers ancient prayer\nStrings answer with their song\nEast and West meet in the air\nWhere we all belong\n\n[Chorus]\nSky inside the temple\nDevot ion made simple\nPrayer learns new sound\nWhere all faiths are found", trackNumber: 1, key: "Am", tempoBpm: 95 },
    { title: "Prayer's New Instruments", lyrics: "[Verse 1]\nThe tabla speaks in sacred time\nThe synth pad swells with light\nModernity and the sublime\nUnite in prayer tonight\n\n[Bridge]\nNew instruments, old soul\nTogether we are whole", trackNumber: 2, key: "Dm", tempoBpm: 100 }
  ],
  "Hands of Fire": [
    { title: "Ecstatic Surrender", lyrics: "[Verse 1]\nHands raised to the sky\nVoices climb so high\nSurrender to the fire\nRising ever higher\n\n[Chorus]\nHands of fire\nBurning with desire\nFrom ember to blaze\nLost in the praise", trackNumber: 1, key: "G", tempoBpm: 105 },
    { title: "Call and Response", lyrics: "[Verse 1]\nI call and you answer\nYou call and I reply\nWe're all dancers\nReaching for the sky\n\n[Bridge]\nCall and response\nTranscendence at once", trackNumber: 2, key: "D", tempoBpm: 110 }
  ],
  "Breath, Becoming": [
    { title: "Wordless Prayer", lyrics: "[Instrumental]\n(Tenor saxophone leads)\n(Soprano saxophone responds)\n(Bass ostinato grounds)\n(Drums meditate)\n\n[Note: This is a wordless meditation]", trackNumber: 1, key: "Dm", tempoBpm: 60 },
    { title: "Circling the Flame", lyrics: "[Instrumental]\n(Modal improvisation)\n(Pedal drone sustains)\n(Polyrhythmic patterns)\n(Spacious room ambience)\n\n[Note: Melodic meditation without words]", trackNumber: 2, key: "Am", tempoBpm: 65 }
  ]
};

async function seedTracks() {
  try {
    console.log('🌱 Starting to seed tracks for albums...');
    
    const db = drizzle(process.env.DATABASE_URL);
    
    // Get all public albums
    const publicAlbums = await db.select().from(albums).where(eq(albums.visibility, 'public'));
    
    console.log(`✅ Found ${publicAlbums.length} public albums`);
    
    let totalTracksAdded = 0;
    
    // Add tracks for each album
    for (const album of publicAlbums) {
      const tracksData = albumTracks[album.title];
      
      if (!tracksData) {
        console.log(`⚠️  No track data found for: ${album.title}`);
        continue;
      }
      
      for (const trackData of tracksData) {
        await db.insert(tracks).values({
          albumId: album.id,
          index: trackData.trackNumber,
          title: trackData.title,
          lyrics: trackData.lyrics,
          key: trackData.key,
          tempoBpm: trackData.tempoBpm,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        totalTracksAdded++;
      }
      
      console.log(`✅ Added ${tracksData.length} tracks for: ${album.title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${totalTracksAdded} tracks across ${publicAlbums.length} albums!`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding tracks:', error);
    process.exit(1);
  }
}

seedTracks();
