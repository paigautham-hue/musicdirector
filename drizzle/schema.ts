import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: varchar("plan", { length: 64 }).default("free").notNull(),
  musicGenerationQuota: int("musicGenerationQuota").default(1).notNull(), // How many albums with music they can generate
  musicGenerationsUsed: int("musicGenerationsUsed").default(0).notNull(), // How many they've used
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Albums created by users
 */
export const albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  theme: text("theme").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(), // suno, udio, elevenlabs, mubert, stable_audio
  description: text("description"),
  coverUrl: text("coverUrl"),
  coverPrompt: text("coverPrompt"),
  score: int("score"), // 0-100 hit potential score
  vibe: text("vibe"), // JSON array of vibes/genres
  language: varchar("language", { length: 64 }).default("en"),
  audience: text("audience"),
  influences: text("influences"), // JSON array of artist/era descriptions
  trackCount: int("trackCount").default(10).notNull(),
  visibility: mysqlEnum("visibility", ["private", "public"]).default("private").notNull(),
  playCount: int("playCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  platformIdx: index("platform_idx").on(table.platform),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Album = typeof albums.$inferSelect;
export type InsertAlbum = typeof albums.$inferInsert;

/**
 * Individual tracks within albums
 */
export const tracks = mysqlTable("tracks", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull(),
  index: int("index").notNull(), // Track order in album
  title: varchar("title", { length: 255 }).notNull(),
  tempoBpm: varchar("tempoBpm", { length: 64 }), // e.g., "120-130"
  key: varchar("key", { length: 32 }), // e.g., "C major"
  moodTags: text("moodTags"), // JSON array
  score: int("score"), // 0-100 hit potential score
  scoreBreakdown: text("scoreBreakdown"), // JSON with dimension scores
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  albumIdIdx: index("albumId_idx").on(table.albumId),
}));

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;

/**
 * Assets associated with tracks (prompts, lyrics, artwork, etc.)
 */
export const trackAssets = mysqlTable("trackAssets", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  type: mysqlEnum("type", [
    "prompt",
    "lyrics",
    "art_prompt",
    "art_url",
    "preview_url",
    "platform_payload",
    "structure",
    "production_notes",
    "alternate_1",
    "alternate_2"
  ]).notNull(),
  content: text("content").notNull(), // Can be JSON or plain text
  variant: varchar("variant", { length: 64 }), // e.g., "more_cinematic", "more_minimal"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  trackIdIdx: index("trackId_idx").on(table.trackId),
  typeIdx: index("type_idx").on(table.type),
}));

export type TrackAsset = typeof trackAssets.$inferSelect;
export type InsertTrackAsset = typeof trackAssets.$inferInsert;

/**
 * User ratings for albums and tracks
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  albumId: int("albumId"),
  trackId: int("trackId"),
  rating: int("rating").notNull(), // 1-5 stars
  review: text("review"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  albumIdIdx: index("albumId_idx").on(table.albumId),
  trackIdIdx: index("trackId_idx").on(table.trackId),
}));

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Platform-specific constraints and limits
 */
export const platformConstraints = mysqlTable("platformConstraints", {
  id: int("id").autoincrement().primaryKey(),
  platform: varchar("platform", { length: 64 }).notNull(),
  field: varchar("field", { length: 64 }).notNull(), // e.g., "prompt", "lyrics", "title"
  maxChars: int("maxChars"),
  notes: text("notes"),
  sourceUrl: text("sourceUrl"),
  bestPractices: text("bestPractices"), // JSON array of tips
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  platformIdx: index("platform_idx").on(table.platform),
}));

export type PlatformConstraint = typeof platformConstraints.$inferSelect;
export type InsertPlatformConstraint = typeof platformConstraints.$inferInsert;

/**
 * Weekly knowledge hub updates
 */
export const knowledgeUpdates = mysqlTable("knowledgeUpdates", {
  id: int("id").autoincrement().primaryKey(),
  weekStart: timestamp("weekStart").notNull(),
  contentMd: text("contentMd").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  sources: text("sources"), // JSON array of source URLs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  weekStartIdx: index("weekStart_idx").on(table.weekStart),
  statusIdx: index("status_idx").on(table.status),
}));

export type KnowledgeUpdate = typeof knowledgeUpdates.$inferSelect;
export type InsertKnowledgeUpdate = typeof knowledgeUpdates.$inferInsert;

/**
 * Content moderation flags
 */
export const moderationFlags = mysqlTable("moderationFlags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  objectType: varchar("objectType", { length: 64 }).notNull(), // album, track, etc.
  objectId: int("objectId").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  objectTypeIdx: index("objectType_idx").on(table.objectType),
}));

export type ModerationFlag = typeof moderationFlags.$inferSelect;
export type InsertModerationFlag = typeof moderationFlags.$inferInsert;

