import { eq, desc, and, or, like, sql, inArray, avg, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, albums, tracks, trackAssets, ratings, 
  platformConstraints, knowledgeUpdates, moderationFlags, auditLogs, featureFlags,
  systemSettings, musicJobs, audioFiles, payments, creditTransactions, promptTemplates,
  comments, likes, follows, apiUsageLogs, llmUsageLogs, playlists, playlistTracks, playlistRatings,
  type Album, type Track, type TrackAsset, type Rating, type PlatformConstraint,
  type KnowledgeUpdate, type ModerationFlag, type AuditLog, type FeatureFlag,
  type SystemSetting, type MusicJob, type AudioFile, type Payment, type CreditTransaction,
  type PromptTemplate, type InsertApiUsageLog, type InsertLlmUsageLog, type Playlist,
  type PlaylistTrack, type InsertPlaylist, type InsertPlaylistTrack,
  type InsertAlbum, type InsertTrack, type InsertTrackAsset, type InsertRating, type InsertPlaylistRating,
  type InsertPlatformConstraint, type InsertKnowledgeUpdate, type InsertModerationFlag,
  type InsertAuditLog, type InsertFeatureFlag, type InsertSystemSetting, type InsertMusicJob,
  type InsertAudioFile, type InsertPayment, type InsertCreditTransaction, type InsertPromptTemplate
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, updates: { avatarUrl?: string | null; bio?: string | null }) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, unknown> = {};
  if (updates.avatarUrl !== undefined) {
    updateData.avatarUrl = updates.avatarUrl;
  }
  if (updates.bio !== undefined) {
    updateData.bio = updates.bio;
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

// Album operations
export async function createAlbum(album: InsertAlbum): Promise<Album> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(albums).values(album);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(albums).where(eq(albums.id, insertedId)).limit(1);
  return created[0];
}

export async function getAlbumById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(albums).where(eq(albums.id, id)).limit(1);
  return result[0];
}

export async function getUserAlbums(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(albums)
    .where(eq(albums.userId, userId))
    .orderBy(desc(albums.createdAt))
    .limit(limit);
}

export async function updateAlbum(id: number, updates: Partial<InsertAlbum>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(albums).set(updates).where(eq(albums.id, id));
}

export async function deleteAlbum(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete related tracks and assets first
  const albumTracks = await db.select().from(tracks).where(eq(tracks.albumId, id));
  for (const track of albumTracks) {
    await db.delete(trackAssets).where(eq(trackAssets.trackId, track.id));
  }
  await db.delete(tracks).where(eq(tracks.albumId, id));
  await db.delete(ratings).where(eq(ratings.albumId, id));
  await db.delete(albums).where(eq(albums.id, id));
}

// Track operations
export async function createTrack(track: InsertTrack): Promise<Track> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tracks).values(track);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(tracks).where(eq(tracks.id, insertedId)).limit(1);
  return created[0];
}

export async function getAlbumTracks(albumId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tracks)
    .where(eq(tracks.albumId, albumId))
    .orderBy(tracks.index);
}

export async function getTrackById(trackId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(tracks).where(eq(tracks.id, trackId)).limit(1);
  return result[0];
}

export async function updateTrack(id: number, updates: Partial<InsertTrack>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(tracks).set(updates).where(eq(tracks.id, id));
}

// Track asset operations
export async function createTrackAsset(asset: InsertTrackAsset): Promise<TrackAsset> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trackAssets).values(asset);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(trackAssets).where(eq(trackAssets.id, insertedId)).limit(1);
  return created[0];
}

export async function getTrackAssets(trackId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(trackAssets).where(eq(trackAssets.trackId, trackId));
}

export async function getTrackAssetsByType(trackId: number, type: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(trackAssets)
    .where(and(
      eq(trackAssets.trackId, trackId),
      eq(trackAssets.type, type as any)
    ));
}

// Rating operations
export async function createRating(rating: InsertRating): Promise<Rating> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(ratings).values(rating);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(ratings).where(eq(ratings.id, insertedId)).limit(1);
  return created[0];
}

export async function getAlbumRatings(albumId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(ratings).where(eq(ratings.albumId, albumId));
}

export async function getTrackRating(trackId: number, userId: number): Promise<Rating | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(ratings)
    .where(and(eq(ratings.trackId, trackId), eq(ratings.userId, userId)))
    .limit(1);
  
  return result[0];
}

