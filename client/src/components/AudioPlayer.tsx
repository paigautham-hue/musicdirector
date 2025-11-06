import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, Loader2, Music2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AudioPlayerProps {
  trackId: number;
  trackTitle: string;
  trackIndex: number;
  audioUrl?: string;
  status?: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  statusMessage?: string;
}

export function AudioPlayer({
  trackId,
  trackTitle,
  trackIndex,
  audioUrl,
  status = "pending",
  progress = 0,
  statusMessage
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

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

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Pending</Badge>;
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
        <div className="flex items-center gap-4">
          {/* Track Number */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
            {trackIndex}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{trackTitle}</h4>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              {statusMessage && status === "processing" && (
                <span className="text-xs text-muted-foreground truncate">{statusMessage}</span>
              )}
            </div>
          </div>

          {/* Player Controls */}
          {status === "completed" && audioUrl ? (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground min-w-[80px] text-right">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={togglePlay}
                className="w-10 h-10 p-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="w-10 h-10 p-0"
              >
                <Download className="w-4 h-4" />
              </Button>
              <audio ref={audioRef} src={audioUrl} />
            </div>
          ) : status === "failed" ? (
            <div className="text-xs text-destructive">
              {statusMessage || "Generation failed"}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Music2 className="w-5 h-5" />
              <span className="text-xs">Not generated</span>
            </div>
          )}
        </div>

        {/* Progress Bar for Audio Playback */}
        {status === "completed" && audioUrl && duration > 0 && (
          <div className="mt-3">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        )}

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
      </CardContent>
    </Card>
  );
}
