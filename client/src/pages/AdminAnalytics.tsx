import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Activity, TrendingUp, Users, Database, Zap, DollarSign, Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week" | "month">("day");
  
  const { data: apiStats, isLoading: apiLoading } = trpc.admin.apiUsageStats.useQuery({ timeRange });
  const { data: llmStats, isLoading: llmLoading } = trpc.admin.llmUsageStats.useQuery({ timeRange });
  const { data: userStats, isLoading: userLoading } = trpc.admin.userStats.useQuery();
  
  const isLoading = apiLoading || llmLoading || userLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                ← Back to Admin
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-primary">Analytics Dashboard</h1>
          </div>
          
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hour">Last Hour</SelectItem>
              <SelectItem value="day">Last 24 Hours</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* User Statistics */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Statistics
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {userStats?.adminUsers || 0} admins
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Signups</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats?.newSignups || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Albums</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats?.totalAlbums || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {userStats?.publicAlbums || 0} public, {userStats?.recentAlbums || 0} recent
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* API Usage Statistics */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                API Usage
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiStats?.totalRequests || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {apiStats?.successfulRequests || 0} successful
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiStats?.successRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      {apiStats?.failedRequests || 0} failed
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{apiStats?.avgLatency || 0}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Average response time
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {apiStats ? ((apiStats.failedRequests / (apiStats.totalRequests || 1)) * 100).toFixed(2) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Failed requests
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Top Endpoints */}
              {apiStats?.byEndpoint && Object.keys(apiStats.byEndpoint).length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Top Endpoints</CardTitle>
                    <CardDescription>Most frequently accessed API endpoints</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(apiStats.byEndpoint)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 10)
                        .map(([endpoint, stats]) => (
                          <div key={endpoint} className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-mono text-sm">{endpoint}</p>
                              <p className="text-xs text-muted-foreground">
                                {stats.count} requests • {Math.round(stats.avgLatency)}ms avg • {stats.errors} errors
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* LLM Usage Statistics */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                LLM Performance
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{llmStats?.totalCalls || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {llmStats?.successfulCalls || 0} successful
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{llmStats?.successRate || 0}%</div>
                    <p className="text-xs text-muted-foreground">
                      LLM reliability
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${llmStats?.totalCost || "0.00"}</div>
                    <p className="text-xs text-muted-foreground">
                      {llmStats?.totalTokens?.toLocaleString() || 0} tokens
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{llmStats?.avgLatency || 0}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Response time
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* LLM Model Breakdown */}
              {llmStats?.byModel && Object.keys(llmStats.byModel).length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {Object.entries(llmStats.byModel).map(([model, stats]) => (
                    <Card key={model}>
                      <CardHeader>
                        <CardTitle className="text-base">{model}</CardTitle>
                        <CardDescription>{stats.calls} calls</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span className="font-medium">{stats.successRate}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Avg Latency:</span>
                          <span className="font-medium">{stats.avgLatency}ms</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Tokens:</span>
                          <span className="font-medium">{stats.totalTokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-medium">${stats.totalCost.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Errors:</span>
                          <span className="font-medium text-destructive">{stats.errors}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