export async function upsertTrackRating(trackId: number, userId: number, ratingValue: number): Promise<Rating> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if rating exists
  const existing = await getTrackRating(trackId, userId);
  
  if (existing) {
    // Update existing rating
    await db.update(ratings)
      .set({ rating: ratingValue })
      .where(eq(ratings.id, existing.id));
    
    const updated = await db.select().from(ratings).where(eq(ratings.id, existing.id)).limit(1);
    return updated[0];
  } else {
    // Create new rating
    return createRating({
      userId,
      trackId,
      rating: ratingValue
    });
  }
}

export async function getTrackRatings(trackId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(ratings).where(eq(ratings.trackId, trackId));
}

// Platform constraints operations
export async function getPlatformConstraints(platform: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(platformConstraints).where(eq(platformConstraints.platform, platform));
}

export async function upsertPlatformConstraint(constraint: InsertPlatformConstraint) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(platformConstraints).values(constraint).onDuplicateKeyUpdate({
    set: {
      maxChars: constraint.maxChars,
      notes: constraint.notes,
      sourceUrl: constraint.sourceUrl,
      bestPractices: constraint.bestPractices
    }
  });
}

// Knowledge updates operations
export async function getLatestKnowledgeUpdate() {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(knowledgeUpdates)
    .where(eq(knowledgeUpdates.status, "published"))
    .orderBy(desc(knowledgeUpdates.weekStart))
    .limit(1);
  
  return result[0];
}

export async function createKnowledgeUpdate(update: InsertKnowledgeUpdate): Promise<KnowledgeUpdate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(knowledgeUpdates).values(update);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(knowledgeUpdates).where(eq(knowledgeUpdates.id, insertedId)).limit(1);
  return created[0];
}

export async function updateKnowledgeUpdate(id: number, updates: Partial<InsertKnowledgeUpdate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(knowledgeUpdates).set(updates).where(eq(knowledgeUpdates.id, id));
}

export async function getDraftKnowledgeUpdates() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(knowledgeUpdates)
    .where(eq(knowledgeUpdates.status, "draft"))
    .orderBy(desc(knowledgeUpdates.weekStart));
}

// Audit log operations
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(auditLogs).values(log);
}

// Feature flags operations
export async function getFeatureFlag(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(featureFlags).where(eq(featureFlags.name, name)).limit(1);
  return result[0];
}

export async function getAllFeatureFlags() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(featureFlags);
}

export async function upsertFeatureFlag(flag: InsertFeatureFlag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(featureFlags).values(flag).onDuplicateKeyUpdate({
    set: {
      enabled: flag.enabled,
      description: flag.description
    }
  });
}

// Admin analytics
export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalAlbums] = await db.select({ count: sql<number>`count(*)` }).from(albums);
  const [totalTracks] = await db.select({ count: sql<number>`count(*)` }).from(tracks);
  
  const platformStats = await db.select({
    platform: albums.platform,
    count: sql<number>`count(*)`
  }).from(albums).groupBy(albums.platform);
  
  return {
    totalUsers: totalUsers.count,
    totalAlbums: totalAlbums.count,
    totalTracks: totalTracks.count,
    platformStats
  };
}

// System settings operations
export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0];
}

export async function getAllSystemSettings() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(systemSettings);
}

export async function upsertSystemSetting(setting: InsertSystemSetting) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(systemSettings).values(setting).onDuplicateKeyUpdate({
    set: {
      value: setting.value,
      description: setting.description,
      updatedBy: setting.updatedBy,
      updatedAt: new Date()
    }
  });
}

// Music jobs operations
export async function getMusicJobs(params: { status?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  if (params.status) {
    return db.select().from(musicJobs)
      .where(eq(musicJobs.status, params.status as any))
      .orderBy(desc(musicJobs.createdAt))
      .limit(params.limit || 50);
  }
  
  return db.select().from(musicJobs)
    .orderBy(desc(musicJobs.createdAt))
    .limit(params.limit || 50);
}

export async function getAudioFiles(trackId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(audioFiles).where(and(eq(audioFiles.trackId, trackId), eq(audioFiles.isActive, true)));
}

export async function getTrackAudioFile(trackId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const files = await db.select().from(audioFiles)
    .where(and(eq(audioFiles.trackId, trackId), eq(audioFiles.isActive, true)))
    .limit(1);
  return files[0];
}

// User management operations
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserQuota(userId: number, quota: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users)
    .set({ musicGenerationQuota: quota })
    .where(eq(users.id, userId));
}

