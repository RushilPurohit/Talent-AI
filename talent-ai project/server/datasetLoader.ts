import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface CandidateSkill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  endorsements: number;
  duration_months?: number;
}

export interface CareerHistoryEntry {
  company: string;
  title: string;
  start_date: string;
  end_date: string | null;
  duration_months: number;
  is_current: boolean;
  industry: string;
  company_size: string;
  description: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year: number;
  grade?: string | null;
  tier?: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  year: number;
}

export interface LanguageEntry {
  language: string;
  proficiency: "basic" | "conversational" | "professional" | "native";
}

export interface RedrobSignals {
  profile_completeness_score: number;
  signup_date: string;
  last_active_date: string;
  open_to_work_flag: boolean;
  profile_views_received_30d: number;
  applications_submitted_30d: number;
  recruiter_response_rate: number;
  avg_response_time_hours: number;
  skill_assessment_scores: Record<string, number>;
  connection_count: number;
  endorsements_received: number;
  notice_period_days: number;
  expected_salary_range_inr_lpa: { min: number; max: number };
  preferred_work_mode: "remote" | "hybrid" | "onsite" | "flexible";
  willing_to_relocate: boolean;
  github_activity_score: number;
  search_appearance_30d: number;
  saved_by_recruiters_30d: number;
  interview_completion_rate: number;
  offer_acceptance_rate: number;
  verified_email: boolean;
  verified_phone: boolean;
  linkedin_connected: boolean;
}

