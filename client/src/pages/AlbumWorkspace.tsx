import { useParams, Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function AlbumWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const { data: album, isLoading } = trpc.albums.get.useQuery(
    { id: parseInt(id!) },
    { enabled: !!id }
  );

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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <Link href="/library">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          {album.coverUrl && (
            <img src={album.coverUrl} alt={album.title} className="w-64 h-64 rounded-lg mb-4" />
          )}
          <h1 className="text-4xl font-bold mb-2">{album.title}</h1>
          <p className="text-muted-foreground">{album.description}</p>
          <div className="flex gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Platform: {album.platform}</span>
            <span className="text-sm text-muted-foreground">Score: {album.score}/100</span>
          </div>
        </div>

        <div className="grid gap-4">
          {album.tracks.map((track: any) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle>{track.index}. {track.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>Tempo: {track.tempoBpm}</p>
                  <p>Key: {track.key}</p>
                  <p>Score: {track.score}/100</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
