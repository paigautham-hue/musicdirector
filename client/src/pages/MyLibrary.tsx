import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Plus, Loader2, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function MyLibrary() {
  const { user } = useAuth();
  const { data: albums, isLoading, refetch } = trpc.albums.list.useQuery({ limit: 50 });
  
  const deleteMutation = trpc.albums.delete.useMutation({
    onSuccess: () => {
      toast.success('Album deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete album');
    }
  });
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <a className="flex items-center gap-2 text-2xl font-bold">
                <Music className="w-8 h-8 text-primary" />
                <span>{APP_TITLE}</span>
              </a>
            </Link>
            <Link href="/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Album
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">My Albums</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : albums && albums.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => (
              <div key={album.id} className="relative group">
                <Link href={`/album/${album.id}`}>
                  <Card className="cursor-pointer hover:border-primary/50 transition-all h-full">
                    {album.coverUrl && (
                      <img src={album.coverUrl} alt={album.title} className="w-full h-48 object-cover rounded-t-lg" />
                    )}
                    <CardHeader>
                      <CardTitle>{album.title}</CardTitle>
                      <CardDescription>{album.theme}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{album.platform}</span>
                        <span>Score: {album.score}/100</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                {/* Delete Button - Always visible with better styling */}
                <div className="absolute top-3 right-3 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="shadow-lg hover:scale-110 transition-transform"
                        onClick={handleDelete}
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
