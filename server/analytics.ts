import { getDb } from "./db";
import { apiUsageLogs, llmUsageLogs, healthMetrics, type InsertApiUsageLog, type InsertLlmUsageLog, type InsertHealthMetric } from "../drizzle/schema";

/**
 * Track API usage for analytics
 */
export async function trackApiUsage(data: Omit<InsertApiUsageLog, "id" | "timestamp">) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(apiUsageLogs).values(data);
  } catch (error) {
    console.error("[Analytics] Failed to track API usage:", error);
  }
}

/**
 * Track LLM usage for analytics
 */
export async function trackLlmUsage(data: Omit<InsertLlmUsageLog, "id" | "timestamp">) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(llmUsageLogs).values(data);
  } catch (error) {
    console.error("[Analytics] Failed to track LLM usage:", error);
  }
}

/**
 * Record platform health metric
 */
export async function recordHealthMetric(data: Omit<InsertHealthMetric, "id" | "timestamp">) {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(healthMetrics).values(data);
  } catch (error) {
    console.error("[Analytics] Failed to record health metric:", error);
  }
}

/**
 * Wrapper for LLM calls with automatic tracking
 */
export async function trackLlmCall<T>(
  model: string,
  operation: string,
  userId: number | undefined,
  fn: () => Promise<{ result: T; usage: { promptTokens: number; completionTokens: number; totalTokens: number } }>
): Promise<T> {
  const startTime = Date.now();
  let success = false;
  let errorMessage: string | undefined;
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  
  try {
    const { result, usage: llmUsage } = await fn();
    usage = llmUsage;
    success = true;
    return result;
  } catch (error: any) {
    errorMessage = error.message || "Unknown error";
    throw error;
  } finally {
    const latencyMs = Date.now() - startTime;
    
    // Calculate cost (rough estimates, adjust based on actual pricing)
    const costPerToken: Record<string, number> = {
      "openai": 0.00003, // GPT-4 Turbo average
      "anthropic": 0.000015, // Claude 3 Sonnet
      "google": 0.0000025, // Gemini Pro
    };
    
    const modelKey = model.toLowerCase().includes("gpt") ? "openai" 
      : model.toLowerCase().includes("claude") ? "anthropic"
      : "google";
    
    const costUsd = ((usage.totalTokens * (costPerToken[modelKey] || 0.00001))).toFixed(6);
    
    await trackLlmUsage({
      model,
      operation,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      costUsd,
      latencyMs,
      success,
      errorMessage,
      userId,
    });
  }
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(timeRange: "hour" | "day" | "week" | "month" = "day") {
  const db = await getDb();
  if (!db) return null;
  
  const timeRangeHours: Record<string, number> = {
    hour: 1,
    day: 24,
    week: 168,
    month: 720,
  };
  
  const hoursAgo = timeRangeHours[timeRange];
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  const logs = await db.select().from(apiUsageLogs)
    .where(sql`${apiUsageLogs.timestamp} >= ${since}`)
    .orderBy(desc(apiUsageLogs.timestamp));
  
  const totalRequests = logs.length;
  const successfulRequests = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300).length;
  const failedRequests = totalRequests - successfulRequests;
  const avgLatency = logs.reduce((sum, l) => sum + l.latencyMs, 0) / (totalRequests || 1);
  
  // Group by endpoint
  const byEndpoint: Record<string, { count: number; avgLatency: number; errors: number }> = {};
  logs.forEach(log => {
    if (!byEndpoint[log.endpoint]) {
      byEndpoint[log.endpoint] = { count: 0, avgLatency: 0, errors: 0 };
    }
    byEndpoint[log.endpoint].count++;
    byEndpoint[log.endpoint].avgLatency += log.latencyMs;
    if (log.statusCode >= 400) byEndpoint[log.endpoint].errors++;
  });
  
  Object.keys(byEndpoint).forEach(endpoint => {
    byEndpoint[endpoint].avgLatency /= byEndpoint[endpoint].count;
  });
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate: ((successfulRequests / (totalRequests || 1)) * 100).toFixed(2),
    avgLatency: Math.round(avgLatency),
    byEndpoint,
  };
}

/**
 * Get LLM usage statistics
 */
export async function getLlmUsageStats(timeRange: "hour" | "day" | "week" | "month" = "day") {
  const db = await getDb();
  if (!db) return null;
  
  const timeRangeHours: Record<string, number> = {
    hour: 1,
    day: 24,
    week: 168,
    month: 720,
  };
  
  const hoursAgo = timeRangeHours[timeRange];
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  const logs = await db.select().from(llmUsageLogs)
    .where(sql`${llmUsageLogs.timestamp} >= ${since}`)
    .orderBy(desc(llmUsageLogs.timestamp));
  
  const totalCalls = logs.length;
  const successfulCalls = logs.filter(l => l.success).length;
  const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);
  const totalCost = logs.reduce((sum, l) => sum + parseFloat(l.costUsd), 0);
  const avgLatency = logs.reduce((sum, l) => sum + l.latencyMs, 0) / (totalCalls || 1);
  
  // Group by model
  const byModel: Record<string, {
    calls: number;
    successRate: number;
    avgLatency: number;
    totalTokens: number;
    totalCost: number;
    errors: number;
  }> = {};
  
  logs.forEach(log => {
    if (!byModel[log.model]) {
      byModel[log.model] = {
        calls: 0,
        successRate: 0,
        avgLatency: 0,
        totalTokens: 0,
        totalCost: 0,
        errors: 0,
      };
    }
    byModel[log.model].calls++;
    byModel[log.model].avgLatency += log.latencyMs;
    byModel[log.model].totalTokens += log.totalTokens;
    byModel[log.model].totalCost += parseFloat(log.costUsd);
    if (!log.success) byModel[log.model].errors++;
  });
  
  Object.keys(byModel).forEach(model => {
    const stats = byModel[model];
    stats.avgLatency = Math.round(stats.avgLatency / stats.calls);
    stats.successRate = parseFloat((((stats.calls - stats.errors) / stats.calls) * 100).toFixed(2));
  });
  
  return {
    totalCalls,
    successfulCalls,
    successRate: ((successfulCalls / (totalCalls || 1)) * 100).toFixed(2),
    totalTokens,
    totalCost: totalCost.toFixed(4),
    avgLatency: Math.round(avgLatency),
    byModel,
  };
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  const db = await getDb();
  if (!db) return null;
  
  const { users, albums } = await import("../drizzle/schema");
  
  const allUsers = await db.select().from(users);
  const totalUsers = allUsers.length;
  const adminUsers = allUsers.filter(u => u.role === "admin").length;
  
  // Active users (signed in within last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeUsers = allUsers.filter(u => u.lastSignedIn >= sevenDaysAgo).length;
  
  // New signups (created within last 7 days)
  const newSignups = allUsers.filter(u => u.createdAt >= sevenDaysAgo).length;
  
  // Album statistics
  const allAlbums = await db.select().from(albums);
  const totalAlbums = allAlbums.length;
  const publicAlbums = allAlbums.filter(a => a.visibility === "public").length;
  
  // Albums created in last 7 days
  const recentAlbums = allAlbums.filter(a => a.createdAt >= sevenDaysAgo).length;
  
  return {
    totalUsers,
    adminUsers,
    activeUsers,
    newSignups,
    totalAlbums,
    publicAlbums,
    recentAlbums,
  };
}

import { sql, desc } from "drizzle-orm";
