import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Star, TrendingUp, Gem, ChevronRight, Save, PlayCircle, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

interface DiscoveryPlaylistsProps {
  variant?: "home" | "full";
}

export function DiscoveryPlaylists({ variant = "home" }: DiscoveryPlaylistsProps) {
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scroll = (playlistId: string, direction: 'left' | 'right') => {
    const container = scrollContainerRefs.current[playlistId];
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const saveCollectionMutation = trpc.playlists.saveCollection.useMutation({
    onSuccess: (data) => {
      alert(`Saved ${data.trackCount} tracks to your library!`);
    },
    onError: (error) => {
      alert(`Failed to save: ${error.message}`);
    },
  });

  const handlePlayAll = (tracks: any[]) => {
    if (!tracks || tracks.length === 0) return;
    const firstTrack = tracks[0];
    if (firstTrack.audioUrl) {
      handlePlayTrack(firstTrack.id, firstTrack.audioUrl);
      // TODO: Implement queue system to auto-play next tracks
    }
  };

  const limit = variant === "home" ? 6 : 20;

  const { data: staffPicks, isLoading: loadingStaff } = trpc.recommendations.getStaffPicks.useQuery({ limit });
  const { data: trending, isLoading: loadingTrending } = trpc.recommendations.getTrendingPotential.useQuery({ limit });
  const { data: hiddenGems, isLoading: loadingGems } = trpc.recommendations.getHiddenGems.useQuery({ limit });

  const handlePlayTrack = (trackId: number, audioUrl: string | null) => {
    if (!audioUrl) return;

    if (currentTrackId === trackId && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
      }
      setCurrentTrackId(trackId);
      setIsPlaying(true);
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

  const PlaylistSection = ({
    title,
    description,
    icon: Icon,
    gradient,
    badge,
    tracks,
    isLoading,
    playlistId
  }: {
    title: string;
    description: string;
    icon: any;
    gradient: string;
    badge: string;
    tracks: any[] | undefined;
    isLoading: boolean;
    playlistId: string;
  }) => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-foreground/60 text-sm">{description}</p>
          </div>
          <Badge variant="secondary" className="ml-2">{badge}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-accent"
            onClick={() => handlePlayAll(tracks || [])}
            disabled={!tracks || tracks.length === 0}
          >
            <PlayCircle className="w-4 h-4" />
            Play All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => saveCollectionMutation.mutate({ collectionType: playlistId as any })}
            disabled={saveCollectionMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {saveCollectionMutation.isPending ? "Saving..." : "Save as Playlist"}
          </Button>
          {variant === "home" && (
            <Link href="/discovery">
              <Button variant="ghost" size="sm" className="gap-2">
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Scrollable Track Row */}
      <div className="relative group">
        {/* Left Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll(playlistId, 'left')}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        {/* Right Arrow */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          onClick={() => scroll(playlistId, 'right')}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
        
        <div 
          ref={(el) => { scrollContainerRefs.current[playlistId] = el; }}
          className="overflow-x-auto pb-4 scrollbar-visible"
        >
          <div className="flex gap-4" style={{ width: "max-content" }}>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-64 flex-shrink-0">
                  <Skeleton className="w-full h-64 rounded-lg" />
                </div>
              ))
            ) : tracks && tracks.length > 0 ? (
              tracks.map((track) => (
                <Card
                  key={track.id}
                  className="w-64 flex-shrink-0 bg-card/50 backdrop-blur border-border/50 hover:bg-card/80 transition-all duration-300 overflow-hidden group"
                >
                  <div className="relative aspect-square">
                    <img
                      src={track.album.coverUrl || "/placeholder-album.png"}
                      alt={track.album.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="icon"
                        className="w-14 h-14 rounded-full bg-white hover:bg-white/90 text-black"
                        onClick={() => handlePlayTrack(track.id, track.audioUrl)}
                        disabled={!track.audioUrl}
                      >
                        {currentTrackId === track.id && isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </Button>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black/70 backdrop-blur text-white border-0 gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {track.score}/100
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <Link href={`/library/${track.albumId}`}>
                      <h4 className="font-semibold text-sm line-clamp-1 hover:text-primary transition-colors">
                        {track.title}
                      </h4>
                    </Link>
                    <p className="text-xs text-foreground/60 line-clamp-1">{track.album?.title || 'Unknown Album'}</p>
                    <p className="text-xs text-foreground/50">by {track.album?.user?.name || 'Unknown Artist'}</p>
                  </div>
                </Card>
              ))
            ) : (
              <div className="w-full py-12 text-center text-foreground/60">
                No tracks available yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-16">
      {/* Staff Picks Section */}
      <PlaylistSection
        title="Staff Picks"
        description="Exceptional tracks chosen by our AI curator"
        icon={Star}
        gradient="from-yellow-500 to-orange-500"
        badge="85+ Score"
        tracks={staffPicks}
        isLoading={loadingStaff}
        playlistId="staff_picks"
      />

      {/* Trending Potential Section */}
      <PlaylistSection
        title="Trending Potential"
        description="Songs likely to go viral"
        icon={TrendingUp}
        gradient="from-pink-500 to-purple-500"
        badge="75-84 Score"
        tracks={trending}
        isLoading={loadingTrending}
        playlistId="trending"
      />

      {/* Hidden Gems Section */}
      <PlaylistSection
        title="Hidden Gems"
        description="High quality tracks waiting to be discovered"
        icon={Gem}
        gradient="from-cyan-500 to-blue-500"
        badge="70-84 Score"
        tracks={hiddenGems}
        isLoading={loadingGems}
        playlistId="hidden_gems"
      />

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
