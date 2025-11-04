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
