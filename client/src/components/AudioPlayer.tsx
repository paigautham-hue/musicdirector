import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Download, Loader2, Music2, AlertCircle, RefreshCw,
  SkipForward, SkipBack, Volume2, VolumeX, Repeat, Repeat1
} from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AudioPlayerProps {
  trackId: number;
  trackTitle: string;
  trackIndex: number;
  audioUrl?: string;
  status?: "pending" | "queued" | "processing" | "completed" | "failed";
  progress?: number;
  statusMessage?: string;
  onRatingChange?: () => void;
  onRetry?: () => void;
}

type LoopMode = "none" | "one" | "all";

export function AudioPlayer({
  trackId,
  trackTitle,
  trackIndex,
  audioUrl,
  status = "pending",
  progress = 0,
  statusMessage,
  onRatingChange,
  onRetry
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Fetch user's rating and all ratings for this track
  const { data: userRating, refetch: refetchUserRating } = trpc.tracks.getRating.useQuery(
    { trackId },
    { enabled: status === "completed" }
  );
  
  const { data: allRatings } = trpc.tracks.getAllRatings.useQuery(
    { trackId },
    { enabled: status === "completed" }
  );
  
  const rateMutation = trpc.tracks.rate.useMutation({
    onSuccess: () => {
      toast.success("Rating saved!");
      refetchUserRating();
      if (onRatingChange) {
        onRatingChange();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save rating");
    }
  });
  
  const handleRate = (rating: number) => {
    rateMutation.mutate({ trackId, rating });
  };
  
  const averageRating = allRatings && allRatings.length > 0
    ? allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length
    : 0;
  
  const ratingCount = allRatings?.length || 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (loopMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl, loopMode]);

  // Update audio element properties when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
  }, [volume, isMuted, playbackSpeed]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => {
        console.error("Playback error:", err);
        toast.error("Failed to play audio");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `${trackTitle}.mp3`;
    a.click();
    toast.success("Download started!");
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    toast.success(`Playback speed: ${speed}x`);
  };

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ["none", "one", "all"];
    const currentIndex = modes.indexOf(loopMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setLoopMode(nextMode);
    
    const messages = {
      none: "Loop disabled",
      one: "Loop current track",
      all: "Loop all tracks"
    };
    toast.success(messages[nextMode]);
  };

  const getLoopIcon = () => {
    if (loopMode === "one") return <Repeat1 className="w-4 h-4" />;
    return <Repeat className="w-4 h-4" />;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * duration;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Pending</Badge>;
      case "queued":
        return <Badge variant="outline" className="gap-1 text-muted-foreground"><Music2 className="w-3 h-3" /> In Queue</Badge>;
      case "processing":
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Generating {progress}%</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-600">Ready</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" /> Failed</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Track Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
            {trackIndex}
          </div>

          {/* Track Info & Controls */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Track Title & Status */}
            <div>
              <h4 className="font-medium truncate">{trackTitle}</h4>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge()}
                {statusMessage && status === "processing" && (
                  <span className="text-xs text-muted-foreground truncate">{statusMessage}</span>
                )}
              </div>
            </div>

            {/* Rating Section */}
            {status === "completed" && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Your rating:</span>
                  <StarRating
                    rating={userRating?.rating || 0}
                    onRate={handleRate}
                    size="sm"
                  />
                </div>
                {ratingCount > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Average:</span>
                    <StarRating
                      rating={averageRating}
                      readonly
                      size="sm"
                      showCount
                      count={ratingCount}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Player Controls */}
            {status === "completed" && audioUrl ? (
              <div className="space-y-3">
                {/* Progress Bar */}
                <div 
                  className="w-full h-2 bg-muted rounded-full overflow-hidden cursor-pointer hover:h-3 transition-all"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  />
                </div>

                {/* Main Controls Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Time Display */}
                  <div className="text-xs text-muted-foreground min-w-[80px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={skipBackward}
                      className="w-8 h-8 p-0"
                      title="Skip back 15s"
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={togglePlay}
                      className="w-10 h-10 p-0"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={skipForward}
                      className="w-8 h-8 p-0"
                      title="Skip forward 15s"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Loop Control */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cycleLoopMode}
                    className={`w-8 h-8 p-0 ${loopMode !== "none" ? "text-primary" : ""}`}
                    title={`Loop: ${loopMode}`}
                  >
                    {getLoopIcon()}
                  </Button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="w-8 h-8 p-0"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </Button>
                    <div className="w-20 hidden sm:block">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        onValueChange={handleVolumeChange}
                        max={1}
                        step={0.01}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Speed Control */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-auto h-8 px-2 text-xs"
                      >
                        {playbackSpeed}x
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <DropdownMenuItem
                          key={speed}
                          onClick={() => handleSpeedChange(speed)}
                          className={playbackSpeed === speed ? "bg-accent" : ""}
                        >
                          {speed}x {speed === 1 && "(Normal)"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Download Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDownload}
                    className="w-8 h-8 p-0 ml-auto"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : status === "failed" ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="text-xs text-destructive font-medium">
                    Generation failed
                  </div>
                  {statusMessage && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {statusMessage}
                    </div>
                  )}
                </div>
                {onRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRetry}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Music2 className="w-5 h-5" />
                <span className="text-xs">Not generated</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar for Generation */}
        {status === "processing" && (
          <div className="mt-3">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <audio ref={audioRef} src={audioUrl} />
      </CardContent>
    </Card>
  );
}
