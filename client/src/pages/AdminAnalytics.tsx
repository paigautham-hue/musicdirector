import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, TrendingUp, Users, Database, Zap, DollarSign, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";

// Health status component with color-coded badges
function HealthStatus({ label, value, threshold }: { label: string; value: number; threshold: { good: number; warning: number } }) {
  const status = value >= threshold.good ? 'healthy' : value >= threshold.warning ? 'warning' : 'critical';
  const icon = status === 'healthy' ? <CheckCircle2 className="h-4 w-4" /> : 
               status === 'warning' ? <AlertCircle className="h-4 w-4" /> : 
               <XCircle className="h-4 w-4" />;
  const variant = status === 'healthy' ? 'default' : status === 'warning' ? 'secondary' : 'destructive';
  const bgColor = status === 'healthy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                  status === 'warning' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 
                  'bg-red-500/10 text-red-500 border-red-500/20';
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{label}:</span>
      <Badge className={`${bgColor} flex items-center gap-1`}>
        {icon}
        {value.toFixed(1)}%
      </Badge>
    </div>
  );
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<"hour" | "day" | "week">("day");
  
  const { data: apiStats, isLoading: apiLoading } = trpc.admin.apiUsageStats.useQuery({ timeRange });
  const { data: apiEndpoints, isLoading: endpointsLoading } = trpc.admin.apiEndpointBreakdown.useQuery({ timeRange });
  const { data: llmStats, isLoading: llmLoading } = trpc.admin.llmUsageStats.useQuery({ timeRange });
  const { data: userStats, isLoading: userLoading } = trpc.admin.userStats.useQuery();
  
  const isLoading = apiLoading || llmLoading || userLoading || endpointsLoading;

  // Calculate health metrics
  const apiSuccessRate = apiStats?.totalRequests ? (apiStats.successfulRequests / apiStats.totalRequests) * 100 : 0;
  const llmSuccessRate = llmStats?.totalCalls ? (llmStats.successfulCalls / llmStats.totalCalls) * 100 : 0;
  const errorRate = apiStats?.totalRequests ? (apiStats.failedRequests / apiStats.totalRequests) * 100 : 0;

  // Alert thresholds
  const hasHighErrorRate = errorRate > 5; // Alert if error rate > 5%
  const hasSlowApi = (apiStats?.avgLatency || 0) > 1000; // Alert if avg latency > 1s
  const hasLlmIssues = llmSuccessRate < 95; // Alert if LLM success rate < 95%

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
            {/* System Health Alerts */}
            {(hasHighErrorRate || hasSlowApi || hasLlmIssues) && (
              <Card className="border-red-500/50 bg-red-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-5 w-5" />
                    System Health Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {hasHighErrorRate && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>High error rate detected: {errorRate.toFixed(2)}% (threshold: 5%)</span>
                    </div>
                  )}
                  {hasSlowApi && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>Slow API response: {apiStats?.avgLatency}ms average (threshold: 1000ms)</span>
                    </div>
                  )}
                  {hasLlmIssues && (
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span>LLM reliability issues: {llmSuccessRate.toFixed(1)}% success rate (threshold: 95%)</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Real-Time Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  System Health Status
                </CardTitle>
                <CardDescription>Real-time health indicators for all services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <HealthStatus 
                    label="API Health" 
                    value={apiSuccessRate} 
                    threshold={{ good: 95, warning: 90 }} 
                  />
                  <HealthStatus 
                    label="LLM Health" 
                    value={llmSuccessRate} 
                    threshold={{ good: 95, warning: 90 }} 
                  />
                  <HealthStatus 
                    label="Uptime" 
                    value={100 - errorRate} 
                    threshold={{ good: 99, warning: 95 }} 
                  />
                </div>
              </CardContent>
            </Card>

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
                    <div className="text-2xl font-bold">{apiSuccessRate.toFixed(2)}%</div>
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
                    <div className="text-2xl font-bold">{Math.round(apiStats?.avgLatency || 0)}ms</div>
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
                    <div className="text-2xl font-bold">{errorRate.toFixed(2)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Failed requests
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* API Endpoint Breakdown */}
            {apiEndpoints && apiEndpoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoint Breakdown</CardTitle>
                  <CardDescription>Detailed metrics for each API endpoint</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiEndpoints.map((endpoint: any) => (
                      <div key={endpoint.endpoint} className="flex items-center justify-between border-b border-border/40 pb-3 last:border-0">
                        <div className="flex-1 space-y-1">
                          <p className="font-mono text-sm font-medium">{endpoint.endpoint}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{endpoint.totalCalls} calls</span>
                            <span>•</span>
                            <span>{Math.round(endpoint.avgLatency)}ms avg</span>
                            <span>•</span>
                            <span className={endpoint.errorCount > 0 ? 'text-red-500' : ''}>
                              {endpoint.errorCount} errors
                            </span>
                          </div>
                        </div>
                        <Badge 
                          className={
                            endpoint.successRate >= 95 
                              ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                              : endpoint.successRate >= 90 
                              ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }
                        >
                          {Number(endpoint.successRate).toFixed(1)}% success
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <div className="text-2xl font-bold">{llmSuccessRate.toFixed(2)}%</div>
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
                    <div className="text-2xl font-bold">${Number(llmStats?.totalCost || 0).toFixed(4)}</div>
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
                    <div className="text-2xl font-bold">{Math.round(llmStats?.avgLatency || 0)}ms</div>
                    <p className="text-xs text-muted-foreground">
                      Response time
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* LLM Model Breakdown */}
              {llmStats?.modelBreakdown && llmStats.modelBreakdown.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>LLM Model Breakdown</CardTitle>
                    <CardDescription>Usage statistics by model</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {llmStats.modelBreakdown.map((model: any) => (
                        <div key={model.model} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                          <div className="flex-1">
                            <div className="font-mono text-sm font-medium">{model.model}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {model.count} calls • {Math.round(model.avgLatency)}ms avg • {model.totalTokens.toLocaleString()} tokens
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                              {((model.count / (llmStats.totalCalls || 1)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
