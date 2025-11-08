import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Download, Share2, Sparkles, Music2, RefreshCw, Copy, Check, Volume2, Eye, EyeOff, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AddToPlaylist } from "@/components/AddToPlaylist";
import { AlbumQueue } from "@/components/AlbumQueue";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function AlbumWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTrackId, setActiveTrackId] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [showAddTracksDialog, setShowAddTracksDialog] = useState(false);
  const [additionalTrackCount, setAdditionalTrackCount] = useState(5);
  const [addTracksJobId, setAddTracksJobId] = useState<string | null>(null);
  const [currentPlayingTrackId, setCurrentPlayingTrackId] = useState<number | null>(null);
  const audioRefs = useRef<Map<number, HTMLAudioElement>>(new Map());
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [shuffledTrackIds, setShuffledTrackIds] = useState<number[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);

  const copyToClipboard = async (text: string, type: 'prompt' | 'lyrics') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'prompt') {
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2000);
      } else {
        setCopiedLyrics(true);
        setTimeout(() => setCopiedLyrics(false), 2000);
      }
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };
  
  const { data: album, isLoading, error, refetch } = trpc.albums.get.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );
  
  // Initialize track queue when album loads
  useEffect(() => {
    if (album?.tracks) {
      const trackIds = album.tracks.map((t: any) => t.id);
      if (isShuffleEnabled) {
        // Shuffle the track IDs
        const shuffled = [...trackIds].sort(() => Math.random() - 0.5);
        setShuffledTrackIds(shuffled);
      } else {
        setShuffledTrackIds(trackIds);
      }
      setCurrentQueueIndex(0);
    }
  }, [album, isShuffleEnabled]);
  
  const { data: musicStatus, refetch: refetchMusicStatus } = trpc.albums.getMusicStatus.useQuery(
    { albumId: parseInt(id!) },
    { 
      enabled: !!id,
      refetchInterval: (query) => {
        // Auto-refresh every 5 seconds if there are active jobs
        return query.state.data?.hasActiveJobs ? 5000 : false;
      }
    }
  );

  const optimizeMutation = trpc.albums.optimizeForPlatform.useMutation({
    onSuccess: () => {
      toast.success("Album optimized for new platform!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to optimize");
    }
  });

  const improveMutation = trpc.tracks.improve.useMutation({
    onSuccess: () => {
      toast.success("Track improved!");
      refetch();
      setImprovements([]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to improve track");
    }
  });

  const exportQuery = trpc.albums.export.useQuery(
    { id: parseInt(id!) },
    { enabled: false }
  );

  const shareMutation = trpc.albums.createShareLink.useMutation({
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.shareUrl}`;
      navigator.clipboard.writeText(fullUrl);
      toast.success("Share link copied to clipboard!");
    }
  });

  const generateMusicMutation = trpc.albums.generateMusic.useMutation({
    onSuccess: () => {
      toast.success("Music generation started! This will take a few minutes.");
      refetch();
      refetchMusicStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to start music generation");
    }
  });

  const updateVisibility = trpc.social.updateAlbumVisibility.useMutation({
    onSuccess: () => {
      toast.success("Album visibility updated!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update visibility");
    }
  });
  
  const retryGenerationMutation = trpc.tracks.retryGeneration.useMutation({
    onSuccess: () => {
      toast.success("Retrying music generation...");
      refetchMusicStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry generation");
    }
  });
  
  const retryAllFailedMutation = trpc.tracks.retryAllFailed.useMutation({
    onSuccess: (data) => {
      if (data.retriedCount > 0) {
        toast.success(`Retrying ${data.retriedCount} failed track${data.retriedCount > 1 ? 's' : ''}...`);
      } else {
        toast.info("No failed tracks to retry");
      }
      refetchMusicStatus();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to retry tracks");
    }
  });

  const bookletMutation = trpc.downloads.albumBooklet.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success("Album booklet downloaded!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate booklet");
    }
  });

  const addTracksMutation = trpc.albums.addTracks.useMutation({
    onSuccess: (data) => {
      toast.success("Generating additional tracks! This will take a few minutes.");
      setShowAddTracksDialog(false);
      setAddTracksJobId(data.jobId);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add tracks");
    }
  });

  // Poll for add tracks progress
  const { data: addTracksProgress } = trpc.albums.getProgress.useQuery(
    { jobId: addTracksJobId! },
    {
      enabled: !!addTracksJobId,
      refetchInterval: 3000 // Poll every 3 seconds
    }
  );

  // Handle progress completion
  useEffect(() => {
    if (addTracksProgress?.stage === "Complete" && addTracksJobId) {
      const timer = setTimeout(() => {
        setAddTracksJobId(null);
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [addTracksProgress?.stage, addTracksJobId, refetch]);

  const handleExport = async () => {
    try {
      const data = await exportQuery.refetch();
      if (data.data) {
        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(data.data.json, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${album?.title.replace(/[^a-z0-9]/gi, '_')}_export.json`;
        a.click();
        
        // Also download README
        const readmeBlob = new Blob([data.data.readme], { type: 'text/markdown' });
        const readmeUrl = URL.createObjectURL(readmeBlob);
        const readmeA = document.createElement('a');
        readmeA.href = readmeUrl;
        readmeA.download = 'README.md';
        readmeA.click();
        
        toast.success("Album exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export album");
    }
  };

  const handleOptimize = (newPlatform: string) => {
    if (!album) return;
    optimizeMutation.mutate({
      albumId: album.id,
      targetPlatform: newPlatform as any
    });
  };

  const handleImprove = (trackId: number) => {
    if (improvements.length === 0) {
      toast.error("Select at least one improvement");
      return;
    }
    improveMutation.mutate({ trackId, improvements });
  };

  const toggleImprovement = (improvement: string) => {
    if (improvements.includes(improvement)) {
      setImprovements(improvements.filter(i => i !== improvement));
    } else {
      setImprovements([...improvements, improvement]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNav />
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            {/* Album header skeleton */}
            <div className="flex gap-6 animate-pulse">
              <div className="w-64 h-64 bg-muted rounded-lg" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
            {/* Tracks skeleton */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle errors with specific messages
  if (error) {
    const errorMessage = error.message || "An error occurred";
    const isForbidden = errorMessage.includes("private") || errorMessage.includes("Access denied");
    const isNotFound = errorMessage.includes("not found");
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              {isForbidden ? "Access Denied" : isNotFound ? "Album Not Found" : "Error"}
            </CardTitle>
            <CardDescription>
              {isForbidden 
                ? "This album is private and you don't have permission to view it." 
                : isNotFound
                ? "The album you're looking for doesn't exist or has been deleted."
                : errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/library">
              <Button className="w-full">Back to My Library</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" className="w-full">Explore Public Albums</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Album Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/library">
              <Button>Back to Library</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeTrack = album.tracks.find((t: any) => t.id === activeTrackId);
  const promptAsset = activeTrack?.assets?.find((a: any) => a.type === "prompt");
  const lyricsAsset = activeTrack?.assets?.find((a: any) => a.type === "lyrics");
  const structureAsset = activeTrack?.assets?.find((a: any) => a.type === "structure");
  const productionAsset = activeTrack?.assets?.find((a: any) => a.type === "production_notes");
  const alt1Asset = activeTrack?.assets?.find((a: any) => a.type === "alternate_1");
  const alt2Asset = activeTrack?.assets?.find((a: any) => a.type === "alternate_2");

  return (
    <>
    <div className="min-h-screen bg-background">
      <AppNav />
      
      {/* Action Bar */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-[73px] z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={() => generateMusicMutation.mutate({ albumId: album.id })}
                disabled={generateMusicMutation.isPending}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {generateMusicMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Music2 className="w-4 h-4 mr-2" />
                )}
                Generate Music
              </Button>
              {album.tracks && album.tracks.length < 20 && (
                <Button
                  variant="outline"
                  onClick={() => setShowAddTracksDialog(true)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add More Tracks
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => bookletMutation.mutate({ albumId: album.id })}
                disabled={bookletMutation.isPending}
              >
                {bookletMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PDF Booklet
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={exportQuery.isFetching}>
                {exportQuery.isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => shareMutation.mutate({ albumId: album.id })}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Add Tracks Progress */}
        {addTracksProgress && addTracksProgress.stage !== "Complete" && (
          <Card className="mb-6 border-accent/30 bg-accent/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    <div>
                      <p className="font-semibold text-lg">Adding Tracks to Album</p>
                      <p className="text-sm text-muted-foreground">
                        {addTracksProgress.message || "Generating additional tracks..."}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-accent">{addTracksProgress.progress}%</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{addTracksProgress.stage}</p>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-500 ease-out"
                    style={{ width: `${addTracksProgress.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue Visibility */}
        {musicStatus?.hasActiveJobs && musicStatus?.queueInfo && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <div>
                      <p className="font-semibold">Music Generation in Progress</p>
                      <p className="text-sm text-muted-foreground">
                        Position #{musicStatus.queueInfo.position} of {musicStatus.queueInfo.totalInQueue} in queue
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Estimated Wait Time</p>
                  <p className="text-2xl font-bold text-primary">
                    {musicStatus.queueInfo.estimatedWaitMinutes < 1 
                      ? "< 1 min" 
                      : `${musicStatus.queueInfo.estimatedWaitMinutes} min`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ETA: {new Date(musicStatus.queueInfo.estimatedCompletionTime).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-yellow-500">{musicStatus.pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">{musicStatus.processingCount}</p>
                  <p className="text-xs text-muted-foreground">Processing</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-500">{musicStatus.completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{musicStatus.failedCount}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Album Header */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8 mb-8">
          <div>
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.title} className="w-full rounded-lg shadow-lg" />
            ) : (
              <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                <Music2 className="w-24 h-24 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
              <p className="text-muted-foreground text-lg">{album.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{album.platform}</Badge>
              <Badge variant="outline">Score: {album.score}/100</Badge>
              <Badge variant="outline">{album.trackCount} tracks</Badge>
              {album.visibility === "public" ? (
                <Badge variant="default" className="bg-green-500">
                  <Eye className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            {/* Visibility Toggle - Prominent Card */}
            <Card className={`border-2 ${album.visibility === "public" ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {album.visibility === "public" ? (
                        <>
                          <Eye className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-green-900 dark:text-green-100">Album is Public</h3>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-5 h-5 text-yellow-600" />
                          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Album is Private</h3>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {album.visibility === "public" 
                        ? "✓ Visible to everyone in the Explore gallery. Other users can discover and listen to your album." 
                        : "⚠️ Only you can see this album. Toggle to Public to share it with the community."}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="visibility"
                      checked={album.visibility === "public"}
                      onCheckedChange={(checked) => {
                        updateVisibility.mutate({
                          albumId: album.id,
                          visibility: checked ? "public" : "private"
                        });
                      }}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="visibility" className="cursor-pointer font-medium">
                      {album.visibility === "public" ? "Public" : "Make Public"}
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div>
              <label className="text-sm font-medium mb-2 block">Optimize for Platform</label>
              <Select value={album.platform} onValueChange={handleOptimize}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suno">Suno AI</SelectItem>
                  <SelectItem value="udio">Udio</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                  <SelectItem value="mubert">Mubert</SelectItem>
                  <SelectItem value="stable_audio">Stable Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Music Player Section */}
        {musicStatus && musicStatus.jobs && musicStatus.jobs.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Generated Music</h2>
              </div>
              {(() => {
                const failedCount = musicStatus?.jobs?.filter((j: any) => j.status === "failed").length || 0;
                return failedCount > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryAllFailedMutation.mutate({ albumId: album.id })}
                    disabled={retryAllFailedMutation.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${retryAllFailedMutation.isPending ? 'animate-spin' : ''}`} />
                    {retryAllFailedMutation.isPending ? 'Retrying...' : `Retry All Failed (${failedCount})`}
                  </Button>
                ) : null;
              })()}
            </div>
            <div className="grid lg:grid-cols-[1fr_350px] gap-6">
              {/* Audio Players */}
              <div className="space-y-3">
              {album.tracks.map((track: any, idx: number) => {
                const job = musicStatus?.jobs?.find((j: any) => j.trackId === track.id);
                const audioFile = musicStatus?.audioFiles?.find((a: any) => a.trackId === track.id && a.isActive);
                
                // Determine if this track is queued or processing
                // Since we process one at a time, only the first pending/processing job is actually "processing"
                const pendingJobs = musicStatus?.jobs?.filter((j: any) => j.status === "pending" || j.status === "processing") || [];
                const firstPendingJob = pendingJobs.length > 0 ? pendingJobs[0] : null;
                
                let displayStatus = job?.status || "pending";
                if (job && (job.status === "pending" || job.status === "processing")) {
                  // If this is the first pending/processing job, show as "processing"
                  // Otherwise show as "queued"
                  if (firstPendingJob && firstPendingJob.id === job.id) {
                    displayStatus = "processing";
                  } else {
                    displayStatus = "pending";
                  }
                }
                
                // Auto-play handler: play next track when current finishes
                const handleTrackEnd = () => {
                  // Find current track in queue
                  const queueIndex = shuffledTrackIds.indexOf(track.id);
                  const nextQueueIndex = queueIndex + 1;
                  
                  if (nextQueueIndex < shuffledTrackIds.length) {
                    const nextTrackId = shuffledTrackIds[nextQueueIndex];
                    const nextTrack = album.tracks.find((t: any) => t.id === nextTrackId);
                    
                    if (nextTrack) {
                      // Find the next track's audio file
                      const nextAudioFile = musicStatus.audioFiles.find(
                        (a: any) => a.trackId === nextTrack.id && a.isActive
                      );
                      
                      // Only auto-play if next track has audio available
                      if (nextAudioFile?.fileUrl) {
                        setCurrentPlayingTrackId(nextTrack.id);
                        setCurrentQueueIndex(nextQueueIndex);
                        // Small delay to ensure UI updates
                        setTimeout(() => {
                          const nextAudioElement = document.querySelector(
                            `audio[data-track-id="${nextTrack.id}"]`
                          ) as HTMLAudioElement;
                          if (nextAudioElement) {
                            nextAudioElement.play().catch(err => {
                              console.error("Auto-play failed:", err);
                            });
                          }
                        }, 100);
                      }
                    }
                  }
                };
                
                return (
                  <AudioPlayer
                    key={track.id}
                    trackId={track.id}
                    trackTitle={track.title}
                    trackIndex={track.index}
                    audioUrl={audioFile?.fileUrl}
                    status={displayStatus as any}
                    progress={job?.progress || 0}
                    statusMessage={job?.status === "failed" ? (job?.errorMessage || "Unknown error") : (job?.statusMessage || undefined)}
                    onRetry={() => retryGenerationMutation.mutate({ trackId: track.id })}
                    onTrackEnd={handleTrackEnd}
                    totalTracks={album.tracks.length}
                  />
                );
              })}
              </div>
              
              {/* Queue Visualization */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <AlbumQueue
                  tracks={album.tracks}
                  queueOrder={shuffledTrackIds}
                  currentTrackId={currentPlayingTrackId}
                  isShuffleEnabled={isShuffleEnabled}
                  onToggleShuffle={() => {
                    setIsShuffleEnabled(!isShuffleEnabled);
                    toast.success(isShuffleEnabled ? "Shuffle disabled" : "Shuffle enabled");
                  }}
                  onTrackClick={(trackId) => {
                    // Find and play the clicked track
                    const audioElement = document.querySelector(
                      `audio[data-track-id="${trackId}"]`
                    ) as HTMLAudioElement;
                    if (audioElement) {
                      setCurrentPlayingTrackId(trackId);
                      setCurrentQueueIndex(shuffledTrackIds.indexOf(trackId));
                      audioElement.play().catch(err => {
                        console.error("Playback failed:", err);
                        toast.error("Failed to play track");
                      });
                    }
                  }}
                  audioFiles={musicStatus.audioFiles}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Workspace */}
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Track List */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4">Tracks</h2>
            {album.tracks.map((track: any) => (
              <Card
                key={track.id}
                className={`cursor-pointer transition-colors ${
                  activeTrackId === track.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
              >
                <CardHeader className="p-4" onClick={() => setActiveTrackId(track.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm">{track.index}. {track.title}</CardTitle>
                      <CardDescription className="text-xs">
                        Score: {track.score}/100
                      </CardDescription>
                    </div>
                    <AddToPlaylist trackId={track.id} trackTitle={track.title} />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Track Editor */}
          <div>
            {activeTrack ? (
              <Card>
                <CardHeader>
                  <CardTitle>{activeTrack.title}</CardTitle>
                  <CardDescription>
                    {activeTrack.tempoBpm} • {activeTrack.key} • Score: {activeTrack.score}/100
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="prompt">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="prompt">Prompt</TabsTrigger>
                      <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="alternates">Alternates</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="prompt" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Platform Prompt</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(promptAsset?.content || "", 'prompt')}
                            className="h-8"
                          >
                            {copiedPrompt ? (
                              <><Check className="h-3 w-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={promptAsset?.content || ""}
                          readOnly
                          rows={4}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {promptAsset?.content?.length || 0} characters
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="lyrics" className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Lyrics</label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(lyricsAsset?.content || "", 'lyrics')}
                            className="h-8"
                          >
                            {copiedLyrics ? (
                              <><Check className="h-3 w-3 mr-1" /> Copied</>
                            ) : (
                              <><Copy className="h-3 w-3 mr-1" /> Copy</>
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={lyricsAsset?.content || ""}
                          readOnly
                          rows={16}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {lyricsAsset?.content?.length || 0} characters
                        </p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="space-y-4">
                      <div className="grid gap-4">
                        <div>
                          <label className="text-sm font-medium">Structure</label>
                          <p className="text-sm text-muted-foreground">{structureAsset?.content}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Production Notes</label>
                          <p className="text-sm text-muted-foreground">{productionAsset?.content}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Mood Tags</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {JSON.parse(activeTrack.moodTags || "[]").map((tag: string) => (
                              <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        {activeTrack.scoreBreakdown && (
                          <div>
                            <label className="text-sm font-medium mb-2 block">Quality Breakdown</label>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(JSON.parse(activeTrack.scoreBreakdown)).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-medium">{value}/10</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="alternates" className="space-y-4">
                      {alt1Asset && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">More Cinematic</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={JSON.parse(alt1Asset.content).lyrics}
                              readOnly
                              rows={8}
                              className="font-mono text-xs"
                            />
                          </CardContent>
                        </Card>
                      )}
                      {alt2Asset && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">More Minimal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Textarea
                              value={JSON.parse(alt2Asset.content).lyrics}
                              readOnly
                              rows={8}
                              className="font-mono text-xs"
                            />
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Improvement Controls */}
                  <div className="mt-6 pt-6 border-t">
                    <label className="text-sm font-medium mb-3 block">Improve This Track</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {["funnier", "simpler", "more_poetic", "more_cinematic", "more_spiritual", "less_political"].map((imp) => (
                        <Badge
                          key={imp}
                          variant={improvements.includes(imp) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleImprovement(imp)}
                        >
                          {imp.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      onClick={() => handleImprove(activeTrack.id)}
                      disabled={improveMutation.isPending || improvements.length === 0}
                      className="w-full"
                    >
                      {improveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Improving...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Regenerate with Improvements
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Music2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a track to view and edit</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Add More Tracks Dialog */}
    <Dialog open={showAddTracksDialog} onOpenChange={setShowAddTracksDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add More Tracks</DialogTitle>
          <DialogDescription>
            Generate additional tracks for this album using the same theme and style.
            Current tracks: {album?.tracks?.length || 0} | Max: 20
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="trackCount">Number of tracks to add</Label>
            <Input
              id="trackCount"
              type="number"
              min={1}
              max={Math.min(11, 20 - (album?.tracks?.length || 0))}
              value={additionalTrackCount}
              onChange={(e) => setAdditionalTrackCount(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">
              Album will have {(album?.tracks?.length || 0) + additionalTrackCount} tracks total
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddTracksDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => addTracksMutation.mutate({
              albumId: album!.id,
              additionalTrackCount
            })}
            disabled={addTracksMutation.isPending}
          >
            {addTracksMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Tracks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
