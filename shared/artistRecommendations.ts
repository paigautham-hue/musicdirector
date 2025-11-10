/**
 * Artist recommendations based on genre and vibe combinations
 */

export interface ArtistRecommendation {
  name: string;
  genres: string[];
  vibes: string[];
}

export const ARTIST_DATABASE: ArtistRecommendation[] = [
  // Rock
  { name: "Radiohead", genres: ["rock", "alternative"], vibes: ["melancholic", "experimental", "atmospheric", "contemplative"] },
  { name: "The Strokes", genres: ["rock", "indie"], vibes: ["rebellious", "raw", "high-energy", "edgy"] },
  { name: "Arctic Monkeys", genres: ["rock", "indie"], vibes: ["confident", "driving", "modern", "playful"] },
  { name: "Pink Floyd", genres: ["rock", "progressive"], vibes: ["psychedelic", "cinematic", "contemplative", "atmospheric"] },
  { name: "Led Zeppelin", genres: ["rock", "blues"], vibes: ["powerful", "raw", "intense", "classic"] },
  
  // Pop
  { name: "Billie Eilish", genres: ["pop", "alternative"], vibes: ["dark", "intimate", "minimalist", "haunting"] },
  { name: "Taylor Swift", genres: ["pop", "country"], vibes: ["romantic", "nostalgic", "confident", "storytelling"] },
  { name: "The Weeknd", genres: ["pop", "r&b"], vibes: ["dark", "sensual", "modern", "atmospheric"] },
  { name: "Dua Lipa", genres: ["pop", "dance"], vibes: ["confident", "uplifting", "high-energy", "modern"] },
  { name: "Lorde", genres: ["pop", "alternative"], vibes: ["introspective", "ethereal", "minimalist", "poetic"] },
  
  // Hip-Hop
  { name: "Kendrick Lamar", genres: ["hip-hop", "rap"], vibes: ["conscious", "intense", "storytelling", "experimental"] },
  { name: "Drake", genres: ["hip-hop", "r&b"], vibes: ["smooth", "confident", "emotional", "modern"] },
  { name: "Tyler, The Creator", genres: ["hip-hop", "alternative"], vibes: ["experimental", "playful", "raw", "creative"] },
  { name: "J. Cole", genres: ["hip-hop", "rap"], vibes: ["introspective", "storytelling", "soulful", "authentic"] },
  { name: "Travis Scott", genres: ["hip-hop", "trap"], vibes: ["psychedelic", "atmospheric", "high-energy", "dark"] },
  
  // Electronic
  { name: "Daft Punk", genres: ["electronic", "dance"], vibes: ["futuristic", "euphoric", "polished", "cinematic"] },
  { name: "Aphex Twin", genres: ["electronic", "idm"], vibes: ["experimental", "chaotic", "innovative", "complex"] },
  { name: "Flume", genres: ["electronic", "future bass"], vibes: ["dreamy", "lush", "modern", "atmospheric"] },
  { name: "Burial", genres: ["electronic", "dubstep"], vibes: ["dark", "atmospheric", "melancholic", "lo-fi"] },
  { name: "ODESZA", genres: ["electronic", "chillwave"], vibes: ["uplifting", "ethereal", "cinematic", "euphoric"] },
  
  // Indie
  { name: "Tame Impala", genres: ["indie", "psychedelic"], vibes: ["dreamy", "psychedelic", "nostalgic", "lush"] },
  { name: "Bon Iver", genres: ["indie", "folk"], vibes: ["melancholic", "intimate", "ethereal", "vulnerable"] },
  { name: "Mac DeMarco", genres: ["indie", "lo-fi"], vibes: ["laid-back", "lo-fi", "playful", "nostalgic"] },
  { name: "The National", genres: ["indie", "alternative"], vibes: ["melancholic", "contemplative", "mature", "literary"] },
  { name: "Vampire Weekend", genres: ["indie", "pop"], vibes: ["playful", "upbeat", "eclectic", "sophisticated"] },
  
  // R&B/Soul
  { name: "Frank Ocean", genres: ["r&b", "alternative"], vibes: ["introspective", "dreamy", "intimate", "poetic"] },
  { name: "SZA", genres: ["r&b", "neo-soul"], vibes: ["vulnerable", "sensual", "modern", "honest"] },
  { name: "D'Angelo", genres: ["r&b", "neo-soul"], vibes: ["soulful", "organic", "sensual", "classic"] },
  { name: "Jhené Aiko", genres: ["r&b", "alternative"], vibes: ["ethereal", "intimate", "healing", "spiritual"] },
  { name: "Anderson .Paak", genres: ["r&b", "funk"], vibes: ["groovy", "energetic", "soulful", "versatile"] },
  
  // Jazz
  { name: "Miles Davis", genres: ["jazz", "fusion"], vibes: ["sophisticated", "innovative", "cool", "timeless"] },
  { name: "John Coltrane", genres: ["jazz", "avant-garde"], vibes: ["spiritual", "intense", "exploratory", "passionate"] },
  { name: "Kamasi Washington", genres: ["jazz", "spiritual"], vibes: ["epic", "spiritual", "cinematic", "uplifting"] },
  { name: "Robert Glasper", genres: ["jazz", "hip-hop"], vibes: ["modern", "experimental", "soulful", "innovative"] },
  
  // Folk/Acoustic
  { name: "Sufjan Stevens", genres: ["folk", "indie"], vibes: ["intimate", "orchestral", "melancholic", "poetic"] },
  { name: "Fleet Foxes", genres: ["folk", "indie"], vibes: ["harmonious", "pastoral", "nostalgic", "lush"] },
  { name: "Iron & Wine", genres: ["folk", "indie"], vibes: ["gentle", "intimate", "warm", "storytelling"] },
  { name: "Phoebe Bridgers", genres: ["folk", "indie"], vibes: ["melancholic", "vulnerable", "intimate", "haunting"] },
  
  // Metal
  { name: "Metallica", genres: ["metal", "thrash"], vibes: ["aggressive", "powerful", "intense", "raw"] },
  { name: "Tool", genres: ["metal", "progressive"], vibes: ["dark", "complex", "intense", "philosophical"] },
  { name: "Gojira", genres: ["metal", "progressive"], vibes: ["heavy", "environmental", "powerful", "technical"] },
  
  // Ambient/Experimental
  { name: "Brian Eno", genres: ["ambient", "experimental"], vibes: ["atmospheric", "meditative", "innovative", "spacious"] },
  { name: "Sigur Rós", genres: ["ambient", "post-rock"], vibes: ["ethereal", "cinematic", "hopeful", "otherworldly"] },
  { name: "Boards of Canada", genres: ["electronic", "ambient"], vibes: ["nostalgic", "mysterious", "lo-fi", "dreamy"] },
];

