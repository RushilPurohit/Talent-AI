import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
  boolean,
  longtext,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "recruiter"]).default("recruiter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Jobs table - stores job postings
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description").notNull(),
  requirements: longtext("requirements"),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["draft", "published", "closed"]).default("draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Candidates table - stores candidate information
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  location: varchar("location", { length: 255 }),
  summary: longtext("summary"),
  status: mysqlEnum("status", ["new", "reviewed", "shortlisted", "rejected", "hired"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Resumes table - stores resume files and parsed data
 */
export const resumes = mysqlTable("resumes", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  parsedData: json("parsedData"),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type InsertResume = typeof resumes.$inferInsert;

/**
 * Skills table - stores extracted skills from resumes
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  proficiency: mysqlEnum("proficiency", ["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  yearsOfExperience: decimal("yearsOfExperience", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Experience table - stores work experience
 */
export const experience = mysqlTable("experience", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  description: longtext("description"),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  isCurrent: boolean("isCurrent").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Experience = typeof experience.$inferSelect;
export type InsertExperience = typeof experience.$inferInsert;

/**
 * Education table - stores educational background
 */
export const education = mysqlTable("education", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  degree: varchar("degree", { length: 255 }).notNull(),
  fieldOfStudy: varchar("fieldOfStudy", { length: 255 }),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  grade: varchar("grade", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Education = typeof education.$inferSelect;
export type InsertEducation = typeof education.$inferInsert;

/**
 * Projects table - stores candidate projects
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  technologies: json("technologies"),
  url: varchar("url", { length: 512 }),
  startDate: varchar("startDate", { length: 10 }),
  endDate: varchar("endDate", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Certifications table - stores professional certifications
 */
export const certifications = mysqlTable("certifications", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  issuer: varchar("issuer", { length: 255 }),
  issueDate: varchar("issueDate", { length: 10 }),
  expiryDate: varchar("expiryDate", { length: 10 }),
  credentialUrl: varchar("credentialUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Certification = typeof certifications.$inferSelect;
export type InsertCertification = typeof certifications.$inferInsert;

/**
 * Languages table - stores candidate languages
 */
export const languages = mysqlTable("languages", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  language: varchar("language", { length: 255 }).notNull(),
  proficiency: mysqlEnum("proficiency", ["beginner", "intermediate", "advanced", "fluent", "native"]).default("intermediate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Language = typeof languages.$inferSelect;
export type InsertLanguage = typeof languages.$inferInsert;

/**
 * Rankings table - stores AI ranking results for candidates against jobs
 */
export const rankings = mysqlTable("rankings", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  candidateId: int("candidateId").notNull(),
  overallScore: decimal("overallScore", { precision: 5, scale: 2 }).notNull(),
  skillsScore: decimal("skillsScore", { precision: 5, scale: 2 }),
  experienceScore: decimal("experienceScore", { precision: 5, scale: 2 }),
  projectsScore: decimal("projectsScore", { precision: 5, scale: 2 }),
  educationScore: decimal("educationScore", { precision: 5, scale: 2 }),
  certificationsScore: decimal("certificationsScore", { precision: 5, scale: 2 }),
  activityScore: decimal("activityScore", { precision: 5, scale: 2 }),
  matchedSkills: json("matchedSkills"),
  missingSkills: json("missingSkills"),
  explanation: longtext("explanation"),
  strengths: json("strengths"),
  weaknesses: json("weaknesses"),
  skillGaps: json("skillGaps"),
  interviewQuestions: json("interviewQuestions"),
  rank: int("rank").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ranking = typeof rankings.$inferSelect;
export type InsertRanking = typeof rankings.$inferInsert;

/**
 * Achievements table - stores candidate achievements
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  date: varchar("date", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * Analytics table - stores hiring metrics and statistics
 */
export const analytics = mysqlTable("analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalCandidates: int("totalCandidates").default(0).notNull(),
  totalJobs: int("totalJobs").default(0).notNull(),
  aiMatches: int("aiMatches").default(0).notNull(),
  interviews: int("interviews").default(0).notNull(),
  hiringRate: decimal("hiringRate", { precision: 5, scale: 2 }).default("0"),
  topSkills: json("topSkills"),
  candidateDistribution: json("candidateDistribution"),
  experienceDistribution: json("experienceDistribution"),
  hiringFunnel: json("hiringFunnel"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;

/**
 * Activity table - stores recent activity for the dashboard
 */
export const activity = mysqlTable("activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  activityType: varchar("activityType", { length: 100 }).notNull(),
  description: text("description"),
  candidateId: int("candidateId"),
  jobId: int("jobId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activity.$inferSelect;
export type InsertActivity = typeof activity.$inferInsert;
