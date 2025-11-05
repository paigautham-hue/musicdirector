import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Search, Music, TrendingUp, Clock } from "lucide-react";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function Gallery() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  
  const { data: albums, isLoading } = trpc.albums.getPublicAlbums.useQuery({
    search: searchQuery,
    sortBy
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="text-amber-500 hover:text-amber-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="flex items-center gap-2">
                {APP_LOGO && <img src={APP_LOGO} alt={APP_TITLE} className="w-8 h-8" />}
                <h1 className="text-2xl font-bold text-amber-500">Album Gallery</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search albums by title, theme, or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-900 border-amber-500/20 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "recent" ? "default" : "outline"}
                onClick={() => setSortBy("recent")}
                className={sortBy === "recent" ? "bg-amber-500 text-black" : "border-amber-500/20 text-amber-500"}
              >
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </Button>
              <Button
                variant={sortBy === "popular" ? "default" : "outline"}
                onClick={() => setSortBy("popular")}
                className={sortBy === "popular" ? "bg-amber-500 text-black" : "border-amber-500/20 text-amber-500"}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Popular
              </Button>
            </div>
          </div>
        </div>

        {/* Albums Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <Music className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            Loading albums...
          </div>
        ) : albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album: any) => (
              <Card
                key={album.id}
                className="bg-zinc-900 border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer overflow-hidden group"
                onClick={() => setLocation(`/album/${album.id}`)}
              >
                {/* Album Cover */}
                {album.coverUrl && (
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={album.coverUrl}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                {/* Album Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-lg font-bold text-amber-500 line-clamp-1">
                    {album.title}
                  </h3>
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {album.description || album.theme}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Music className="w-3 h-3" />
                      <span>{album.trackCount} tracks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-amber-500">
                        {album.platform}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>👤</span>
                      <span>{album.creatorName || "Anonymous"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>▶️</span>
                      <span>{album.playCount || 0} plays</span>
                    </div>
                  </div>

                  {album.score && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Hit Potential</span>
                        <span className="text-amber-500 font-bold">{album.score}/100</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-1.5 rounded-full"
                          style={{ width: `${album.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No albums found
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try a different search term"
                : "Be the first to create and share an album!"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
