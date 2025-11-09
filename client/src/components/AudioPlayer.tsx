import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, Download, Loader2, Music2, AlertCircle, RefreshCw,
  SkipForward, SkipBack, Volume2, VolumeX, Repeat, Repeat1, ListPlus
} from "lucide-react";
import { toast } from "sonner";
import { StarRating } from "@/components/StarRating";
import { trpc } from "@/lib/trpc";
import { AddToPlaylist } from "@/components/AddToPlaylist";
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
  onTrackEnd?: () => void;
  totalTracks?: number;
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
  onRetry,
  onTrackEnd,
  totalTracks
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Rating feature temporarily disabled - focus on playback first

  // Set up audio element and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    // Reset state when audio URL changes
    setIsPlaying(false);
    setCurrentTime(0);
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (loopMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else if (loopMode === "all" && onTrackEnd) {
        setIsPlaying(false);
        onTrackEnd();
      } else {
        setIsPlaying(false);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error("Audio error:", e);
      setIsPlaying(false);
      toast.error("Failed to load audio");
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("error", handleError);
    };
  }, [audioUrl, loopMode, onTrackEnd]);

  // Update audio properties
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
  }, [volume, isMuted, playbackSpeed]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      toast.error("No audio available");
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        await audio.play();
      }
    } catch (error) {
      console.error("Playback error:", error);
      toast.error("Failed to play audio");
      setIsPlaying(false);
    }
  };

  const handleDownload = () => {
    if (!trackId) return;
    
    const downloadUrl = `/api/download/track/${trackId}`;
    const a = document.createElement("a");
    a.href = downloadUrl;
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
    if (value[0] > 0) setIsMuted(false);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const cycleLoopMode = () => {
    const modes: LoopMode[] = ["none", "one", "all"];
    const currentIndex = modes.indexOf(loopMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setLoopMode(nextMode);
    toast.success(`Loop: ${nextMode === "none" ? "Off" : nextMode === "one" ? "One" : "All"}`);
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
      toast.success("Retry started");
    } catch (error) {
      toast.error("Failed to retry");
    } finally {
      setIsRetrying(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Render different states
  if (status === "pending" || status === "queued") {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{trackIndex}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{trackTitle}</h3>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {status === "queued" ? "Queued for generation..." : "Waiting to start..."}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "processing") {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{trackIndex}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{trackTitle}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {statusMessage || "Generating music..."}
                  </span>
                </div>
                {progress > 0 && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "failed") {
    return (
      <Card className="bg-destructive/10 border-destructive/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{trackTitle}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {statusMessage || "Generation failed"}
              </p>
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="border-destructive/50 hover:bg-destructive/10"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Generation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Completed status - show full player
  return (
    <Card className="bg-gradient-to-br from-card/80 to-card/40 border-primary/20">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">{trackIndex}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{trackTitle}</h3>
                <Badge variant="secondary" className="mt-1">
                  <Music2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              </div>
            </div>
          </div>

          {/* Rating feature temporarily removed - focus on playback */}

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Skip Back */}
              <Button
                size="sm"
                variant="ghost"
                onClick={skipBackward}
                className="w-8 h-8 p-0"
                title="Skip back 15s"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              {/* Play/Pause */}
              <Button
                size="sm"
                variant="default"
                onClick={togglePlay}
                className="w-10 h-10 p-0"
                disabled={!audioUrl}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              {/* Skip Forward */}
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
              className="w-8 h-8 p-0"
              title={`Loop: ${loopMode}`}
            >
              {loopMode === "one" ? (
                <Repeat1 className="w-4 h-4 text-primary" />
              ) : (
                <Repeat className={`w-4 h-4 ${loopMode === "all" ? "text-primary" : ""}`} />
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleMute}
                className="w-8 h-8 p-0"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Speed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="text-xs">
                  {playbackSpeed}x
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => setPlaybackSpeed(speed)}
                  >
                    {speed}x
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Add to Playlist */}
            <AddToPlaylist trackId={trackId} trackTitle={trackTitle} />

            {/* Download */}
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="w-8 h-8 p-0"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* Hidden audio element */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              preload="metadata"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