export interface DatasetCandidate {
  candidate_id: string;
  profile: {
    anonymized_name: string;
    headline: string;
    summary: string;
    location: string;
    country: string;
    years_of_experience: number;
    current_title: string;
    current_company: string;
    current_company_size: string;
    current_industry: string;
  };
  career_history: CareerHistoryEntry[];
  education: EducationEntry[];
  skills: CandidateSkill[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  redrob_signals: RedrobSignals;
}

let _candidates: DatasetCandidate[] | null = null;

const DATASET_SUBPATH = path.join(
  "Dataset",
  "[PUB] India_runs_data_and_ai_challenge (1)",
  "[PUB] India_runs_data_and_ai_challenge",
  "India_runs_data_and_ai_challenge",
  "sample_candidates.json"
);

function resolveDatasetPath(): string {
  // Build candidate paths without using __dirname (not available in ESM)
  const roots: string[] = [
    process.cwd(),
    path.resolve(process.cwd(), ".."),
    // Handles running from dist/ subfolder
    path.resolve(process.cwd(), "..", ".."),
  ];

  // If import.meta is available (ESM), also try relative to this file
  try {
    const fileDir = path.dirname(fileURLToPath(import.meta.url));
    roots.unshift(path.resolve(fileDir, ".."));
    roots.unshift(path.resolve(fileDir, "..", ".."));
  } catch {
    // Not in ESM context or import.meta.url unavailable — skip
  }

  for (const root of roots) {
    const candidate = path.join(root, DATASET_SUBPATH);
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `sample_candidates.json not found. Searched roots:\n${roots.map(r => path.join(r, DATASET_SUBPATH)).join("\n")}`
  );
}

export function loadDataset(): DatasetCandidate[] {
  if (_candidates) return _candidates;

  try {
    const filePath = resolveDatasetPath();
    const raw = fs.readFileSync(filePath, "utf-8");
    _candidates = JSON.parse(raw) as DatasetCandidate[];
    console.log(`[Dataset] Loaded ${_candidates.length} candidates from ${filePath}`);
  } catch (err) {
    console.warn("[Dataset] Failed to load sample_candidates.json:", err);
    _candidates = [];
  }

  return _candidates;
}

export function getDatasetCandidates(): DatasetCandidate[] {
  return loadDataset();
}

export interface DatasetStats {
  totalCandidates: number;
  openToWork: number;
  avgProfileCompleteness: number;
  avgYearsExperience: number;
  topSkills: Array<{ skill: string; count: number }>;
  experienceLevels: Array<{ name: string; value: number }>;
  workModeDistribution: Array<{ name: string; value: number; fill: string }>;
  locationDistribution: Array<{ name: string; value: number }>;
  industryDistribution: Array<{ name: string; value: number }>;
  scoreDistribution: Array<{ name: string; value: number; fill: string }>;
  avgSalaryMin: number;
  avgSalaryMax: number;
  verifiedEmailPct: number;
  linkedinConnectedPct: number;
  willingToRelocatePct: number;
}

export function computeDatasetStats(): DatasetStats {
  const candidates = loadDataset();
  const total = candidates.length;

  if (total === 0) {
    return {
      totalCandidates: 0,
      openToWork: 0,
      avgProfileCompleteness: 0,
      avgYearsExperience: 0,
      topSkills: [],
      experienceLevels: [],
      workModeDistribution: [],
      locationDistribution: [],
      industryDistribution: [],
      scoreDistribution: [],
      avgSalaryMin: 0,
      avgSalaryMax: 0,
      verifiedEmailPct: 0,
      linkedinConnectedPct: 0,
      willingToRelocatePct: 0,
    };
  }

  // Open to work
  const openToWork = candidates.filter(
    (c) => c.redrob_signals.open_to_work_flag
  ).length;

  // Average profile completeness
  const avgProfileCompleteness =
    candidates.reduce(
      (sum, c) => sum + c.redrob_signals.profile_completeness_score,
      0
    ) / total;

  // Average years of experience
  const avgYearsExperience =
    candidates.reduce((sum, c) => sum + c.profile.years_of_experience, 0) /
    total;

  // Top skills by frequency
  const skillCount: Record<string, number> = {};
  for (const c of candidates) {
    for (const s of c.skills) {
      skillCount[s.name] = (skillCount[s.name] || 0) + 1;
    }
  }
  const topSkills = Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));

  // Experience level distribution
  const expBuckets = { Junior: 0, "Mid-Level": 0, Senior: 0, Lead: 0 };
  for (const c of candidates) {
    const yoe = c.profile.years_of_experience;
    if (yoe < 3) expBuckets["Junior"]++;
    else if (yoe < 7) expBuckets["Mid-Level"]++;
    else if (yoe < 12) expBuckets["Senior"]++;
    else expBuckets["Lead"]++;
  }
  const experienceLevels = Object.entries(expBuckets).map(([name, value]) => ({
    name,
    value,
  }));

  // Work mode distribution
  const workModeCounts: Record<string, number> = {};
  for (const c of candidates) {
    const mode = c.redrob_signals.preferred_work_mode;
    workModeCounts[mode] = (workModeCounts[mode] || 0) + 1;
  }
  const workModeColors: Record<string, string> = {
    remote: "#3b82f6",
    hybrid: "#8b5cf6",
    onsite: "#10b981",
    flexible: "#f59e0b",
  };
  const workModeDistribution = Object.entries(workModeCounts).map(
    ([name, value]) => ({ name, value, fill: workModeColors[name] || "#64748b" })
  );

  // Location distribution (top 8)
  const locationCount: Record<string, number> = {};
  for (const c of candidates) {
    const loc = c.profile.location;
    locationCount[loc] = (locationCount[loc] || 0) + 1;
  }
  const locationDistribution = Object.entries(locationCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Industry distribution (top 8)
  const industryCount: Record<string, number> = {};
  for (const c of candidates) {
    const ind = c.profile.current_industry;
    industryCount[ind] = (industryCount[ind] || 0) + 1;
  }
  const industryDistribution = Object.entries(industryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  // Profile completeness score distribution
  let s90 = 0, s80 = 0, s70 = 0, sBelow70 = 0;
  for (const c of candidates) {
    const score = c.redrob_signals.profile_completeness_score;
    if (score >= 90) s90++;
    else if (score >= 80) s80++;
    else if (score >= 70) s70++;
    else sBelow70++;
  }
  const scoreDistribution = [
    { name: "90-100", value: s90, fill: "#10b981" },
    { name: "80-89", value: s80, fill: "#3b82f6" },
    { name: "70-79", value: s70, fill: "#f59e0b" },
    { name: "Below 70", value: sBelow70, fill: "#ef4444" },
  ];

  // Average salary
  const avgSalaryMin =
    candidates.reduce(
      (sum, c) => sum + c.redrob_signals.expected_salary_range_inr_lpa.min,
      0
    ) / total;
  const avgSalaryMax =
    candidates.reduce(
      (sum, c) => sum + c.redrob_signals.expected_salary_range_inr_lpa.max,
      0
    ) / total;

  // Verified email %
  const verifiedEmailPct =
    (candidates.filter((c) => c.redrob_signals.verified_email).length / total) *
    100;

  // LinkedIn connected %
  const linkedinConnectedPct =
    (candidates.filter((c) => c.redrob_signals.linkedin_connected).length /
      total) *
    100;

  // Willing to relocate %
  const willingToRelocatePct =
    (candidates.filter((c) => c.redrob_signals.willing_to_relocate).length /
      total) *
    100;

  return {
    totalCandidates: total,
    openToWork,
    avgProfileCompleteness: Math.round(avgProfileCompleteness * 10) / 10,
    avgYearsExperience: Math.round(avgYearsExperience * 10) / 10,
    topSkills,
    experienceLevels,
    workModeDistribution,
    locationDistribution,
    industryDistribution,
    scoreDistribution,
    avgSalaryMin: Math.round(avgSalaryMin * 10) / 10,
    avgSalaryMax: Math.round(avgSalaryMax * 10) / 10,
    verifiedEmailPct: Math.round(verifiedEmailPct),
    linkedinConnectedPct: Math.round(linkedinConnectedPct),
    willingToRelocatePct: Math.round(willingToRelocatePct),
  };
}

export function addDatasetCandidate(candidate: DatasetCandidate): void {
  const all = loadDataset();
  // Check if candidate already exists
  if (all.some(c => c.candidate_id === candidate.candidate_id)) {
    return;
  }
  all.unshift(candidate); // Add to the beginning of the list
  console.log(`[Dataset] Added new candidate ${candidate.profile.anonymized_name} (Total: ${all.length})`);
}

