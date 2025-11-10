import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Star, TrendingUp, Gem, Music, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface DiscoveryPlaylistsProps {
  variant?: "home" | "full";
}

export function DiscoveryPlaylists({ variant = "home" }: DiscoveryPlaylistsProps) {
  const [activePlaylist, setActivePlaylist] = useState<"staff_picks" | "trending" | "hidden_gems">("staff_picks");
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const limit = variant === "home" ? 6 : 20;

  const { data: staffPicks, isLoading: loadingStaff } = trpc.recommendations.getStaffPicks.useQuery({ limit });
  const { data: trending, isLoading: loadingTrending } = trpc.recommendations.getTrendingPotential.useQuery({ limit });
  const { data: hiddenGems, isLoading: loadingGems } = trpc.recommendations.getHiddenGems.useQuery({ limit });

  const playlists = [
    {
      id: "staff_picks",
      title: "Staff Picks",
      description: "Exceptional tracks chosen by our AI curator",
      icon: Star,
      gradient: "from-yellow-500 to-orange-500",
      data: staffPicks,
      isLoading: loadingStaff,
      badge: "85+ Score"
    },
    {
      id: "trending",
      title: "Trending Potential",
      description: "Songs likely to go viral",
      icon: TrendingUp,
      gradient: "from-pink-500 to-purple-500",
      data: trending,
      isLoading: loadingTrending,
      badge: "75-84 Score"
    },
    {
      id: "hidden_gems",
      title: "Hidden Gems",
      description: "High quality tracks waiting to be discovered",
      icon: Gem,
      gradient: "from-cyan-500 to-blue-500",
      data: hiddenGems,
      isLoading: loadingGems,
      badge: "70-84 Score"
    }
  ];

  const activeData = playlists.find(p => p.id === activePlaylist);

  const handlePlayPause = (trackId: number, audioUrl: string) => {
    if (currentTrackId === trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentTrackId(trackId);
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTrackId(null);
      };
    }
  }, []);

  if (variant === "home") {
    return (
      <div className="space-y-6">
        <audio ref={audioRef} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI-Curated Playlists
            </h2>
            <p className="text-foreground/60 mt-1">Discover exceptional music chosen by our AI curator</p>
          </div>
          <Link href="/discovery">
            <Button variant="outline" className="gap-2">
              View All
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Playlist Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playlists.map((playlist) => {
            const Icon = playlist.icon;
            return (
              <button
                key={playlist.id}
                onClick={() => setActivePlaylist(playlist.id as any)}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  activePlaylist === playlist.id
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${playlist.gradient}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{playlist.title}</h3>
                    <p className="text-sm text-foreground/60 mt-1">{playlist.description}</p>
                    <Badge variant="secondary" className="mt-2">{playlist.badge}</Badge>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Track Grid */}
        <div>
          {activeData?.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeData?.data?.slice(0, 6).map((track) => (
                <Card key={track.id} className="group hover:shadow-lg transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Album Cover */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={track.album.coverUrl || "/placeholder-album.png"}
                          alt={track.album.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        {track.audio.url && (
                          <button
                            onClick={() => handlePlayPause(track.id, track.audio.url)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {currentTrackId === track.id && isPlaying ? (
                              <Pause className="w-6 h-6 text-white" />
                            ) : (
                              <Play className="w-6 h-6 text-white" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/album/${track.albumId}`}>
                          <h4 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                            {track.title}
                          </h4>
                        </Link>
                        <p className="text-xs text-foreground/60 truncate">{track.album.title}</p>
                        <p className="text-xs text-foreground/60 truncate">by {track.creator.name}</p>
                        
                        {/* Score Badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {track.score}/100
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full page variant
  return (
    <div className="space-y-8">
      <audio ref={audioRef} />
      
      {playlists.map((playlist) => {
        const Icon = playlist.icon;
        return (
          <div key={playlist.id} className="space-y-4">
            {/* Playlist Header */}
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl bg-gradient-to-br ${playlist.gradient}`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{playlist.title}</h2>
                <p className="text-foreground/60">{playlist.description}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">{playlist.badge}</Badge>
            </div>

            {/* Track List */}
            {playlist.isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-40" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {playlist.data?.map((track) => (
                  <Card key={track.id} className="group hover:shadow-xl transition-all">
                    <CardContent className="p-0">
                      {/* Album Cover */}
                      <div className="relative aspect-square">
                        <img
                          src={track.album.coverUrl || "/placeholder-album.png"}
                          alt={track.album.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                        {track.audio.url && (
                          <button
                            onClick={() => handlePlayPause(track.id, track.audio.url)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {currentTrackId === track.id && isPlaying ? (
                              <Pause className="w-12 h-12 text-white" />
                            ) : (
                              <Play className="w-12 h-12 text-white" />
                            )}
                          </button>
                        )}
                        
                        {/* Score Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-black/80 backdrop-blur">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                            {track.score}
                          </Badge>
                        </div>
                      </div>

                      {/* Track Info */}
                      <div className="p-4 space-y-2">
                        <Link href={`/album/${track.albumId}`}>
                          <h4 className="font-semibold truncate hover:text-primary transition-colors">
                            {track.title}
                          </h4>
                        </Link>
                        <p className="text-sm text-foreground/60 truncate">{track.album.title}</p>
                        <p className="text-xs text-foreground/60 truncate">by {track.creator.name}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
