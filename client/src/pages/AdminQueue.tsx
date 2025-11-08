import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppNav } from "@/components/AppNav";
import { AlertCircle, CheckCircle, Clock, XCircle, RefreshCw, Ban } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminQueue() {
  const { user, loading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"pending" | "processing" | "completed" | "failed" | undefined>(undefined);

  const { data: jobs, isLoading, refetch } = trpc.admin.getAllMusicJobs.useQuery(
    { status: statusFilter, limit: 100 },
    { enabled: user?.role === "admin", refetchInterval: 5000 } // Auto-refresh every 5 seconds
  );

  const markFailedMutation = trpc.admin.markJobFailed.useMutation({
    onSuccess: () => {
      toast.success("Job marked as failed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark job as failed");
    },
  });

  const restartMutation = trpc.admin.restartJob.useMutation({
    onSuccess: () => {
      toast.success("Job restarted");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to restart job");
    },
  });

  if (loading) {
    return (
      <>
        <AppNav />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (user?.role !== "admin") {
    return (
      <>
        <AppNav />
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Ban className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need admin privileges to access this page.
                </p>
                <Link href="/">
                  <Button>Go Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatDuration = (createdAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(createdAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <>
      <AppNav />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Music Generation Queue</h1>
            <p className="text-muted-foreground">
              Monitor and manage all music generation jobs across the platform
            </p>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v as any)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            {jobs && (
              <span className="text-sm text-muted-foreground">
                {jobs.length} jobs
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Jobs Found</h3>
                <p className="text-muted-foreground text-center">
                  {statusFilter
                    ? `No ${statusFilter} jobs at the moment`
                    : "No music generation jobs in the queue"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((item) => {
                const job = item.job;
                const album = item.album;
                const track = item.track;
                const jobUser = item.user;
                const isStuck = job.status === "pending" && 
                  new Date().getTime() - new Date(job.createdAt).getTime() > 20 * 60 * 1000; // 20 minutes

                return (
                  <Card key={job.id} className={isStuck ? "border-red-500/50" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">
                              Job #{job.id}
                            </CardTitle>
                            <Badge variant="outline" className={getStatusColor(job.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(job.status)}
                                {job.status}
                              </span>
                            </Badge>
                            {isStuck && (
                              <Badge variant="destructive">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Stuck
                              </Badge>
                            )}
                          </div>
                          <CardDescription>
                            <div className="space-y-1">
                              <div>
                                <span className="font-medium">Album:</span>{" "}
                                {album ? (
                                  <Link href={`/album/${album.id}`}>
                                    <span className="text-primary hover:underline">
                                      {album.title}
                                    </span>
                                  </Link>
                                ) : (
                                  "Unknown"
                                )}
                              </div>
                              {track && (
                                <div>
                                  <span className="font-medium">Track:</span> {track.title}
                                </div>
                              )}
                              <div>
                                <span className="font-medium">User:</span>{" "}
                                {jobUser?.name || "Unknown"}
                              </div>
                              <div>
                                <span className="font-medium">Platform:</span> {job.platform}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span>{" "}
                                {formatDuration(job.createdAt)}
                              </div>
                              {job.progress !== null && job.progress > 0 && (
                                <div>
                                  <span className="font-medium">Progress:</span> {job.progress}%
                                </div>
                              )}
                              {job.errorMessage && (
                                <div className="text-destructive">
                                  <span className="font-medium">Error:</span> {job.errorMessage}
                                </div>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {(job.status === "pending" || job.status === "failed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restartMutation.mutate({ jobId: job.id })}
                              disabled={restartMutation.isPending}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Restart
                            </Button>
                          )}
                          {(job.status === "pending" || job.status === "processing") && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                markFailedMutation.mutate({
                                  jobId: job.id,
                                  errorMessage: "Manually marked as failed by admin",
                                })
                              }
                              disabled={markFailedMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Mark Failed
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