export async function checkUserQuota(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  
  // Admin has unlimited quota
  if (user.role === "admin") return true;
  
  // Check if user has quota remaining
  return (user.musicGenerationsUsed || 0) < (user.musicGenerationQuota || 1);
}

export async function incrementMusicGenerations(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(users)
    .set({ musicGenerationsUsed: sql`${users.musicGenerationsUsed} + 1` })
    .where(eq(users.id, userId));
}

export async function getPublicAlbums(params: { search?: string; sortBy?: "recent" | "popular"; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  
  // Build where conditions
  const conditions = [eq(albums.visibility, "public")];
  
  if (params.search) {
    conditions.push(
      or(
        like(albums.title, `%${params.search}%`),
        like(albums.theme, `%${params.search}%`),
        like(albums.description, `%${params.search}%`)
      ) as any
    );
  }
  
  // Build and execute query
  const orderByClause = params.sortBy === "popular" ? desc(albums.score) : desc(albums.createdAt);
  
  return db.select({
    id: albums.id,
    title: albums.title,
    description: albums.description,
    theme: albums.theme,
    coverUrl: albums.coverUrl,
    platform: albums.platform,
    trackCount: albums.trackCount,
    score: albums.score,
    createdAt: albums.createdAt,
    creatorName: users.name
  })
  .from(albums)
  .leftJoin(users, eq(albums.userId, users.id))
  .where(and(...conditions))
  .orderBy(orderByClause)
  .limit(params.limit || 50);
}


// Payment operations
export async function createPayment(payment: InsertPayment): Promise<Payment> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payments).values(payment);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(payments).where(eq(payments.id, insertedId)).limit(1);
  return created[0];
}

export async function getPaymentBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.stripeSessionId, sessionId)).limit(1);
  return result[0];
}

export async function getPaymentByPaymentIntentId(paymentIntentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(payments).where(eq(payments.stripePaymentIntentId, paymentIntentId)).limit(1);
  return result[0];
}

export async function updatePaymentBySessionId(sessionId: string, updates: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(updates).where(eq(payments.stripeSessionId, sessionId));
}

export async function updatePayment(id: number, updates: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payments).set(updates).where(eq(payments.id, id));
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

// Credit transaction operations
export async function createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(creditTransactions).values(transaction);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(creditTransactions).where(eq(creditTransactions.id, insertedId)).limit(1);
  return created[0];
}

export async function getUserCreditTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

// Prompt template operations
export async function createPromptTemplate(template: InsertPromptTemplate): Promise<PromptTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(promptTemplates).values(template);
  const insertedId = Number(result[0].insertId);
  const created = await db.select().from(promptTemplates).where(eq(promptTemplates.id, insertedId)).limit(1);
  return created[0];
}

export async function getUserPromptTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(promptTemplates)
    .where(eq(promptTemplates.userId, userId))
    .orderBy(desc(promptTemplates.updatedAt));
}

export async function getPromptTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(promptTemplates).where(eq(promptTemplates.id, id)).limit(1);
  return result[0];
}

export async function updatePromptTemplate(id: number, updates: Partial<InsertPromptTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(promptTemplates).set(updates).where(eq(promptTemplates.id, id));
}

export async function deletePromptTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(promptTemplates).where(eq(promptTemplates.id, id));
}

