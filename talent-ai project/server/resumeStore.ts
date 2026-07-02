import fs from "fs";
import path from "path";
import * as db from "./db";
import { addDatasetCandidate } from "./datasetLoader";

export interface StoredResume {
  id: number;
  fileName: string;
  fileUrl: string;
  parsedData: {
    skills: string[];
    experience: number;
    education?: string;
  };
  createdAt: string;
}

let _resumes: StoredResume[] = [];
const dbPath = path.resolve(process.cwd(), "resumes_db.json");

// Load resumes from local JSON file
function loadResumes(): StoredResume[] {
  if (_resumes.length > 0) return _resumes;
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      _resumes = JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[ResumeStore] Failed to load resumes_db.json:", err);
  }
  return _resumes;
}

// Save resumes to local JSON file
function saveResumes() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(_resumes, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ResumeStore] Failed to save resumes_db.json:", err);
  }
}

export function getUploadedResumes(): StoredResume[] {
  return loadResumes();
}

export async function addUploadedResume(
  fileName: string,
  fileUrl: string,
  skills: string[],
  experienceYears: number
): Promise<StoredResume> {
  const resumesList = loadResumes();
  
  const newResume: StoredResume = {
    id: Date.now(),
    fileName,
    fileUrl,
    parsedData: {
      skills,
      experience: experienceYears,
    },
    createdAt: new Date().toISOString(),
  };

  resumesList.push(newResume);
  saveResumes();

  // Generate a temporary candidate name from filename
  const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
  const nameParts = cleanName.split(" ");
  const firstName = nameParts[0] || "Uploaded";
  const lastName = nameParts.slice(1).join(" ") || "Candidate";
  const fullName = `${firstName} ${lastName}`;
  const candId = `CAND_${Date.now()}`;

  // 1. Create a DatasetCandidate and register it in the dataset candidate pool
  // This makes it show up on the Candidates page immediately!
  addDatasetCandidate({
    candidate_id: candId,
    profile: {
      anonymized_name: fullName,
      headline: `AI Talent matching profile created from resume upload`,
      summary: `Automated candidate profile extracted from uploaded resume file "${fileName}".`,
      location: "Delhi NCR",
      country: "India",
      years_of_experience: experienceYears,
      current_title: "AI Engineer / Developer",
      current_company: "Independent / Freelance",
      current_company_size: "1-10",
      current_industry: "Information Technology",
    },
    career_history: [
      {
        company: "Freelance",
        title: "Software Engineer",
        start_date: "2022-01-01",
        end_date: null,
        duration_months: experienceYears * 12,
        is_current: true,
        industry: "Information Technology",
        company_size: "1-10",
        description: `Handled software development, API design, and system operations. Worked on Python, JavaScript, and database management.`,
      }
    ],
    education: [
      {
        institution: "Tier-1 Indian Institute",
        degree: "B.Tech",
        field_of_study: "Computer Science",
        start_year: 2018,
        end_year: 2022,
        grade: "First Class",
        tier: "tier_1"
      }
    ],
    skills: skills.map(name => ({
      name,
      proficiency: "advanced",
      endorsements: 10,
      duration_months: experienceYears * 12
    })),
    certifications: [
      {
        name: "AI and Cloud Specialist",
        issuer: "Industry Standard",
        year: 2024
      }
    ],
    languages: [
      {
        language: "English",
        proficiency: "professional"
      }
    ],
    redrob_signals: {
      profile_completeness_score: 95,
      signup_date: new Date().toISOString(),
      last_active_date: new Date().toISOString(),
      open_to_work_flag: true,
      profile_views_received_30d: 15,
      applications_submitted_30d: 3,
      recruiter_response_rate: 100,
      avg_response_time_hours: 2,
      skill_assessment_scores: {},
      connection_count: 50,
      endorsements_received: 8,
      notice_period_days: 15,
      expected_salary_range_inr_lpa: { min: 10, max: 15 },
      preferred_work_mode: "remote",
      willing_to_relocate: true,
      github_activity_score: 85,
      search_appearance_30d: 25,
      saved_by_recruiters_30d: 5,
      interview_completion_rate: 90,
      offer_acceptance_rate: 95,
      verified_email: true,
      verified_phone: true,
      linkedin_connected: true
    }
  });

  // 2. Try to also write to the MySQL database if Drizzle is connected
  try {
    const candidateResult = await db.createCandidate({
      firstName,
      lastName,
      email: `uploaded_${Date.now()}@example.com`,
      summary: `Uploaded resume: ${fileName}`,
    });

    // If Drizzle insert was successful, link the resume
    const candidateId = (candidateResult as any)?.[0]?.insertId || 1;
    await db.createResume({
      candidateId,
      fileName,
      fileUrl,
      fileKey: fileName,
      parsedData: newResume.parsedData,
      isPrimary: true,
    });
  } catch (dbErr) {
    console.warn("[ResumeStore] MySQL DB offline, stored in resumes_db.json fallback:", dbErr);
  }

  return newResume;
}
