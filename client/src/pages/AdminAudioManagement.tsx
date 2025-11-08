import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, Database, HardDrive, Download, FileAudio, 
  TrendingUp, Users, Loader2, ExternalLink, Filter 
} from "lucide-react";
import { Link } from "wouter";
import { AppNav } from "@/components/AppNav";
import { PageHeader } from "@/components/PageHeader";

export default function AdminAudioManagement() {
  const { user } = useAuth();
  const [formatFilter, setFormatFilter] = useState<string | undefined>();
  const [platformFilter, setPlatformFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: analytics, isLoading: analyticsLoading } = trpc.admin.getAudioAnalytics.useQuery();
  const { data: formatDist, isLoading: formatLoading } = trpc.admin.getAudioFormatDistribution.useQuery();
  const { data: storageStats, isLoading: storageLoading } = trpc.admin.getStorageStats.useQuery();
  const { data: audioFiles, isLoading: filesLoading } = trpc.admin.getAllAudioFiles.useQuery({
    format: formatFilter,
    platform: platformFilter,
    limit: 100,
    offset: 0
  });

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

  // Filter audio files by search query
  const filteredFiles = audioFiles?.filter(file => 
    file.trackTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.albumTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    file.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <PageHeader 
        title="Audio Management" 
        description="Manage and monitor audio files across the platform"
        showBack
        showHome
      >
        <Link href="/admin">
          <Button variant="outline">
            Back to Admin Dashboard
          </Button>
        </Link>
      </PageHeader>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="files">Audio Files</TabsTrigger>
            <TabsTrigger value="storage">Storage</TabsTrigger>
            <TabsTrigger value="formats">Formats</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Audio Files</CardTitle>
                      <FileAudio className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.totalFiles.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        +{analytics?.recentActivity.last24h} in last 24h
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.totalStorageGB.toFixed(2)} GB</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics?.totalStorageMB.toFixed(0)} MB total
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg File Size</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.averageFileSizeMB.toFixed(2)} MB</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{analytics?.averageDurationSeconds}s duration
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics?.recentActivity.last7d}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Files in last 7 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Platform Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                    <CardDescription>Audio files by music generation platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.platformDistribution.map((platform) => (
                        <div key={platform.platform} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Music className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium capitalize">{platform.platform}</p>
                              <p className="text-sm text-muted-foreground">
                                {platform.totalSizeMB.toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{platform.count} files</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Audio file creation over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last 24 hours</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(analytics?.recentActivity.last24h || 0) / (analytics?.totalFiles || 1) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{analytics?.recentActivity.last24h}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last 7 days</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(analytics?.recentActivity.last7d || 0) / (analytics?.totalFiles || 1) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{analytics?.recentActivity.last7d}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Last 30 days</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(analytics?.recentActivity.last30d || 0) / (analytics?.totalFiles || 1) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{analytics?.recentActivity.last30d}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Audio Files Tab */}
          <TabsContent value="files" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Audio Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <Input
                      placeholder="Search by track, album, or user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Format</label>
                    <Select value={formatFilter} onValueChange={setFormatFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All formats" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All formats</SelectItem>
                        {formatDist?.map((fmt) => (
                          <SelectItem key={fmt.format} value={fmt.format}>
                            {fmt.format} ({fmt.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform</label>
                    <Select value={platformFilter} onValueChange={setPlatformFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All platforms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All platforms</SelectItem>
                        <SelectItem value="suno">Suno</SelectItem>
                        <SelectItem value="udio">Udio</SelectItem>
                        <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        <SelectItem value="mubert">Mubert</SelectItem>
                        <SelectItem value="stable_audio">Stable Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audio Files Table */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Files</CardTitle>
                <CardDescription>
                  Showing {filteredFiles?.length || 0} of {audioFiles?.length || 0} files
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Track</TableHead>
                          <TableHead>Album</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFiles?.map((file) => (
                          <TableRow key={file.id}>
                            <TableCell className="font-medium">{file.trackTitle}</TableCell>
                            <TableCell>{file.albumTitle}</TableCell>
                            <TableCell>{file.userName || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{file.platform}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge>{file.format || 'unknown'}</Badge>
                            </TableCell>
                            <TableCell>{file.fileSizeMB ? `${file.fileSizeMB} MB` : 'N/A'}</TableCell>
                            <TableCell>{file.duration ? `${file.duration}s` : 'N/A'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                >
                                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  asChild
                                >
                                  <a href={file.fileUrl} download={file.fileName}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="space-y-6">
            {storageLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Top Users by Storage */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Users by Storage</CardTitle>
                    <CardDescription>Users with the most audio storage</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Storage (MB)</TableHead>
                            <TableHead>Storage (GB)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {storageStats?.topUsersByStorage.map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell className="font-medium">{user.userName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{user.userEmail}</TableCell>
                              <TableCell>{user.totalFiles}</TableCell>
                              <TableCell>{user.totalSizeMB.toFixed(2)}</TableCell>
                              <TableCell className="font-medium">{user.totalSizeGB.toFixed(3)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage by Platform */}
                <Card>
                  <CardHeader>
                    <CardTitle>Storage by Platform</CardTitle>
                    <CardDescription>Audio storage distribution across platforms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {storageStats?.storageByPlatform.map((platform) => (
                        <div key={platform.platform} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Music className="h-6 w-6 text-primary" />
                            <div>
                              <p className="font-medium capitalize">{platform.platform}</p>
                              <p className="text-sm text-muted-foreground">
                                {platform.totalFiles} files
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{platform.totalSizeGB.toFixed(2)} GB</p>
                            <p className="text-sm text-muted-foreground">{platform.totalSizeMB.toFixed(0)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Formats Tab */}
          <TabsContent value="formats" className="space-y-6">
            {formatLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Audio Format Distribution</CardTitle>
                  <CardDescription>Breakdown of audio file formats</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Format</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Total Size (MB)</TableHead>
                          <TableHead>Avg Size (MB)</TableHead>
                          <TableHead>Avg Duration (s)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formatDist?.map((format) => (
                          <TableRow key={format.format}>
                            <TableCell>
                              <Badge className="uppercase">{format.format}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{format.count}</TableCell>
                            <TableCell>{format.totalSizeMB.toFixed(2)}</TableCell>
                            <TableCell>{format.avgSizeMB.toFixed(2)}</TableCell>
                            <TableCell>{format.avgDurationSeconds.toFixed(0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
