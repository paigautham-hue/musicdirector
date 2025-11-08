import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Play, Shuffle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Track {
  id: number;
  title: string;
  index: number;
}

interface AlbumQueueProps {
  tracks: Track[];
  queueOrder: number[]; // Array of track IDs in queue order
  currentTrackId: number | null;
  isShuffleEnabled: boolean;
  onToggleShuffle: () => void;
  onTrackClick: (trackId: number) => void;
  audioFiles: any[]; // Audio files with trackId and fileUrl
}

export function AlbumQueue({
  tracks,
  queueOrder,
  currentTrackId,
  isShuffleEnabled,
  onToggleShuffle,
  onTrackClick,
  audioFiles
}: AlbumQueueProps) {
  // Get ordered tracks based on queue
  const orderedTracks = queueOrder
    .map(trackId => tracks.find(t => t.id === trackId))
    .filter(Boolean) as Track[];

  const currentQueueIndex = queueOrder.indexOf(currentTrackId || -1);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Music2 className="w-5 h-5 text-primary" />
            Queue
          </CardTitle>
          <Button
            size="sm"
            variant={isShuffleEnabled ? "default" : "outline"}
            onClick={onToggleShuffle}
            className="gap-1"
          >
            {isShuffleEnabled ? (
              <>
                <Shuffle className="w-4 h-4" />
                <span className="hidden sm:inline">On</span>
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4 opacity-50" />
                <span className="hidden sm:inline">Off</span>
              </>
            )}
          </Button>
        </div>
        {currentTrackId && (
          <p className="text-xs text-muted-foreground mt-1">
            Track {currentQueueIndex + 1} of {orderedTracks.length}
          </p>
        )}
      </CardHeader>
      <CardContent className="pb-4">
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {orderedTracks.map((track, queueIndex) => {
              const isCurrent = track.id === currentTrackId;
              const isPast = currentTrackId && queueIndex < currentQueueIndex;
              const audioFile = audioFiles.find(
                (a: any) => a.trackId === track.id && a.isActive
              );
              const hasAudio = !!audioFile?.fileUrl;

              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                    isCurrent
                      ? "border-primary bg-primary/10"
                      : isPast
                      ? "border-border/50 bg-muted/30 opacity-60"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  } ${!hasAudio ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => hasAudio && onTrackClick(track.id)}
                >
                  {/* Queue Position */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border flex items-center justify-center text-xs font-semibold">
                    {queueIndex + 1}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCurrent ? "text-primary" : ""}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Original: Track {track.index}
                    </p>
                  </div>

                  {/* Status Indicators */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isCurrent && (
                      <Badge variant="default" className="text-xs gap-1">
                        <Play className="w-3 h-3" />
                        Now
                      </Badge>
                    )}
                    {!hasAudio && (
                      <Badge variant="secondary" className="text-xs">
                        No Audio
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
