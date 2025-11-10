import { useState, useRef, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Play, Pause, SkipForward, SkipBack, Trash2, Eye, EyeOff, Share2, Clock, ArrowLeft, Star, Shuffle, Repeat, Repeat1, List } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { PlaylistAISuggestions } from "@/components/PlaylistAISuggestions";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function PlaylistDetail() {
  const [, params] = useRoute("/playlists/:id");
  const playlistId = params?.id ? parseInt(params.id) : null;
  const { user, isAuthenticated } = useAuth();

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [showQueue, setShowQueue] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
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

  const { data: ratingStats } = trpc.playlists.getRatingStats.useQuery(
    { playlistId: playlistId! },
    { enabled: !!playlistId }
  );

  const { data: userRating } = trpc.playlists.getUserRating.useQuery(
    { playlistId: playlistId! },
    { enabled: !!playlistId && isAuthenticated }
  );

  const rateMutation = trpc.playlists.rate.useMutation({
    onSuccess: () => {
      toast.success("Rating submitted!");
      utils.playlists.getRatingStats.invalidate();
      utils.playlists.getUserRating.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to rate playlist");
    },
  });

  const handleRate = (rating: number) => {
    if (!playlistId) return;
    rateMutation.mutate({ playlistId, rating });
  };

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
    
    if (repeatMode === 'one') {
      // Replay current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      return;
    }
    
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    
    // If we're at the end and repeat is off, stop playing
    if (repeatMode === 'off' && nextIndex === 0) {
      setIsPlaying(false);
      return;
    }
    
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
      }
    }, 100);
  };

  const handlePrevious = () => {
    if (!playlist?.tracks) return;
    const prevIndex = currentTrackIndex === 0 ? playlist.tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(false);
  };

  const handleTrackSelect = (index: number) => {
    // If clicking the currently playing track, toggle play/pause
    if (index === currentTrackIndex) {
      handlePlayPause();
      return;
    }
    
    // Otherwise, switch to the new track and start playing
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
        });
      }
    }, 100);
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

  const handleShuffle = () => {
    if (!playlist?.tracks) return;
    
    if (!isShuffled) {
      // Create shuffled queue
      const indices = playlist.tracks.map((_, i) => i).filter(i => i !== currentTrackIndex);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setQueue([currentTrackIndex, ...indices]);
      setIsShuffled(true);
      toast.success("Shuffle enabled");
    } else {
      setQueue([]);
      setIsShuffled(false);
      toast.success("Shuffle disabled");
    }
  };

  const handleRepeat = () => {
    const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    
    const messages = {
      off: "Repeat off",
      all: "Repeat all",
      one: "Repeat one"
    };
    toast.success(messages[nextMode]);
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
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span>By {playlist.userName || "Unknown"}</span>
                <span>•</span>
                <span>{playlist.tracks.length} tracks</span>
                <span>•</span>
                <span>{playlist.playCount} plays</span>
              </div>
              {ratingStats && ratingStats.ratingCount > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <StarRating
                    rating={ratingStats.averageRating}
                    readonly
                    size="md"
                  />
                  <span className="text-sm text-muted-foreground">
                    {ratingStats.averageRating.toFixed(1)} ({ratingStats.ratingCount} {ratingStats.ratingCount === 1 ? "rating" : "ratings"})
                  </span>
                </div>
              )}
              {isAuthenticated && !isOwner && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Rate this playlist:</span>
                  <StarRating
                    rating={userRating?.rating || 0}
                    onRate={handleRate}
                    size="md"
                  />
                </div>
              )}
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
                      
                      {/* Playback Controls */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Button
                          variant={isShuffled ? "default" : "ghost"}
                          size="sm"
                          onClick={handleShuffle}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={repeatMode !== 'off' ? "default" : "ghost"}
                          size="sm"
                          onClick={handleRepeat}
                        >
                          {repeatMode === 'one' ? (
                            <Repeat1 className="w-4 h-4" />
                          ) : (
                            <Repeat className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant={showQueue ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setShowQueue(!showQueue)}
                        >
                          <List className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="text-center text-sm text-muted-foreground mb-4">
                        Track {currentTrackIndex + 1} of {playlist.tracks.length}
                      </div>
                      
                      {/* Queue Panel */}
                      {showQueue && (
                        <div className="border-t border-border pt-4 mt-4">
                          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <List className="w-4 h-4" />
                            Up Next
                          </h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {(isShuffled ? queue : playlist.tracks.map((_, i) => i))
                              .slice(currentTrackIndex + 1, currentTrackIndex + 6)
                              .map((trackIndex) => {
                                const track = playlist.tracks[trackIndex];
                                if (!track) return null;
                                return (
                                  <div
                                    key={trackIndex}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                                    onClick={() => handleTrackSelect(trackIndex)}
                                  >
                                    <Play className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{track.trackTitle}</p>
                                      <p className="text-xs text-muted-foreground truncate">{track.albumTitle}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDuration(track.duration)}
                                    </span>
                                  </div>
                                );
                              })}
                            {(isShuffled ? queue : playlist.tracks).length - currentTrackIndex <= 1 && (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                End of playlist
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* AI Suggestions */}
              {isOwner && playlistId && (
                <Card className="mt-4">
                  <CardContent className="p-6">
                    <PlaylistAISuggestions
                      playlistId={playlistId}
                      onAddTrack={() => utils.playlists.get.invalidate()}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
