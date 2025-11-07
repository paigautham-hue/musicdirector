import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Music, Plus, Trash2, Edit, Eye, EyeOff, Play, ListMusic } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { APP_TITLE, getLoginUrl } from "@/const";

export default function MyPlaylists() {
  const { user, isAuthenticated, loading } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [playlistVisibility, setPlaylistVisibility] = useState<"private" | "public">("private");

  const utils = trpc.useUtils();
  const { data: playlists, isLoading } = trpc.playlists.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.playlists.create.useMutation({
    onSuccess: () => {
      toast.success("Playlist created successfully!");
      utils.playlists.list.invalidate();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create playlist");
    },
  });

  const updateMutation = trpc.playlists.update.useMutation({
    onSuccess: () => {
      toast.success("Playlist updated successfully!");
      utils.playlists.list.invalidate();
      setEditingPlaylist(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update playlist");
    },
  });

  const deleteMutation = trpc.playlists.delete.useMutation({
    onSuccess: () => {
      toast.success("Playlist deleted successfully!");
      utils.playlists.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete playlist");
    },
  });

  const resetForm = () => {
    setPlaylistName("");
    setPlaylistDescription("");
    setPlaylistVisibility("private");
  };

  const handleCreate = () => {
    if (!playlistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    createMutation.mutate({
      name: playlistName,
      description: playlistDescription || undefined,
      visibility: playlistVisibility,
    });
  };

  const handleUpdate = () => {
    if (!editingPlaylist || !playlistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    updateMutation.mutate({
      playlistId: editingPlaylist.id,
      name: playlistName,
      description: playlistDescription || undefined,
      visibility: playlistVisibility,
    });
  };

  const handleEdit = (playlist: any) => {
    setEditingPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description || "");
    setPlaylistVisibility(playlist.visibility);
  };

  const handleDelete = (playlistId: number, playlistName: string) => {
    if (confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ playlistId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <div className="text-center">
          <Music className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/80">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to sign in to view and create playlists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                My Playlists
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your music collections
              </p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-accent">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Playlist</DialogTitle>
                  <DialogDescription>
                    Give your playlist a name and description
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="My Awesome Playlist"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="A collection of my favorite tracks..."
                      value={playlistDescription}
                      onChange={(e) => setPlaylistDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={playlistVisibility} onValueChange={(v: "private" | "public") => setPlaylistVisibility(v)}>
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
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !playlists || playlists.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListMusic className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Playlists Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first playlist to start organizing your favorite tracks
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{playlist.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {playlist.visibility === "public" ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Link href={`/playlist/${playlist.id}`}>
                      <Button variant="default" size="sm" className="flex-1">
                        <Play className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(playlist)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(playlist.id, playlist.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span>{playlist.playCount} plays</span>
                    <span>{playlist.likeCount} likes</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPlaylist} onOpenChange={(open) => !open && setEditingPlaylist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="My Awesome Playlist"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="A collection of my favorite tracks..."
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select value={playlistVisibility} onValueChange={(v: "private" | "public") => setPlaylistVisibility(v)}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlaylist(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
