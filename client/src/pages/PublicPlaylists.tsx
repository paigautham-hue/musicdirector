import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Play, ListMusic, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";
import { Link } from "wouter";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";

export default function PublicPlaylists() {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "top_rated">("popular");

  const { data: playlists, isLoading } = trpc.playlists.public.useQuery({
    limit,
    offset,
    search: search || undefined,
    sortBy,
  });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <AppNav />
      <PageHeader 
        title="Discover Playlists" 
        description="Explore curated playlists from the community"
        showBack
        showHome
      />
      
      {/* Search and Filter */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search playlists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="top_rated">Highest Rated</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !playlists || playlists.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListMusic className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Public Playlists Yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Be the first to create and share a public playlist!
              </p>
              <Link href="/my-playlists">
                <Button>Create a Playlist</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <Card key={playlist.id} className="hover:shadow-lg transition-shadow group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{playlist.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
                        </CardDescription>
                      </div>
                    </div>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {playlist.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 mb-4">
                      {playlist.userAvatar ? (
                        <img
                          src={playlist.userAvatar}
                          alt={playlist.userName || "User"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Music className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {playlist.userName || "Unknown"}
                        </p>
                        <div className="flex items-center gap-2">
                          {playlist.ratingCount > 0 && (
                            <div className="flex items-center gap-1">
                              <StarRating
                                rating={playlist.averageRating}
                                readonly
                                size="sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                {playlist.averageRating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {playlist.playCount} plays
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/playlist/${playlist.id}`}>
                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        <Play className="w-4 h-4 mr-2" />
                        Play Playlist
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {playlists.length >= limit && (
              <div className="flex justify-center mt-8">
                <Button onClick={handleLoadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
