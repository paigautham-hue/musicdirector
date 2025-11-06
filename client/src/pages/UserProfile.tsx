import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Music,
  Heart,
  Users,
  ArrowLeft,
  Star,
  Play,
  Eye,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfile() {
  const params = useParams();
  const userId = parseInt(params.id || "0");
  const { user: currentUser } = useAuth();

  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.social.getUserProfile.useQuery({
    userId,
    viewerId: currentUser?.id,
  });

  const { data: albums } = trpc.social.getUserAlbums.useQuery({ userId, limit: 50 });

  const toggleFollow = trpc.social.toggleFollow.useMutation({
    onSuccess: () => {
      utils.social.getUserProfile.invalidate({ userId });
      toast.success(profile?.isFollowing ? "Unfollowed" : "Following!");
    },
  });

  const handleFollow = () => {
    if (!currentUser) {
      toast.error("Please sign in to follow users");
      return;
    }
    toggleFollow.mutate({ userId });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">User not found</h3>
            <Link href="/explore">
              <Button className="mt-4">Back to Explore</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/explore">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-3xl">
                  {profile.user.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.user.name || "Anonymous"}</h1>
                {profile.user.bio && (
                  <p className="text-muted-foreground mb-4">{profile.user.bio}</p>
                )}

                <div className="flex flex-wrap gap-6 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.albumCount}</div>
                    <div className="text-sm text-muted-foreground">Albums</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.followerCount}</div>
                    <div className="text-sm text-muted-foreground">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.followingCount}</div>
                    <div className="text-sm text-muted-foreground">Following</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{profile.totalLikes}</div>
                    <div className="text-sm text-muted-foreground">Total Likes</div>
                  </div>
                </div>

                {!isOwnProfile && currentUser && (
                  <Button
                    variant={profile.isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    disabled={toggleFollow.isPending}
                  >
                    {profile.isFollowing ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="albums" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="albums">
              <Music className="mr-2 h-4 w-4" />
              Albums ({albums?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Star className="mr-2 h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="albums">
            {albums && albums.length > 0 ? (
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
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Music className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No public albums yet</h3>
                <p className="text-muted-foreground">
                  {isOwnProfile
                    ? "Create your first album to share with the community!"
                    : "This user hasn't shared any albums yet."}
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-purple-500" />
                    Total Albums
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{profile.albumCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Total Likes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{profile.totalLikes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Followers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{profile.followerCount}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">
                    {profile.avgRating ? profile.avgRating.toFixed(1) : "N/A"}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-green-500" />
                    Total Plays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{profile.totalPlays || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-cyan-500" />
                    Total Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold">{profile.totalViews || 0}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
