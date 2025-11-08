import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Settings, Users, BarChart3, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = trpc.admin.analytics.useQuery();

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Admin access required</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Back to Home</Button>
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
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-3">
            <Link href="/admin/users">
              <Button className="bg-purple-500 hover:bg-purple-600">
                <Users className="w-4 h-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/admin/audio-health">
              <Button className="bg-red-500 hover:bg-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                Audio Health
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button className="bg-green-500 hover:bg-green-600">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/admin/quotas">
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Users className="w-4 h-4 mr-2" />
                User Quotas
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button className="bg-amber-500 hover:bg-amber-600">
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{analytics?.totalUsers || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Albums</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{analytics?.totalAlbums || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Total Tracks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">{analytics?.totalTracks || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
