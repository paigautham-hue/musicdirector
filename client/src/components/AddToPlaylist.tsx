import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListPlus, Plus, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface AddToPlaylistProps {
  trackId: number;
  trackTitle: string;
  trigger?: React.ReactNode;
}

export function AddToPlaylist({ trackId, trackTitle, trigger }: AddToPlaylistProps) {
  const { isAuthenticated } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistVisibility, setNewPlaylistVisibility] = useState<"private" | "public">("private");

  const utils = trpc.useUtils();
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery(undefined, {
    enabled: isAuthenticated && dialogOpen,
  });

  const addTrackMutation = trpc.playlists.addTrack.useMutation({
    onSuccess: () => {
      toast.success("Track added to playlist!");
      setDialogOpen(false);
      utils.playlists.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add track to playlist");
    },
  });

  const createPlaylistMutation = trpc.playlists.create.useMutation({
    onSuccess: (data) => {
      toast.success("Playlist created!");
      // Add track to the newly created playlist
      addTrackMutation.mutate({
        playlistId: data.playlistId,
        trackId,
      });
      setCreateMode(false);
      setNewPlaylistName("");
      utils.playlists.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create playlist");
    },
  });

  const handleAddToPlaylist = (playlistId: number) => {
    addTrackMutation.mutate({
      playlistId,
      trackId,
    });
  };

  const handleCreateAndAdd = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    createPlaylistMutation.mutate({
      name: newPlaylistName,
      visibility: newPlaylistVisibility,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <ListPlus className="w-4 h-4 mr-2" />
            Add to Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
          <DialogDescription>
            Add "{trackTitle}" to a playlist
          </DialogDescription>
        </DialogHeader>

        {createMode ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateAndAdd();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={newPlaylistVisibility} onValueChange={(v: "private" | "public") => setNewPlaylistVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Public
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateMode(false);
                  setNewPlaylistName("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAndAdd}
                disabled={createPlaylistMutation.isPending}
                className="flex-1"
              >
                {createPlaylistMutation.isPending ? "Creating..." : "Create & Add"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : !playlists || playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don't have any playlists yet
                </p>
                <Button onClick={() => setCreateMode(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Playlist
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {playlists.map((playlist) => (
                    <button
                      key={playlist.id}
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={addTrackMutation.isPending}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{playlist.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
                        </p>
                      </div>
                      {addTrackMutation.isPending && (
                        <Check className="w-4 h-4 text-green-500 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCreateMode(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Playlist
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
