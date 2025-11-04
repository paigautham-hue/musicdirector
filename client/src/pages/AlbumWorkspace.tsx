import { useState } from "react";
import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Download, Share2, Sparkles, Music2, RefreshCw, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

export default function AlbumWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTrackId, setActiveTrackId] = useState<number | null>(null);
  const [improvements, setImprovements] = useState<string[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

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
  
  const { data: album, isLoading, refetch } = trpc.albums.get.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/library">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Button>
            </Link>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} disabled={exportQuery.isFetching}>
                {exportQuery.isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Export
              </Button>
              <Button variant="outline" onClick={() => shareMutation.mutate({ albumId: album.id })}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
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
            </div>
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

        {/* Workspace */}
        <div className="grid md:grid-cols-[300px_1fr] gap-6">
          {/* Track List */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold mb-4">Tracks</h2>
            {album.tracks.map((track: any) => (
              <Card
                key={track.id}
                className={`cursor-pointer transition-all ${
                  activeTrackId === track.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setActiveTrackId(track.id)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{track.index}. {track.title}</CardTitle>
                  <CardDescription className="text-xs">
                    Score: {track.score}/100
                  </CardDescription>
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
  );
}
