import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Play, Pause, SkipForward, SkipBack, Trash2, Eye, EyeOff, Share2, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function PlaylistDetail() {
  const [, params] = useRoute("/playlist/:id");
  const playlistId = params?.id ? parseInt(params.id) : null;
  const { user, isAuthenticated } = useAuth();

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const utils = trpc.useUtils();
  const { data: playlist, isLoading } = trpc.playlists.get.useQuery(
    { playlistId: playlistId! },
    { enabled: !!playlistId }
  );

  const removeTrackMutation = trpc.playlists.removeTrack.useMutation({
    onSuccess: () => {
      toast.success("Track removed from playlist");
      utils.playlists.get.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove track");
    },
  });

  const incrementPlayCountMutation = trpc.playlists.incrementPlayCount.useMutation();

  useEffect(() => {
    if (playlist && playlist.tracks.length > 0 && playlistId) {
      incrementPlayCountMutation.mutate({ playlistId });
    }
  }, [playlistId]);

  const currentTrack = playlist?.tracks[currentTrackIndex];

  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack?.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (!playlist?.tracks) return;
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(false);
  };

  const handlePrevious = () => {
    if (!playlist?.tracks) return;
    const prevIndex = currentTrackIndex === 0 ? playlist.tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(false);
  };

  const handleRemoveTrack = (playlistTrackId: number) => {
    if (confirm("Remove this track from the playlist?")) {
      removeTrackMutation.mutate({ playlistTrackId });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Playlist link copied to clipboard!");
  };

  const formatDuration = (seconds: number | null | undefined) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <Music className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Playlist Not Found</h3>
            <p className="text-muted-foreground mb-6">
              This playlist doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/my-playlists">
              <Button>Go to My Playlists</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwner = user?.id === playlist.userId;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/my-playlists">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                  {playlist.name}
                </h1>
                {playlist.visibility === "public" ? (
                  <Eye className="w-5 h-5 text-green-500" />
                ) : (
                  <EyeOff className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              {playlist.description && (
                <p className="text-muted-foreground mb-2">{playlist.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>By {playlist.userName || "Unknown"}</span>
                <span>•</span>
                <span>{playlist.tracks.length} tracks</span>
                <span>•</span>
                <span>{playlist.playCount} plays</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {playlist.tracks.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Music className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tracks Yet</h3>
              <p className="text-muted-foreground text-center">
                This playlist is empty. Add some tracks to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Track List */}
            <div className="lg:col-span-2 space-y-2">
              {playlist.tracks.map((track, index) => (
                <Card
                  key={track.playlistTrackId}
                  className={`cursor-pointer transition-all ${
                    index === currentTrackIndex
                      ? "border-primary shadow-lg"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => handleTrackSelect(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          {index === currentTrackIndex && isPlaying ? (
                            <Pause className="w-6 h-6 text-primary" />
                          ) : (
                            <Play className="w-6 h-6 text-primary" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{track.trackTitle}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {track.albumTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDuration(track.duration)}
                        </span>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrack(track.playlistTrackId);
                            }}
                            disabled={removeTrackMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Player */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                      <Music className="w-16 h-16 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg truncate">
                      {currentTrack?.trackTitle || "No track selected"}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {currentTrack?.albumTitle || ""}
                    </p>
                  </div>

                  {currentTrack?.audioUrl && (
                    <>
                      <audio
                        ref={audioRef}
                        src={currentTrack.audioUrl}
                        onEnded={handleNext}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handlePrevious}
                        >
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="w-14 h-14"
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleNext}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        Track {currentTrackIndex + 1} of {playlist.tracks.length}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