// Music job operations
export async function createMusicJob(job: { albumId: number; trackId: number; platform: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(musicJobs).values({
    albumId: job.albumId,
    trackId: job.trackId,
    platform: job.platform,
    status: "pending",
    progress: 0,
    retryCount: 0,
  });
  
  return Number(result[0].insertId);
}

export async function getTracksByAlbumId(albumId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(tracks).where(eq(tracks.albumId, albumId));
}

export async function getMusicJobsByAlbumId(albumId: number): Promise<MusicJob[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(musicJobs).where(eq(musicJobs.albumId, albumId));
}

export async function getAudioFilesByAlbumId(albumId: number): Promise<AudioFile[]> {
  const db = await getDb();
  if (!db) return [];
  
  const albumTracks = await getTracksByAlbumId(albumId);
  if (albumTracks.length === 0) return [];
  
  const trackIds = albumTracks.map(t => t.id);
  return db.select().from(audioFiles).where(inArray(audioFiles.trackId, trackIds));
}


// ============================================================================
// SOCIAL FEATURES - Gallery, Comments, Likes, Follows
// ============================================================================

/**
 * Get public albums with optional filters and pagination
 */
export async function getPublicAlbumsWithFilters(params: {
  search?: string;
  platform?: string;
  sortBy?: "newest" | "trending" | "top_rated" | "most_played";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const { search, platform, sortBy = "newest", limit = 20, offset = 0 } = params;

  let conditions = [eq(albums.visibility, "public")];

  // Apply search filter
  if (search) {
    conditions.push(
      or(
        like(albums.title, `%${search}%`),
        like(albums.theme, `%${search}%`)
      ) as any
    );
  }

  // Apply platform filter
  if (platform) {
    conditions.push(eq(albums.platform, platform));
  }

  let query = db
    .select({
      id: albums.id,
      userId: albums.userId,
      title: albums.title,
      theme: albums.theme,
      platform: albums.platform,
      description: albums.description,
      coverUrl: albums.coverUrl,
      score: albums.score,
      vibe: albums.vibe,
      language: albums.language,
      trackCount: albums.trackCount,
      visibility: albums.visibility,
      playCount: albums.playCount,
      viewCount: albums.viewCount,
      createdAt: albums.createdAt,
      updatedAt: albums.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(albums)
    .leftJoin(users, eq(albums.userId, users.id))
    .where(and(...conditions));

  // Apply sorting and execute query
  let results;
  switch (sortBy) {
    case "newest":
      results = await query.orderBy(desc(albums.createdAt)).limit(limit).offset(offset);
      break;
    case "trending":
      results = await query.orderBy(desc(sql`${albums.playCount} + ${albums.viewCount}`)).limit(limit).offset(offset);
      break;
    case "top_rated":
      results = await query.orderBy(desc(albums.score)).limit(limit).offset(offset);
      break;
    case "most_played":
      results = await query.orderBy(desc(albums.playCount)).limit(limit).offset(offset);
      break;
    default:
      results = await query.orderBy(desc(albums.createdAt)).limit(limit).offset(offset);
  }
  return results;
}

/**
 * Get album details with social stats
 */
export async function getAlbumWithSocialStats(albumId: number, userId?: number) {
  const db = await getDb();
  if (!db) return null;

  const album = await getAlbumById(albumId);
  if (!album) return null;

  const user = await db.select().from(users).where(eq(users.id, album.userId)).limit(1);
  
  const ratingStats = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${ratings.rating}), 0)`,
      ratingCount: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eq(ratings.albumId, albumId));

  const likeCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(likes)
    .where(eq(likes.albumId, albumId));

  let userRating = null;
  let userLiked = false;

  if (userId) {
    const userRatingResult = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.albumId, albumId)))
      .limit(1);
    userRating = userRatingResult[0]?.rating || null;

    const userLikeResult = await db
      .select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.albumId, albumId)))
      .limit(1);
    userLiked = userLikeResult.length > 0;
  }

  return {
    album,
    user: user[0],
    avgRating: Number(ratingStats[0]?.avgRating || 0),
    ratingCount: Number(ratingStats[0]?.ratingCount || 0),
    likeCount: Number(likeCount[0]?.count || 0),
    userRating,
    userLiked,
  };
}

/**
 * Increment album view count
 */
export async function incrementAlbumViews(albumId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(albums)
    .set({ viewCount: sql`${albums.viewCount} + 1` })
    .where(eq(albums.id, albumId));
}

/**
 * Increment album play count
 */
export async function incrementAlbumPlays(albumId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(albums)
    .set({ playCount: sql`${albums.playCount} + 1` })
    .where(eq(albums.id, albumId));
}

/**
 * Add comment to album
 */
export async function addAlbumComment(data: { userId: number; albumId: number; content: string }) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(comments).values(data);
  return Number(result[0].insertId);
}

/**
 * Get comments for album
 */
export async function getAlbumComments(albumId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      albumId: comments.albumId,
      content: comments.content,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.albumId, albumId))
    .orderBy(desc(comments.createdAt));

  return result;
}

/**
 * Toggle like on album
 */
export async function toggleAlbumLike(userId: number, albumId: number) {
  const db = await getDb();
  if (!db) return { liked: false };

  // Check if already liked
  const existing = await db
    .select()
    .from(likes)
    .where(and(eq(likes.userId, userId), eq(likes.albumId, albumId)))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.albumId, albumId)));
    return { liked: false };
  } else {
    // Like
    await db.insert(likes).values({ userId, albumId });
    return { liked: true };
  }
}

/**
 * Follow/unfollow user
 */
export async function toggleUserFollow(followerId: number, followingId: number) {
  const db = await getDb();
  if (!db) return { following: false };

  if (followerId === followingId) {
    throw new Error("Cannot follow yourself");
  }

  // Check if already following
  const existing = await db
    .select()
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);

  if (existing.length > 0) {
    // Unfollow
    await db.delete(follows).where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return { following: false };
  } else {
    // Follow
    await db.insert(follows).values({ followerId, followingId });
    return { following: true };
  }
}

/**
 * Get user profile with stats
 */
export async function getUserProfileWithStats(userId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0]) return null;

  const publicAlbumCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(albums)
    .where(and(eq(albums.userId, userId), eq(albums.visibility, "public")));
  
  const followerCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followingId, userId));
  
  const followingCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followerId, userId));

  // Get total likes across all user's albums
  const totalLikes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(likes)
    .leftJoin(albums, eq(likes.albumId, albums.id))
    .where(and(eq(albums.userId, userId), eq(albums.visibility, "public")));

  // Get total views and plays
  const albumStats = await db
    .select({
      totalViews: sql<number>`SUM(${albums.viewCount})`,
      totalPlays: sql<number>`SUM(${albums.playCount})`,
      avgScore: sql<number>`AVG(${albums.score})`,
    })
    .from(albums)
    .where(and(eq(albums.userId, userId), eq(albums.visibility, "public")));

  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    const followResult = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, userId)))
      .limit(1);
    isFollowing = followResult.length > 0;
  }

  return {
    user: user[0],
    albumCount: Number(publicAlbumCount[0]?.count || 0),
    followerCount: Number(followerCount[0]?.count || 0),
    followingCount: Number(followingCount[0]?.count || 0),
    totalLikes: Number(totalLikes[0]?.count || 0),
    totalViews: Number(albumStats[0]?.totalViews || 0),
    totalPlays: Number(albumStats[0]?.totalPlays || 0),
    avgRating: Number(albumStats[0]?.avgScore || 0),
    isFollowing,
  };
}

/**
 * Get public prompts with pagination
 */
export async function getPublicPromptsWithUsers(params: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 20, offset = 0 } = params;

  const result = await db
    .select({
      id: promptTemplates.id,
      userId: promptTemplates.userId,
      name: promptTemplates.name,
      theme: promptTemplates.theme,
      vibe: promptTemplates.vibe,
      platform: promptTemplates.platform,
      language: promptTemplates.language,
      audience: promptTemplates.audience,
      influences: promptTemplates.influences,
      trackCount: promptTemplates.trackCount,
      visibility: promptTemplates.visibility,
      usageCount: promptTemplates.usageCount,
      createdAt: promptTemplates.createdAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(promptTemplates)
    .leftJoin(users, eq(promptTemplates.userId, users.id))
    .where(eq(promptTemplates.visibility, "public"))
    .orderBy(desc(promptTemplates.usageCount), desc(promptTemplates.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Increment prompt usage count
 */
export async function incrementPromptUsageCount(promptId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(promptTemplates)
    .set({ usageCount: sql`${promptTemplates.usageCount} + 1` })
    .where(eq(promptTemplates.id, promptId));
}

/**
 * Get leaderboard data
 */
export async function getLeaderboardData(type: "albums" | "creators", limit = 10) {
  const db = await getDb();
  if (!db) return [];

  if (type === "albums") {
    // Top rated public albums
    const result = await db
      .select({
        albumId: albums.id,
        albumTitle: albums.title,
        albumCover: albums.coverUrl,
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
        playCount: albums.playCount,
        viewCount: albums.viewCount,
        score: albums.score,
      })
      .from(albums)
      .leftJoin(users, eq(albums.userId, users.id))
      .where(eq(albums.visibility, "public"))
      .orderBy(desc(albums.score), desc(albums.playCount))
      .limit(limit);

    return result;
  } else {
    // Top creators by public album count and plays
    const result = await db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
        userBio: users.bio,
        albumCount: sql<number>`COUNT(DISTINCT ${albums.id})`,
        totalPlays: sql<number>`SUM(${albums.playCount})`,
        totalViews: sql<number>`SUM(${albums.viewCount})`,
      })
      .from(users)
      .leftJoin(albums, and(eq(albums.userId, users.id), eq(albums.visibility, "public")))
      .groupBy(users.id, users.name, users.avatarUrl, users.bio)
      .having(sql`COUNT(DISTINCT ${albums.id}) > 0`)
      .orderBy(desc(sql`SUM(${albums.playCount})`), desc(sql`COUNT(DISTINCT ${albums.id})`))
      .limit(limit);

    return result;
  }
}

// ============================================================================
// API Usage Tracking
// ============================================================================

export async function logApiUsage(params: {
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  latency: number;
  userId?: number;
  errorMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(apiUsageLogs).values({
      endpoint: params.endpoint,
      method: params.method,
      statusCode: params.status === 'success' ? 200 : 500,
      latencyMs: params.latency,
      userId: params.userId,
      errorMessage: params.errorMessage
    });
  } catch (error) {
    console.error('[DB] Failed to log API usage:', error);
  }
}

export async function logLlmUsage(params: InsertLlmUsageLog) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(llmUsageLogs).values(params);
  } catch (error) {
    console.error('[DB] Failed to log LLM usage:', error);
  }
}

export async function getApiUsageStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startTime = new Date();
  
  switch (timeRange) {
    case 'hour':
      startTime.setHours(now.getHours() - 1);
      break;
    case 'day':
      startTime.setDate(now.getDate() - 1);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
  }

  const stats = await db
    .select({
      totalRequests: sql<number>`COUNT(*)`,
      successfulRequests: sql<number>`SUM(CASE WHEN ${apiUsageLogs.statusCode} = 200 THEN 1 ELSE 0 END)`,
      failedRequests: sql<number>`SUM(CASE WHEN ${apiUsageLogs.statusCode} != 200 THEN 1 ELSE 0 END)`,
      avgLatency: sql<number>`AVG(${apiUsageLogs.latencyMs})`,
      maxLatency: sql<number>`MAX(${apiUsageLogs.latencyMs})`,
      minLatency: sql<number>`MIN(${apiUsageLogs.latencyMs})`
    })
    .from(apiUsageLogs)
    .where(sql`${apiUsageLogs.timestamp} >= ${startTime}`);

  return stats[0];
}

export async function getApiEndpointBreakdown(timeRange: 'hour' | 'day' | 'week' = 'day') {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const startTime = new Date();
  
  switch (timeRange) {
    case 'hour':
      startTime.setHours(now.getHours() - 1);
      break;
    case 'day':
      startTime.setDate(now.getDate() - 1);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
  }

  const breakdown = await db
    .select({
      endpoint: apiUsageLogs.endpoint,
      totalCalls: sql<number>`COUNT(*)`,
      successRate: sql<number>`(SUM(CASE WHEN ${apiUsageLogs.statusCode} = 200 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))`,
      avgLatency: sql<number>`AVG(${apiUsageLogs.latencyMs})`,
      errorCount: sql<number>`SUM(CASE WHEN ${apiUsageLogs.statusCode} != 200 THEN 1 ELSE 0 END)`
    })
    .from(apiUsageLogs)
    .where(sql`${apiUsageLogs.timestamp} >= ${startTime}`)
    .groupBy(apiUsageLogs.endpoint)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(20);

  return breakdown;
}

export async function getLlmUsageStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const startTime = new Date();
  
  switch (timeRange) {
    case 'hour':
      startTime.setHours(now.getHours() - 1);
      break;
    case 'day':
      startTime.setDate(now.getDate() - 1);
      break;
    case 'week':
      startTime.setDate(now.getDate() - 7);
      break;
  }

  const stats = await db
    .select({
      totalCalls: sql<number>`COUNT(*)`,
      successfulCalls: sql<number>`SUM(CASE WHEN ${llmUsageLogs.success} = 1 THEN 1 ELSE 0 END)`,
      failedCalls: sql<number>`SUM(CASE WHEN ${llmUsageLogs.success} = 0 THEN 1 ELSE 0 END)`,
      totalTokens: sql<number>`SUM(${llmUsageLogs.totalTokens})`,
      totalCost: sql<number>`SUM(CAST(${llmUsageLogs.costUsd} AS DECIMAL(10,4)))`,
      avgLatency: sql<number>`AVG(${llmUsageLogs.latencyMs})`
    })
    .from(llmUsageLogs)
    .where(sql`${llmUsageLogs.timestamp} >= ${startTime}`);

  // Get per-model breakdown
  const modelBreakdown = await db
    .select({
      model: llmUsageLogs.model,
      count: sql<number>`COUNT(*)`,
      avgLatency: sql<number>`AVG(${llmUsageLogs.latencyMs})`,
      totalTokens: sql<number>`SUM(${llmUsageLogs.totalTokens})`
    })
    .from(llmUsageLogs)
    .where(sql`${llmUsageLogs.timestamp} >= ${startTime}`)
    .groupBy(llmUsageLogs.model)
    .orderBy(sql`COUNT(*) DESC`);

  return {
    ...stats[0],
    modelBreakdown
  };
}

// ============================================================================
// Playlist Management
// ============================================================================

/**
 * Create a new playlist
 */
export async function createPlaylist(data: InsertPlaylist) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(playlists).values(data);
  return result[0].insertId;
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      coverImage: playlists.coverImage,
      visibility: playlists.visibility,
      playCount: playlists.playCount,
      likeCount: playlists.likeCount,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      trackCount: sql<number>`COUNT(${playlistTracks.id})`,
    })
    .from(playlists)
    .leftJoin(playlistTracks, eq(playlists.id, playlistTracks.playlistId))
    .where(eq(playlists.userId, userId))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.updatedAt));

  return result;
}

/**
 * Get public playlists with pagination
 */
export async function getPublicPlaylists(params: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return [];

  const { limit = 20, offset = 0 } = params;

  const result = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      coverImage: playlists.coverImage,
      visibility: playlists.visibility,
      playCount: playlists.playCount,
      likeCount: playlists.likeCount,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
      trackCount: sql<number>`COUNT(DISTINCT ${playlistTracks.id})`,
      averageRating: sql<number>`COALESCE(AVG(${playlistRatings.rating}), 0)`,
      ratingCount: sql<number>`COUNT(DISTINCT ${playlistRatings.id})`,
    })
    .from(playlists)
    .leftJoin(users, eq(playlists.userId, users.id))
    .leftJoin(playlistTracks, eq(playlists.id, playlistTracks.playlistId))
    .leftJoin(playlistRatings, eq(playlists.id, playlistRatings.playlistId))
    .where(eq(playlists.visibility, "public"))
    .groupBy(playlists.id)
    .orderBy(desc(playlists.playCount), desc(playlists.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Get playlist by ID with tracks
 */
export async function getPlaylistWithTracks(playlistId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return null;

  // Get playlist details
  const playlistResult = await db
    .select({
      id: playlists.id,
      userId: playlists.userId,
      name: playlists.name,
      description: playlists.description,
      coverImage: playlists.coverImage,
      visibility: playlists.visibility,
      playCount: playlists.playCount,
      likeCount: playlists.likeCount,
      createdAt: playlists.createdAt,
      updatedAt: playlists.updatedAt,
      userName: users.name,
      userAvatar: users.avatarUrl,
    })
    .from(playlists)
    .leftJoin(users, eq(playlists.userId, users.id))
    .where(eq(playlists.id, playlistId))
    .limit(1);

  if (!playlistResult[0]) return null;

  const playlist = playlistResult[0];

  // Check if viewer can access this playlist
  if (playlist.visibility === "private" && (!viewerId || viewerId !== playlist.userId)) {
    return null;
  }

  // Get tracks in playlist
  const tracksResult = await db
    .select({
      playlistTrackId: playlistTracks.id,
      position: playlistTracks.position,
      addedAt: playlistTracks.addedAt,
      trackId: tracks.id,
      trackTitle: tracks.title,
      trackIndex: tracks.index,
      albumId: albums.id,
      albumTitle: albums.title,
      albumCover: albums.coverUrl,
      audioUrl: audioFiles.fileUrl,
      duration: audioFiles.duration,
    })
    .from(playlistTracks)
    .leftJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(audioFiles, and(eq(audioFiles.trackId, tracks.id), eq(audioFiles.isActive, true)))
    .where(eq(playlistTracks.playlistId, playlistId))
    .orderBy(playlistTracks.position);

  return {
    ...playlist,
    tracks: tracksResult,
  };
}

/**
 * Update playlist
 */
export async function updatePlaylist(playlistId: number, userId: number, data: Partial<InsertPlaylist>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(playlists)
    .set(data)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
}

/**
 * Delete playlist
 */
export async function deletePlaylist(playlistId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete playlist tracks first
  await db.delete(playlistTracks).where(eq(playlistTracks.playlistId, playlistId));

  // Delete playlist
  await db.delete(playlists).where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(playlistId: number, trackId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify playlist ownership
  const playlistResult = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1);

  if (!playlistResult[0]) {
    throw new Error("Playlist not found or access denied");
  }

  // Check if track already exists in playlist
  const existing = await db
    .select()
    .from(playlistTracks)
    .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Track already in playlist");
  }

  // Get next position
  const maxPositionResult = await db
    .select({ maxPosition: sql<number>`MAX(${playlistTracks.position})` })
    .from(playlistTracks)
    .where(eq(playlistTracks.playlistId, playlistId));

  const nextPosition = (maxPositionResult[0]?.maxPosition ?? -1) + 1;

  // Add track
  await db.insert(playlistTracks).values({
    playlistId,
    trackId,
    position: nextPosition,
  });

  // Update playlist updatedAt
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(playlistTrackId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get playlist track to verify ownership
  const playlistTrackResult = await db
    .select({
      playlistId: playlistTracks.playlistId,
      position: playlistTracks.position,
    })
    .from(playlistTracks)
    .leftJoin(playlists, eq(playlistTracks.playlistId, playlists.id))
    .where(and(eq(playlistTracks.id, playlistTrackId), eq(playlists.userId, userId)))
    .limit(1);

  if (!playlistTrackResult[0]) {
    throw new Error("Playlist track not found or access denied");
  }

  const { playlistId, position } = playlistTrackResult[0];

  // Delete track
  await db.delete(playlistTracks).where(eq(playlistTracks.id, playlistTrackId));

  // Reorder remaining tracks
  await db
    .update(playlistTracks)
    .set({ position: sql`${playlistTracks.position} - 1` })
    .where(and(eq(playlistTracks.playlistId, playlistId), sql`${playlistTracks.position} > ${position}`));

  // Update playlist updatedAt
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
}

/**
 * Reorder tracks in playlist
 */
export async function reorderPlaylistTracks(playlistId: number, userId: number, trackOrder: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify playlist ownership
  const playlistResult = await db
    .select()
    .from(playlists)
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)))
    .limit(1);

  if (!playlistResult[0]) {
    throw new Error("Playlist not found or access denied");
  }

  // Update positions
  for (let i = 0; i < trackOrder.length; i++) {
    await db
      .update(playlistTracks)
      .set({ position: i })
      .where(eq(playlistTracks.id, trackOrder[i]));
  }

  // Update playlist updatedAt
  await db.update(playlists).set({ updatedAt: new Date() }).where(eq(playlists.id, playlistId));
}

/**
 * Increment playlist play count
 */
export async function incrementPlaylistPlayCount(playlistId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(playlists)
    .set({ playCount: sql`${playlists.playCount} + 1` })
    .where(eq(playlists.id, playlistId));
}


// ============================================================================
// PLAYLIST RATINGS
// ============================================================================

/**
 * Rate a playlist (create or update rating)
 */
export async function ratePlaylist(userId: number, playlistId: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already rated this playlist
  const existing = await db
    .select()
    .from(playlistRatings)
    .where(and(eq(playlistRatings.userId, userId), eq(playlistRatings.playlistId, playlistId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing rating
    await db
      .update(playlistRatings)
      .set({ rating, updatedAt: new Date() })
      .where(eq(playlistRatings.id, existing[0].id));
  } else {
    // Create new rating
    await db.insert(playlistRatings).values({
      userId,
      playlistId,
      rating,
    });
  }
}

/**
 * Get user's rating for a playlist
 */
export async function getUserPlaylistRating(userId: number, playlistId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(playlistRatings)
    .where(and(eq(playlistRatings.userId, userId), eq(playlistRatings.playlistId, playlistId)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get average rating and count for a playlist
 */
export async function getPlaylistRatingStats(playlistId: number) {
  const db = await getDb();
  if (!db) return { averageRating: 0, ratingCount: 0 };

  const result = await db
    .select({
      averageRating: avg(playlistRatings.rating),
      ratingCount: count(playlistRatings.id),
    })
    .from(playlistRatings)
    .where(eq(playlistRatings.playlistId, playlistId));

  return {
    averageRating: result[0]?.averageRating ? Number(result[0].averageRating) : 0,
    ratingCount: result[0]?.ratingCount ? Number(result[0].ratingCount) : 0,
  };
}

/**
 * Delete a rating
 */
export async function deletePlaylistRating(userId: number, playlistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(playlistRatings)
    .where(and(eq(playlistRatings.userId, userId), eq(playlistRatings.playlistId, playlistId)));
}
