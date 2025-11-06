import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Lightbulb, ArrowLeft, TrendingUp, Users, Music } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityPrompts() {
  const [, setLocation] = useLocation();
  const { data: prompts, isLoading } = trpc.social.getPublicPrompts.useQuery({ limit: 50 });

  const incrementUsage = trpc.social.incrementPromptUsage.useMutation();

  const handleUsePrompt = (prompt: any) => {
    // Increment usage count
    incrementUsage.mutate({ promptId: prompt.id });

    // Parse vibe and influences
    const vibe = prompt.vibe ? JSON.parse(prompt.vibe) : [];
    const influences = prompt.influences ? JSON.parse(prompt.influences) : [];

    // Build URL with query parameters
    const params = new URLSearchParams({
      theme: prompt.theme || "",
      platform: prompt.platform || "suno",
      language: prompt.language || "en",
      trackCount: (prompt.trackCount || 10).toString(),
    });

    if (vibe.length > 0) {
      params.set("vibes", JSON.stringify(vibe));
    }
    if (prompt.audience) {
      params.set("audience", prompt.audience);
    }
    if (influences.length > 0) {
      params.set("influences", JSON.stringify(influences));
    }

    setLocation(`/new?${params.toString()}`);
    toast.success("Prompt loaded! Customize and create your album.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Community Prompts
              </h1>
              <p className="text-muted-foreground mt-2">
                Discover and use prompts shared by the community
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{prompts?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Public Prompts</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(prompts?.map((p) => p.userId)).size || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Contributors</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {prompts?.reduce((sum, p) => sum + (p.usageCount || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Uses</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : prompts && prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt) => (
              <Card
                key={prompt.id}
                className="hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg line-clamp-1">{prompt.name}</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {prompt.usageCount || 0} uses
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{prompt.theme}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {prompt.platform}
                    </Badge>
                    <Badge variant="outline">{prompt.trackCount} tracks</Badge>
                    {prompt.language && (
                      <Badge variant="outline">{prompt.language.toUpperCase()}</Badge>
                    )}
                  </div>

                  {prompt.vibe && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Vibes:</div>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(prompt.vibe).map((v: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {prompt.influences && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Influences:</div>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(prompt.influences).slice(0, 3).map((inf: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {inf}
                          </Badge>
                        ))}
                        {JSON.parse(prompt.influences).length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{JSON.parse(prompt.influences).length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {prompt.userName?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {prompt.userName || "Anonymous"}
                    </span>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUsePrompt(prompt)}
                    disabled={incrementUsage.isPending}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    Use This Prompt
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Lightbulb className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No public prompts yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to share your creative prompts with the community!
            </p>
            <Link href="/prompts">
              <Button>Go to My Prompts</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