/**
 * Get artist recommendations based on genre and vibes
 */
export function getArtistRecommendations(
  selectedGenres: string[],
  selectedVibes: string[],
  limit: number = 8
): ArtistRecommendation[] {
  if (selectedGenres.length === 0 && selectedVibes.length === 0) {
    // Return random artists if nothing selected
    return [...ARTIST_DATABASE].sort(() => Math.random() - 0.5).slice(0, limit);
  }

  // Score each artist based on matches
  const scoredArtists = ARTIST_DATABASE.map((artist) => {
    let score = 0;
    
    // Genre matches (higher weight)
    const genreMatches = artist.genres.filter((g) =>
      selectedGenres.some((sg) => g.toLowerCase().includes(sg.toLowerCase()) || sg.toLowerCase().includes(g.toLowerCase()))
    ).length;
    score += genreMatches * 3;
    
    // Vibe matches
    const vibeMatches = artist.vibes.filter((v) =>
      selectedVibes.some((sv) => v.toLowerCase().includes(sv.toLowerCase()) || sv.toLowerCase().includes(v.toLowerCase()))
    ).length;
    score += vibeMatches * 1;
    
    return { artist, score };
  });

  // Sort by score and return top matches
  return scoredArtists
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.artist);
}

/**
 * Extract genre keywords from user input
 */
export function extractGenreKeywords(text: string): string[] {
  const commonGenres = [
    "rock", "pop", "hip-hop", "rap", "electronic", "edm", "indie", "alternative",
    "jazz", "blues", "country", "folk", "metal", "punk", "r&b", "soul",
    "funk", "reggae", "classical", "ambient", "experimental", "dance", "house",
    "techno", "dubstep", "trap", "lo-fi", "psychedelic", "progressive"
  ];
  
  const lowerText = text.toLowerCase();
  return commonGenres.filter((genre) => lowerText.includes(genre));
}
