import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Music,
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  Star,
  Play,
  Eye,
  User,
  Calendar,
  Twitter,
  Facebook,
  Linkedin,
  Link as LinkIcon,
  Check,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TrackListSkeleton } from "@/components/TrackListSkeleton";

export default function AlbumDetail() {
  const params = useParams();
  const albumId = parseInt(params.id || "0");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [comment, setComment] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRegeneratingCover, setIsRegeneratingCover] = useState(false);

  const handleBack = () => {
    // Use browser history to go back
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to explore if no history
      navigate("/explore");
    }
  };

  const utils = trpc.useUtils();

  const { data: album, isLoading } = trpc.social.getAlbumDetails.useQuery({
    albumId,
    userId: user?.id,
  });

  const { data: comments } = trpc.social.getComments.useQuery({ albumId });

  const incrementViews = trpc.social.incrementViews.useMutation();
  const toggleLike = trpc.social.toggleLike.useMutation({
    onSuccess: () => {
      utils.social.getAlbumDetails.invalidate({ albumId });
      toast.success(album?.userLiked ? "Removed from favorites" : "Added to favorites!");
    },
  });

  const addComment = trpc.social.addComment.useMutation({
    onSuccess: () => {
      setComment("");
      utils.social.getComments.invalidate({ albumId });
      toast.success("Comment added!");
    },
  });

  const regenerateCover = trpc.albums.regenerateCover.useMutation({
    onSuccess: () => {
      utils.social.getAlbumDetails.invalidate({ albumId });
      setIsRegeneratingCover(false);
      toast.success("Album cover regenerated!");
    },
    onError: (error) => {
      setIsRegeneratingCover(false);
      toast.error(error.message || "Failed to regenerate cover");
    },
  });

  const handleRegenerateCover = () => {
    setIsRegeneratingCover(true);
    regenerateCover.mutate({ albumId });
  };

  // Increment view count on mount
  useEffect(() => {
    incrementViews.mutate({ albumId });
  }, [albumId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <AppNav />
        <div className="container mx-auto px-4 py-8">
          {/* Album Header Skeleton */}
          <div className="mb-8 space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          {/* Track List Skeleton */}
          <TrackListSkeleton count={5} />
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Album not found</h3>
            <Link href="/explore">
              <Button className="mt-4">Back to Explore</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const handleLike = () => {
    if (!user) {
      toast.error("Please sign in to like albums");
      return;
    }
    toggleLike.mutate({ albumId });
  };

  const handleComment = () => {
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!comment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    addComment.mutate({ albumId, content: comment });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <AppNav />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Album Header */}
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <div className="relative">
                    <img
                      src={album.album.coverUrl || "/placeholder-album.png"}
                      alt={album.album.title}
                      className="w-full rounded-lg shadow-2xl"
                    />
                    {/* Show regenerate button if user owns the album or if cover is missing */}
                    {user && (album.album.userId === user.id || user.role === 'admin') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-4 right-4"
                        onClick={handleRegenerateCover}
                        disabled={isRegeneratingCover}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingCover ? 'animate-spin' : ''}`} />
                        {isRegeneratingCover ? 'Generating...' : 'Regenerate Cover'}
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {album.album.title}
                      </h1>
                      <p className="text-muted-foreground mb-4">{album.album.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="secondary" className="capitalize">
                          {album.album.platform}
                        </Badge>
                        <Badge variant="outline">{album.album.trackCount} tracks</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <div>
                            <div className="font-bold">{album.avgRating?.toFixed(1) || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">Rating ({album.ratingCount})</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-bold">{album.album.viewCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Views</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Play className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-bold">{album.album.playCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Plays</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-bold">{album.likeCount || 0}</div>
                            <div className="text-xs text-muted-foreground">Likes</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant={album.userLiked ? "default" : "outline"}
                        className="flex-1"
                        onClick={handleLike}
                        disabled={toggleLike.isPending}
                      >
                        <Heart
                          className={`mr-2 h-4 w-4 ${album.userLiked ? "fill-current" : ""}`}
                        />
                        {album.userLiked ? "Liked" : "Like"}
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => setShareDialogOpen(true)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Dialog */}
            <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Album</DialogTitle>
                  <DialogDescription>
                    Share this album on social media or copy the link
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Copy Link */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={window.location.href}
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                        toast.success("Link copied to clipboard!");
                      }}
                    >
                      {linkCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <LinkIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Social Media Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const url = encodeURIComponent(window.location.href);
                        const text = encodeURIComponent(`Check out "${album.album.title}" - ${album.album.description}`);
                        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
                      }}
                    >
                      <Twitter className="mr-2 h-4 w-4" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const url = encodeURIComponent(window.location.href);
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                      }}
                    >
                      <Facebook className="mr-2 h-4 w-4" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const url = encodeURIComponent(window.location.href);
                        const title = encodeURIComponent(album.album.title);
                        const summary = encodeURIComponent(album.album.description || '');
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                      }}
                    >
                      <Linkedin className="mr-2 h-4 w-4" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const url = encodeURIComponent(window.location.href);
                        const text = encodeURIComponent(`Check out "${album.album.title}"`);
                        window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comments ({comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Comment */}
                {user ? (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Share your thoughts about this album..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleComment} disabled={addComment.isPending}>
                      Post Comment
                    </Button>
                  </div>
                ) : (
                  <Card className="bg-muted">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        Sign in to leave a comment
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {/* Comments List */}
                {comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {c.userName?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{c.userName || "Anonymous"}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Creator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profile/${album.album.userId}`}>
                  <div className="flex items-center gap-3 hover:bg-accent p-3 rounded-lg transition-colors cursor-pointer">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {album.user?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{album.user?.name || "Anonymous"}</div>
                      <div className="text-sm text-muted-foreground">View Profile →</div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Album Info */}
            <Card>
              <CardHeader>
                <CardTitle>Album Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(album.album.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Music className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Platform:</span>
                  <Badge variant="secondary" className="capitalize">
                    {album.album.platform}
                  </Badge>
                </div>
                {album.album.theme && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground">Theme:</span>
                    <span className="font-medium">{album.album.theme}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
