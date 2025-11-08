import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Loader2, CheckCircle, Music, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminAudioHealth() {
  const [regeneratingTracks, setRegeneratingTracks] = useState<Set<number>>(new Set());
  const [regeneratingAlbums, setRegeneratingAlbums] = useState<Set<number>>(new Set());
  const [regeneratingAll, setRegeneratingAll] = useState(false);

  const { data: brokenTracks, isLoading: loadingTracks, refetch: refetchTracks } = trpc.admin.getBrokenAudioTracks.useQuery();
  const { data: brokenAlbums, isLoading: loadingAlbums, refetch: refetchAlbums } = trpc.admin.getAlbumsWithBrokenAudio.useQuery();

  const regenerateTrackMutation = trpc.admin.regenerateTrackAudio.useMutation({
    onSuccess: (data, variables) => {
      toast.success(data.message);
      setRegeneratingTracks(prev => {
        const next = new Set(prev);
        next.delete(variables.trackId);
        return next;
      });
      refetchTracks();
      refetchAlbums();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate track");
    }
  });

  const regenerateAlbumMutation = trpc.admin.regenerateAlbumAudio.useMutation({
    onSuccess: (data, variables) => {
      toast.success(data.message);
      setRegeneratingAlbums(prev => {
        const next = new Set(prev);
        next.delete(variables.albumId);
        return next;
      });
      refetchTracks();
      refetchAlbums();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate album");
    }
  });

  const regenerateAllMutation = trpc.admin.regenerateAllBrokenAudio.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setRegeneratingAll(false);
      refetchTracks();
      refetchAlbums();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate audio");
      setRegeneratingAll(false);
    }
  });

  const handleRegenerateTrack = (trackId: number) => {
    setRegeneratingTracks(prev => new Set(prev).add(trackId));
    regenerateTrackMutation.mutate({ trackId });
  };

  const handleRegenerateAlbum = (albumId: number) => {
    setRegeneratingAlbums(prev => new Set(prev).add(albumId));
    regenerateAlbumMutation.mutate({ albumId });
  };

  const handleRegenerateAll = () => {
    setRegeneratingAll(true);
    regenerateAllMutation.mutate();
  };

  const isLoading = loadingTracks || loadingAlbums;
  const totalBrokenTracks = brokenTracks?.length || 0;
  const totalBrokenAlbums = brokenAlbums?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Audio Health Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage and regenerate audio files with broken or expired URLs
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Broken Tracks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalBrokenTracks}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Tracks with missing or expired audio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5 text-amber-500" />
                Affected Albums
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{totalBrokenAlbums}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Albums with broken audio tracks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                Bulk Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    className="w-full"
                    disabled={totalBrokenTracks === 0 || regeneratingAll}
                  >
                    {regeneratingAll ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate All
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate All Broken Audio?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will start regeneration jobs for all {totalBrokenTracks} tracks with broken audio.
                      This process may take several minutes to complete.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerateAll}>
                      Confirm Regeneration
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : totalBrokenAlbums === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-bold mb-2">All Audio Files Healthy</h3>
              <p className="text-muted-foreground">
                No broken or expired audio URLs detected
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {brokenAlbums?.map((album) => (
              <Card key={album.albumId}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {album.albumTitle}
                        <Badge variant="destructive">{album.brokenTrackCount} broken</Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Created by {album.userName} • Album ID: {album.albumId}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => handleRegenerateAlbum(album.albumId)}
                      disabled={regeneratingAlbums.has(album.albumId)}
                      size="sm"
                    >
                      {regeneratingAlbums.has(album.albumId) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate Album
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {album.brokenTracks.map((track: any) => (
                      <div
                        key={track.trackId}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {track.trackIndex}
                          </div>
                          <div>
                            <div className="font-medium">{track.trackTitle}</div>
                            <div className="text-xs text-muted-foreground">Track ID: {track.trackId}</div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRegenerateTrack(track.trackId)}
                          disabled={regeneratingTracks.has(track.trackId)}
                          size="sm"
                          variant="outline"
                        >
                          {regeneratingTracks.has(track.trackId) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Regenerating
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Regenerate
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