/**
 * Audit logs for important actions
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 128 }).notNull(),
  payload: text("payload"), // JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Feature flags for gradual rollout
 */
export const featureFlags = mysqlTable("featureFlags", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

/**
 * Music generation jobs for async processing
 */
export const musicJobs = mysqlTable("musicJobs", {
  id: int("id").autoincrement().primaryKey(),
  albumId: int("albumId").notNull(),
  trackId: int("trackId"),
  platform: varchar("platform", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0), // 0-100
  statusMessage: text("statusMessage"),
  platformJobId: varchar("platformJobId", { length: 255 }), // External API job ID
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  albumIdIdx: index("albumId_idx").on(table.albumId),
  statusIdx: index("status_idx").on(table.status),
  platformJobIdIdx: index("platformJobId_idx").on(table.platformJobId),
}));

export type MusicJob = typeof musicJobs.$inferSelect;
export type InsertMusicJob = typeof musicJobs.$inferInsert;

/**
 * Generated audio files
 */
export const audioFiles = mysqlTable("audioFiles", {
  id: int("id").autoincrement().primaryKey(),
  trackId: int("trackId").notNull(),
  jobId: int("jobId"),
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 512 }).notNull(), // S3 key
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize"), // bytes
  duration: int("duration"), // seconds
  format: varchar("format", { length: 32 }), // mp3, wav, etc.
  waveformData: text("waveformData"), // JSON array of amplitude values
  isActive: boolean("isActive").default(true).notNull(), // For managing multiple versions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  trackIdIdx: index("trackId_idx").on(table.trackId),
  jobIdIdx: index("jobId_idx").on(table.jobId),
}));

export type AudioFile = typeof audioFiles.$inferSelect;
export type InsertAudioFile = typeof audioFiles.$inferInsert;

/**
 * System settings for admin configuration
 */
export const systemSettings = mysqlTable("systemSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(), // JSON or plain text
  description: text("description"),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

/**
 * API usage tracking for analytics
 */
export const apiUsageLogs = mysqlTable("apiUsageLogs", {
  id: int("id").autoincrement().primaryKey(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("statusCode").notNull(),
  latencyMs: int("latencyMs").notNull(),
  userId: int("userId"),
  errorMessage: text("errorMessage"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  endpointIdx: index("endpoint_idx").on(table.endpoint),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  userIdIdx: index("userId_idx").on(table.userId),
}));

export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = typeof apiUsageLogs.$inferInsert;

/**
 * LLM performance tracking
 */
export const llmUsageLogs = mysqlTable("llmUsageLogs", {
  id: int("id").autoincrement().primaryKey(),
  model: varchar("model", { length: 64 }).notNull(), // openai, anthropic, google
  operation: varchar("operation", { length: 128 }).notNull(), // album_generation, track_improvement, etc
  promptTokens: int("promptTokens").notNull(),
  completionTokens: int("completionTokens").notNull(),
  totalTokens: int("totalTokens").notNull(),
  costUsd: varchar("costUsd", { length: 20 }).notNull(), // Stored as string to preserve precision
  latencyMs: int("latencyMs").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  userId: int("userId"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  modelIdx: index("model_idx").on(table.model),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
  operationIdx: index("operation_idx").on(table.operation),
}));

export type LlmUsageLog = typeof llmUsageLogs.$inferSelect;
export type InsertLlmUsageLog = typeof llmUsageLogs.$inferInsert;

/**
 * Platform health metrics
 */
export const healthMetrics = mysqlTable("healthMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricName: varchar("metricName", { length: 128 }).notNull(),
  metricValue: varchar("metricValue", { length: 255 }).notNull(),
  metricType: varchar("metricType", { length: 64 }).notNull(), // counter, gauge, histogram
  tags: text("tags"), // JSON object for additional metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  metricNameIdx: index("metricName_idx").on(table.metricName),
  timestampIdx: index("timestamp_idx").on(table.timestamp),
}));

export type HealthMetric = typeof healthMetrics.$inferSelect;
export type InsertHealthMetric = typeof healthMetrics.$inferInsert;

/**
 * Payment transactions
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  amount: int("amount").notNull(), // Amount in cents
  currency: varchar("currency", { length: 3 }).default("usd").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  productId: varchar("productId", { length: 64 }).notNull(), // Reference to product in products.ts
  creditsGranted: int("creditsGranted").notNull(), // Number of credits granted
  customerEmail: varchar("customerEmail", { length: 320 }),
  customerName: text("customerName"),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Credit transaction history
 */
export const creditTransactions = mysqlTable("creditTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: int("amount").notNull(), // Positive for credit, negative for debit
  type: mysqlEnum("type", ["purchase", "usage", "refund", "admin_adjustment"]).notNull(),
  description: text("description").notNull(),
  paymentId: int("paymentId"), // Reference to payments table
  albumId: int("albumId"), // Reference to album if used for generation
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  typeIdx: index("type_idx").on(table.type),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
