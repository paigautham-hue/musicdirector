import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ListMusic, Play, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlaylistStats() {
  const { data: stats, isLoading } = trpc.playlists.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Playlist Statistics</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No playlist data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-blue-500 bg-clip-text text-transparent">
                Playlist Statistics
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your playlist performance and listening trends
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Playlists</CardTitle>
              <ListMusic className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlaylists}</div>
              <p className="text-xs text-muted-foreground">
                Playlists created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlays}</div>
              <p className="text-xs text-muted-foreground">
                Across all playlists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTracks}</div>
              <p className="text-xs text-muted-foreground">
                Tracks in playlists
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Most Played Playlists */}
        <Card>
          <CardHeader>
            <CardTitle>Most Played Playlists</CardTitle>
            <CardDescription>Your top 10 playlists by play count</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.mostPlayedPlaylists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No playlists yet. Create your first playlist!
              </div>
            ) : (
              <div className="space-y-4">
                {stats.mostPlayedPlaylists.map((playlist, index) => (
                  <Link key={playlist.id} href={`/playlists/${playlist.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold">{playlist.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {playlist.trackCount} tracks
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{playlist.playCount}</span>
                        <span className="text-sm text-muted-foreground">plays</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
