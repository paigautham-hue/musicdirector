import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Sparkles, Star, TrendingUp, Gem, Loader2, Play } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function AdminRecommendations() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: staffPicks } = trpc.recommendations.getStaffPicks.useQuery({ limit: 10 });
  const { data: trending } = trpc.recommendations.getTrendingPotential.useQuery({ limit: 10 });
  const { data: hiddenGems } = trpc.recommendations.getHiddenGems.useQuery({ limit: 10 });

  const analyzeAllMutation = trpc.recommendations.analyzeAllTracks.useMutation({
    onSuccess: (data) => {
      setIsAnalyzing(false);
      toast.success(`Analysis complete! Found ${data.staffPicks} Staff Picks, ${data.trendingPotential} Trending tracks, and ${data.hiddenGems} Hidden Gems.`);
      // Refetch playlists
      window.location.reload();
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error(error.message || "Failed to analyze tracks");
    }
  });

  const handleAnalyzeAll = () => {
    if (confirm("This will analyze all tracks in the database using AI. This may take several minutes. Continue?")) {
      setIsAnalyzing(true);
      analyzeAllMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      
      <div className="container py-8 space-y-6">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Admin", href: "/admin" },
            { label: "AI Recommendations", href: "/admin/recommendations" }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              AI Recommendations Manager
            </h1>
            <p className="text-foreground/60 mt-2">Analyze tracks and manage AI-curated playlists</p>
          </div>
          <Button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing}
            size="lg"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Analyze All Tracks
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Staff Picks
                </CardTitle>
                <Badge variant="secondary">85+ Score</Badge>
              </div>
              <CardDescription>Exceptional tracks with outstanding quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{staffPicks?.length || 0}</div>
              <p className="text-sm text-foreground/60 mt-2">tracks available</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-pink-500" />
                  Trending Potential
                </CardTitle>
                <Badge variant="secondary">75-84 Score</Badge>
              </div>
              <CardDescription>Songs likely to go viral</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{trending?.length || 0}</div>
              <p className="text-sm text-foreground/60 mt-2">tracks available</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gem className="w-5 h-5 text-cyan-500" />
                  Hidden Gems
                </CardTitle>
                <Badge variant="secondary">70-84 Score</Badge>
              </div>
              <CardDescription>High quality tracks waiting to be discovered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{hiddenGems?.length || 0}</div>
              <p className="text-sm text-foreground/60 mt-2">tracks available</p>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">AI Analysis Process</h3>
              <p className="text-sm text-foreground/60">
                When you click "Analyze All Tracks", the AI will evaluate each track based on:
              </p>
              <ul className="list-disc list-inside text-sm text-foreground/60 space-y-1">
                <li><strong>Lyrical Quality</strong> - Sophistication, imagery, wordplay, storytelling</li>
                <li><strong>Emotional Depth</strong> - Ability to evoke feelings and connect with listeners</li>
                <li><strong>Universal Appeal</strong> - Themes that resonate across demographics</li>
                <li><strong>Memorability</strong> - Catchiness, hook strength, replay value</li>
                <li><strong>Production Quality</strong> - Musical arrangement, tempo, key choices</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Scoring Categories</h3>
              <ul className="list-disc list-inside text-sm text-foreground/60 space-y-1">
                <li><strong>Staff Picks (85-100)</strong> - Exceptional in multiple dimensions</li>
                <li><strong>Trending Potential (75-84)</strong> - Strong universal appeal and memorability</li>
                <li><strong>Hidden Gems (70-84)</strong> - High quality but needs discovery</li>
                <li><strong>Standard (Below 70)</strong> - Not featured in playlists</li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm">
                <strong>Note:</strong> Analysis uses AI and may take 1-2 minutes per track. 
                The process runs in the background, so you can navigate away from this page.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Playlists */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Current Playlists</h2>
          
          {/* Staff Picks Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Staff Picks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staffPicks && staffPicks.length > 0 ? (
                <div className="space-y-2">
                  {staffPicks.slice(0, 5).map((track) => (
                    <div key={track.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <img
                          src={track.album.coverUrl || "/placeholder-album.png"}
                          alt={track.album.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div>
                          <p className="font-semibold">{track.title}</p>
                          <p className="text-sm text-foreground/60">{track.album.title}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {track.score}/100
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-foreground/60 py-8">
                  No tracks analyzed yet. Click "Analyze All Tracks" to get started.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
