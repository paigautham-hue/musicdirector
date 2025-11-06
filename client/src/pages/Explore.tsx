import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Music, Search, TrendingUp, Star, Play, Eye, Heart } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { AppNav } from "@/components/AppNav";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "trending" | "top_rated" | "most_played">("trending");

  const { data: albums, isLoading } = trpc.social.getPublicAlbums.useQuery({
    search: search || undefined,
    platform,
    sortBy,
    limit: 50,
    offset: 0,
  });

  const { data: trending } = trpc.social.getTrending.useQuery({ limit: 5 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <AppNav />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Explore Albums
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover amazing AI-generated music from creators around the world
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search albums..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={platform} onValueChange={(v) => setPlatform(v === "all" ? undefined : v)}>
              <SelectTrigger>
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="suno">Suno AI</SelectItem>
                <SelectItem value="udio">Udio</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="mubert">Mubert</SelectItem>
                <SelectItem value="stable_audio">Stable Audio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Trending
                  </div>
                </SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="top_rated">
                  <div className="flex items-center">
                    <Star className="mr-2 h-4 w-4" />
                    Top Rated
                  </div>
                </SelectItem>
                <SelectItem value="most_played">
                  <div className="flex items-center">
                    <Play className="mr-2 h-4 w-4" />
                    Most Played
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full rounded-lg mb-4" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : albums && albums.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                  <Link key={album.id} href={`/album/${album.id}`}>
                    <Card className="hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                      <CardHeader className="p-0">
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={album.coverUrl || "/placeholder-album.png"}
                            alt={album.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <CardTitle className="text-lg mb-2 line-clamp-1">{album.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mb-3">
                          {album.description}
                        </CardDescription>

                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="secondary" className="capitalize">
                            {album.platform}
                          </Badge>
                          <Badge variant="outline">{album.trackCount} tracks</Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{album.score?.toFixed(1) || "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{album.viewCount || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Play className="h-4 w-4" />
                              <span>{album.playCount || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                            {album.userName?.charAt(0).toUpperCase() || "?"}
                          </div>
                          <span className="text-sm text-muted-foreground">{album.userName || "Anonymous"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No albums found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Now */}
            {trending && trending.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Trending Now
                  </CardTitle>
                  <CardDescription>Hot albums this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {trending.map((album, index) => (
                    <Link key={album.id} href={`/album/${album.id}`}>
                      <div className="flex gap-3 hover:bg-accent p-2 rounded-lg transition-colors cursor-pointer">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-1">{album.title}</h4>
                          <p className="text-xs text-muted-foreground">{album.userName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {album.score?.toFixed(1)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Play className="h-3 w-3" />
                              {album.playCount}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Albums</span>
                  <span className="font-bold">{albums?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Creators</span>
                  <span className="font-bold">
                    {new Set(albums?.map((a) => a.userId)).size || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
