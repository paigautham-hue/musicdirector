import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Play, Pause, Star, TrendingUp, Gem, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function Discovery() {
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef] = useState<HTMLAudioElement | null>(null);

  const limit = 20; // Show more tracks on discovery page

  const { data: staffPicks, isLoading: loadingStaff } = trpc.recommendations.getStaffPicks.useQuery({ limit });
  const { data: trending, isLoading: loadingTrending } = trpc.recommendations.getTrendingPotential.useQuery({ limit });
  const { data: hiddenGems, isLoading: loadingGems } = trpc.recommendations.getHiddenGems.useQuery({ limit });

  // Get featured track (highest scored track from staff picks)
  const featuredTrack = staffPicks?.[0];

  const handlePlayTrack = (trackId: number, audioUrl: string | null) => {
    if (!audioUrl) return;

    if (currentTrackId === trackId && isPlaying) {
      audioRef?.pause();
      setIsPlaying(false);
    } else {
      if (audioRef) {
        audioRef.src = audioUrl;
        audioRef.play();
      }
      setCurrentTrackId(trackId);
      setIsPlaying(true);
    }
  };

  const PlaylistSection = ({
    title,
    description,
    icon: Icon,
    gradient,
    badge,
    tracks,
    isLoading,
  }: {
    title: string;
    description: string;
    icon: any;
    gradient: string;
    badge: string;
    tracks: any[] | undefined;
    isLoading: boolean;
  }) => (
    <div className="space-y-6">
      {/* Section Header */}
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

      {/* Horizontal Scrollable Track Row */}
      <div className="relative">
        <div className="overflow-x-auto pb-4 scrollbar-hide">
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
    <div className="min-h-screen bg-background">
      <AppNav />
      
      <div className="container py-8 space-y-12">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Discovery", href: "/discovery" }
          ]}
        />

        {/* Hero Section - Featured Track of the Week */}
        {loadingStaff ? (
          <div className="relative h-96 rounded-3xl overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ) : featuredTrack ? (
          <div className="relative h-96 rounded-3xl overflow-hidden bg-gradient-to-br from-yellow-500/10 via-pink-500/10 to-purple-500/10 border border-border/50">
            <div className="absolute inset-0 flex items-center">
              <div className="container flex items-center gap-12">
                {/* Album Artwork */}
                <div className="relative w-80 h-80 flex-shrink-0 rounded-2xl overflow-hidden shadow-2xl group">
                  <img
                    src={featuredTrack.album.coverUrl || "/placeholder-album.png"}
                    alt={featuredTrack.album.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="icon"
                      className="w-20 h-20 rounded-full bg-white hover:bg-white/90 text-black"
                      onClick={() => handlePlayTrack(featuredTrack.id, featuredTrack.audio?.url || null)}
                      disabled={!featuredTrack.audio?.url}
                    >
                      {currentTrackId === featuredTrack.id && isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Track Details */}
                <div className="flex-1 space-y-6">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                    Featured Track of the Week
                  </Badge>
                  
                  <div className="space-y-3">
                    <h1 className="text-5xl font-bold">{featuredTrack.title}</h1>
                    <p className="text-2xl text-foreground/60">{featuredTrack.album?.title}</p>
                    <p className="text-lg text-foreground/50">by {featuredTrack.creator?.name}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className="bg-black/70 backdrop-blur text-white border-0 gap-2 px-4 py-2 text-lg">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      {featuredTrack.score}/100 AI Score
                    </Badge>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white gap-2"
                      onClick={() => handlePlayTrack(featuredTrack.id, featuredTrack.audio?.url || null)}
                      disabled={!featuredTrack.audio?.url}
                    >
                      {currentTrackId === featuredTrack.id && isPlaying ? (
                        <>
                          <Pause className="w-5 h-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 ml-1" />
                          Play Now
                        </>
                      )}
                    </Button>
                    <Link href={`/library/${featuredTrack.albumId}`}>
                      <Button size="lg" variant="outline" className="gap-2">
                        View Album
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Page Header */}
        <div className="text-center space-y-4 py-8">
          <h2 className="text-4xl font-bold">Explore AI-Curated Playlists</h2>
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Each track is analyzed for lyrical quality, emotional depth, universal appeal, and memorability.
          </p>
        </div>

        {/* Staff Picks Section */}
        <PlaylistSection
          title="Staff Picks"
          description="Exceptional tracks chosen by our AI curator"
          icon={Star}
          gradient="from-yellow-500 to-orange-500"
          badge="85+ Score"
          tracks={staffPicks}
          isLoading={loadingStaff}
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
        />
      </div>

      {/* Hidden Audio Element */}
      <audio className="hidden" />
    </div>
  );
}
