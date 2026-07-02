import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, candidates, jobs, activity, analytics, resumes, skills, experience, education } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function createCandidate(data: { firstName: string; lastName: string; email: string; phone?: string; location?: string; summary?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(candidates).values(data);
  return result;
}

export async function getCandidates(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(candidates).limit(limit).offset(offset);
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateCandidateStatus(id: number, status: 'new' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(candidates).set({ status, updatedAt: new Date() }).where(eq(candidates.id, id));
}

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(analytics).where(eq(analytics.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getRecentActivity(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(activity).where(eq(activity.userId, userId)).limit(limit);
}

export async function getUserJobs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(jobs).where(eq(jobs.userId, userId));
}

export async function createJob(data: { userId: number; title: string; description: string; requirements?: string; location?: string; status?: 'draft' | 'published' | 'closed' }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(jobs).values(data);
}

export async function getJobById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateJob(id: number, data: Partial<{ title: string; description: string; requirements?: string; location?: string; status: 'draft' | 'published' | 'closed' }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(jobs).set({ ...data, updatedAt: new Date() }).where(eq(jobs.id, id));
}

export async function deleteJob(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.delete(jobs).where(eq(jobs.id, id));
}

export async function createResume(data: { candidateId: number; fileName: string; fileUrl: string; fileKey: string; parsedData?: any; isPrimary?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(resumes).values(data);
}

export async function getResumesByCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(resumes).where(eq(resumes.candidateId, candidateId));
}

export async function createSkills(data: Array<{ candidateId: number; skillName: string; proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert'; yearsOfExperience?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(skills).values(data);
}

export async function createExperience(data: Array<{ candidateId: number; company: string; position: string; description?: string; startDate?: string; endDate?: string; isCurrent?: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(experience).values(data);
}

export async function createEducation(data: Array<{ candidateId: number; institution: string; degree: string; fieldOfStudy?: string; startDate?: string; endDate?: string; grade?: string }>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(education).values(data);
}

// TODO: add feature queries here as your schema grows.
