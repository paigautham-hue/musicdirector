import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, albums, tracks, trackAssets, ratings, 
  platformConstraints, knowledgeUpdates, moderationFlags, auditLogs, featureFlags,
  systemSettings, musicJobs, audioFiles, payments, creditTransactions,
  type Album, type Track, type TrackAsset, type Rating, type PlatformConstraint,
  type KnowledgeUpdate, type ModerationFlag, type AuditLog, type FeatureFlag,
  type SystemSetting, type MusicJob, type AudioFile, type Payment, type CreditTransaction,
  type InsertAlbum, type InsertTrack, type InsertTrackAsset, type InsertRating,
  type InsertPlatformConstraint, type InsertKnowledgeUpdate, type InsertModerationFlag,
  type InsertAuditLog, type InsertFeatureFlag, type InsertSystemSetting, type InsertMusicJob,
  type InsertAudioFile, type InsertPayment, type InsertCreditTransaction
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
