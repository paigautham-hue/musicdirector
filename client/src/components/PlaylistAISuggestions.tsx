import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PlaylistAISuggestionsProps {
  playlistId: number;
  onAddTrack?: (trackId: number) => void;
}

export function PlaylistAISuggestions({
  playlistId,
  onAddTrack,
}: PlaylistAISuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestions, isLoading, refetch } = trpc.playlists.getSuggestions.useQuery(
    { playlistId, limit: 5 },
    { enabled: showSuggestions }
  );

  const addTrackMutation = trpc.playlists.addTrack.useMutation({
    onSuccess: () => {
      toast.success("Track added to playlist!");
      if (onAddTrack) {
        refetch();
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add track");
    },
  });

  const handleGetSuggestions = () => {
    setShowSuggestions(true);
  };

  const handleAddTrack = (trackId: number) => {
    if (onAddTrack) {
      onAddTrack(trackId);
    } else {
      addTrackMutation.mutate({ playlistId, trackId });
    }
  };

  return (
    <div className="space-y-4">
      {!showSuggestions ? (
        <Button
          onClick={handleGetSuggestions}
          variant="outline"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Get AI Suggestions
        </Button>
      ) : (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Analyzing playlist...
                </span>
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.trackId}
                    className="flex items-start justify-between p-3 rounded-lg bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-sm truncate">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {suggestion.albumTitle}
                      </p>
                      <p className="text-xs text-primary/80 mt-1">
                        {suggestion.reason}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Match:
                        </span>
                        <div className="flex gap-0.5">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < suggestion.matchScore
                                  ? "bg-primary"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAddTrack(suggestion.trackId)}
                      disabled={addTrackMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No suggestions available. Try adding more tracks to your playlist first.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
