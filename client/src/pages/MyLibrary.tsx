import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Loader2, Trash2, Music2, ArrowUpDown } from "lucide-react";
import { AlbumCardSkeletonGrid } from "@/components/AlbumCardSkeleton";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

const STORAGE_KEY = 'myLibrary_sortPreference';

export default function MyLibrary() {
  const { user } = useAuth();
  const [makingPublic, setMakingPublic] = useState(false);
  
  // Load sort preference from localStorage on mount
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'score'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'date' || saved === 'title' || saved === 'score') {
        return saved;
      }
    }
    return 'date';
  });
  
  // Save sort preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, sortBy);
    }
  }, [sortBy]);
  const { data: albums, isLoading, refetch } = trpc.albums.list.useQuery({ limit: 50 });
  const { data: musicStatus } = trpc.albums.getBulkMusicStatus.useQuery(
    { albumIds: albums?.map(a => a.id) || [] },
    { enabled: !!albums && albums.length > 0 }
  );
  
  const deleteMutation = trpc.albums.delete.useMutation({
    onSuccess: () => {
      toast.success('Album deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete album');
    }
  });
  
  const updateVisibility = trpc.social.updateAlbumVisibility.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update visibility');
      setMakingPublic(false);
    }
  });
  
  const makeAllPublic = async () => {
    if (!albums) return;
    setMakingPublic(true);
    
    const privateAlbums = albums.filter(a => a.visibility === 'private');
    
    if (privateAlbums.length === 0) {
      toast.info('All albums are already public!');
      setMakingPublic(false);
      return;
    }
    
    try {
      for (const album of privateAlbums) {
        await updateVisibility.mutateAsync({
          albumId: album.id,
          visibility: 'public'
        });
      }
      toast.success(`Made ${privateAlbums.length} album(s) public!`);
      refetch();
    } catch (error) {
      toast.error('Failed to update some albums');
    } finally {
      setMakingPublic(false);
    }
  };
  


  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <PageHeader 
        title="My Albums" 
        description="Manage your AI-generated music albums"
        showBack
        showHome
      >
        {albums && albums.length > 0 && (
          <Button 
            onClick={makeAllPublic}
            disabled={makingPublic || !albums.some(a => a.visibility === 'private')}
            className="bg-green-600 hover:bg-green-700"
          >
            {makingPublic ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Making Public...
              </>
            ) : (
              'Make All Albums Public'
            )}
          </Button>
        )}
      </PageHeader>

      <div className="container mx-auto px-6 py-12">
        {/* Sorting Controls */}
        {albums && albums.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'score') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="score">Quality Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {isLoading ? (
          <AlbumCardSkeletonGrid count={6} />
        ) : albums && albums.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...albums].sort((a, b) => {
              if (sortBy === 'date') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              } else if (sortBy === 'title') {
                return a.title.localeCompare(b.title);
              } else { // score
                return (b.score || 0) - (a.score || 0);
              }
            }).map((album) => (
              <div key={album.id} className="relative group">
                <Link href={`/album/${album.id}`}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all h-full">
                    <div className="relative">
                      {album.coverUrl ? (
                        <img src={album.coverUrl} alt={album.title} className="w-full h-48 object-cover rounded-t-lg" />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                          <Music className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      {/* Music Generated Indicator */}
                      {musicStatus?.[album.id]?.hasMusic && (
                        <div className="absolute bottom-2 right-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <Music2 className="h-3 w-3" />
                          Music Ready
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle>{album.title}</CardTitle>
                      <CardDescription>{album.theme}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{album.platform}</span>
                          <span>Score: {album.score}/100</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                          <span>By {user?.name || 'You'}</span>
                          <span>{new Date(album.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                {/* Delete Button - Only visible for album owner */}
                {user?.id === album.userId && (
                  <div className="absolute top-3 right-3 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shadow-lg hover:scale-110 transition-transform"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Album?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{album.title}"? This action cannot be undone and will delete all tracks and assets.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate({ id: album.id })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Album
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Albums Yet</CardTitle>
              <CardDescription>Create your first AI-powered album to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/new">
                <Button>Create Album</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
