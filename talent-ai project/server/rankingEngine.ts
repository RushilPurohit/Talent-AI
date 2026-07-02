import { invokeLLM } from "./_core/llm";

/**
 * Weighted Scoring Model:
 * - Skills: 40%
 * - Experience: 25%
 * - Projects: 15%
 * - Education: 10%
 * - Certifications: 5%
 * - Activity: 5%
 */

interface CandidateProfile {
  skills: Array<{ name?: string; skillName?: string; proficiency: string; yearsOfExperience?: string }>;
  experience: Array<{ company: string; position: string; description?: string }>;
  education: Array<{ institution: string; degree: string; fieldOfStudy?: string }>;
  projects?: Array<{ title: string; description: string }>;
  certifications?: Array<{ name: string; issuer: string }>;
  languages?: Array<{ language: string; proficiency: string }>;
}

interface JobRequirements {
  title: string;
  description: string;
  requirements: string;
}

interface RankingResult {
  candidateId: number;
  jobId: number;
  overallScore: number;
  skillsScore: number;
  experienceScore: number;
  projectsScore: number;
  educationScore: number;
  certificationsScore: number;
  activityScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
}

/**
 * Calculate semantic similarity between candidate profile and job requirements
 */
export async function calculateSemanticMatch(
  candidate: CandidateProfile,
  job: JobRequirements
): Promise<RankingResult> {
  // Extract job requirements using LLM
  const jobAnalysis = await analyzeJobRequirements(job);

  // Calculate individual component scores
  const skillsScore = calculateSkillsScore(candidate.skills, jobAnalysis.requiredSkills);
  const experienceScore = calculateExperienceScore(candidate.experience, jobAnalysis.experienceLevel);
  const projectsScore = calculateProjectsScore(candidate.projects, jobAnalysis.projectTypes);
  const educationScore = calculateEducationScore(candidate.education, jobAnalysis.educationRequirements);
  const certificationsScore = calculateCertificationsScore(candidate.certifications, jobAnalysis.requiredCertifications);
  const activityScore = calculateActivityScore(candidate);

  // Calculate weighted overall score
  const overallScore =
    skillsScore * 0.4 +
    experienceScore * 0.25 +
    projectsScore * 0.15 +
    educationScore * 0.1 +
    certificationsScore * 0.05 +
    activityScore * 0.05;

  // Generate explanation using LLM
  const explanation = await generateMatchExplanation(
    candidate,
    job,
    {
      skillsScore,
      experienceScore,
      projectsScore,
      educationScore,
      certificationsScore,
      activityScore,
      overallScore,
    }
  );

  return {
    candidateId: 0,
    jobId: 0,
    overallScore: Math.round(overallScore * 100) / 100,
    skillsScore: Math.round(skillsScore * 100) / 100,
    experienceScore: Math.round(experienceScore * 100) / 100,
    projectsScore: Math.round(projectsScore * 100) / 100,
    educationScore: Math.round(educationScore * 100) / 100,
    certificationsScore: Math.round(certificationsScore * 100) / 100,
    activityScore: Math.round(activityScore * 100) / 100,
    matchedSkills: extractMatchedSkills(candidate.skills, jobAnalysis.requiredSkills),
    missingSkills: extractMissingSkills(candidate.skills, jobAnalysis.requiredSkills),
    strengths: extractStrengths(candidate, jobAnalysis),
    weaknesses: extractWeaknesses(candidate, jobAnalysis),
    explanation: explanation,
  };
}

/**
 * Analyze job requirements using LLM
 */
async function analyzeJobRequirements(job: JobRequirements) {
  const prompt = `Analyze this job posting and extract key requirements:

Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements}

Please extract and return a JSON object with:
- requiredSkills: array of required technical skills
- experienceLevel: years of experience required (number)
- projectTypes: types of projects/work experience needed
- educationRequirements: education level required
- requiredCertifications: array of required certifications
- keyResponsibilities: array of main responsibilities`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a recruitment analyst. Extract job requirements and return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "job_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              requiredSkills: {
                type: "array",
                items: { type: "string" },
              },
              experienceLevel: { type: "number" },
              projectTypes: {
                type: "array",
                items: { type: "string" },
              },
              educationRequirements: { type: "string" },
              requiredCertifications: {
                type: "array",
                items: { type: "string" },
              },
              keyResponsibilities: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: [
              "requiredSkills",
              "experienceLevel",
              "projectTypes",
              "educationRequirements",
              "requiredCertifications",
              "keyResponsibilities",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      return JSON.parse(content);
    }
    return content;
  } catch (error) {
    console.error("Error analyzing job requirements:", error);
    return {
      requiredSkills: [],
      experienceLevel: 0,
      projectTypes: [],
      educationRequirements: "Bachelor's degree",
      requiredCertifications: [],
      keyResponsibilities: [],
    };
  }
}

/**
 * Calculate skills match score (0-100)
 */
function calculateSkillsScore(candidateSkills: CandidateProfile["skills"], requiredSkills: string[]): number {
  if (requiredSkills.length === 0) return 100;

  const candidateSkillNames = candidateSkills.map(s => (s.name || s.skillName || "").toLowerCase());
  const matched = requiredSkills.filter(skill =>
    candidateSkillNames.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
  ).length;

  return (matched / requiredSkills.length) * 100;
}

/**
 * Calculate experience match score (0-100)
 */
function calculateExperienceScore(candidateExperience: CandidateProfile["experience"], requiredYears: number): number {
  const totalYears = candidateExperience.length > 0 ? candidateExperience.length * 2 : 0;
  return Math.min((totalYears / Math.max(requiredYears, 1)) * 100, 100);
}

/**
 * Calculate projects match score (0-100)
 */
function calculateProjectsScore(candidateProjects: CandidateProfile["projects"], projectTypes: string[]): number {
  if (projectTypes.length === 0 || (candidateProjects?.length || 0) === 0) return 50;
  return Math.min(((candidateProjects?.length || 0) / projectTypes.length) * 100, 100);
}

/**
 * Calculate education match score (0-100)
 */
function calculateEducationScore(
  candidateEducation: CandidateProfile["education"],
  educationRequirements: string
): number {
  if (candidateEducation.length === 0) return 30;
  
  const hasRelevantDegree = candidateEducation.some(edu =>
    edu.degree.toLowerCase().includes("bachelor") ||
    edu.degree.toLowerCase().includes("master") ||
    edu.degree.toLowerCase().includes("phd")
  );

  return hasRelevantDegree ? 100 : 60;
}

/**
 * Calculate certifications match score (0-100)
 */
function calculateCertificationsScore(
  candidateCertifications: CandidateProfile["certifications"],
  requiredCertifications: string[]
): number {
  if (requiredCertifications.length === 0) return 100;
  if ((candidateCertifications?.length || 0) === 0) return 20;

  const matched = requiredCertifications.filter(cert =>
    (candidateCertifications || []).some(cc =>
      cc.name.toLowerCase().includes(cert.toLowerCase()) ||
      cert.toLowerCase().includes(cc.name.toLowerCase())
    )
  ).length;

  return (matched / requiredCertifications.length) * 100;
}

/**
 * Calculate activity score based on recency (0-100)
 */
function calculateActivityScore(candidate: CandidateProfile): number {
  // Score based on presence of recent projects and current employment
  const hasRecentActivity = candidate.experience.length > 0 || (candidate.projects?.length || 0) > 0;
  return hasRecentActivity ? 80 : 50;
}

/**
 * Extract matched skills
 */
function extractMatchedSkills(candidateSkills: CandidateProfile["skills"], requiredSkills: string[]): string[] {
  const candidateSkillNames = candidateSkills.map(s => (s.name || s.skillName || "").toLowerCase());
  return requiredSkills.filter(skill =>
    candidateSkillNames.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
  );
}

/**
 * Extract missing skills
 */
function extractMissingSkills(candidateSkills: CandidateProfile["skills"], requiredSkills: string[]): string[] {
  const candidateSkillNames = candidateSkills.map(s => (s.name || s.skillName || "").toLowerCase());
  return requiredSkills.filter(skill =>
    !candidateSkillNames.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
  );
}

/**
 * Extract candidate strengths
 */
function extractStrengths(candidate: CandidateProfile, jobAnalysis: any): string[] {
  const strengths: string[] = [];

  if (candidate.experience.length > 3) {
    strengths.push("Extensive work experience");
  }

  if (candidate.skills.length > 5) {
    strengths.push("Diverse skill set");
  }

  if ((candidate.projects?.length || 0) > 0) {
    strengths.push("Proven project delivery experience");
  }

  if ((candidate.certifications?.length || 0) > 0) {
    strengths.push("Professional certifications");
  }

  const hasAdvancedDegree = candidate.education.some(e => 
    e.degree.toLowerCase().includes("master") || e.degree.toLowerCase().includes("phd")
  );
  if (hasAdvancedDegree) {
    strengths.push("Advanced degree holder");
  }

  return strengths;
}

/**
 * Extract candidate weaknesses
 */
function extractWeaknesses(candidate: CandidateProfile, jobAnalysis: any): string[] {
  const weaknesses: string[] = [];

  if (candidate.experience.length === 0) {
    weaknesses.push("Limited work experience");
  }

  if (candidate.skills.length < 3) {
    weaknesses.push("Limited technical skills");
  }

  if ((candidate.projects?.length || 0) === 0) {
    weaknesses.push("No project portfolio");
  }

  if ((candidate.certifications?.length || 0) === 0) {
    weaknesses.push("No professional certifications");
  }

  if (candidate.education.length === 0) {
    weaknesses.push("No formal education listed");
  }

  return weaknesses;
}

/**
 * Generate detailed match explanation using LLM
 */
async function generateMatchExplanation(
  candidate: CandidateProfile,
  job: JobRequirements,
  scores: any
): Promise<string> {
  const prompt = `Generate a brief professional summary explaining why this candidate is a ${Math.round(scores.overallScore)}% match for this job.

Job: ${job.title}
Candidate Skills: ${candidate.skills.map(s => s.skillName).join(", ")}
Candidate Experience: ${candidate.experience.map(e => `${e.position} at ${e.company}`).join(", ")}

Scores:
- Skills Match: ${scores.skillsScore}%
- Experience Match: ${scores.experienceScore}%
- Projects Match: ${scores.projectsScore}%
- Education Match: ${scores.educationScore}%
- Certifications Match: ${scores.certificationsScore}%
- Activity Score: ${scores.activityScore}%

Provide a 2-3 sentence summary of the match quality.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a recruitment expert. Provide concise, professional match explanations.",
        },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0]?.message.content?.toString() || "Match analysis completed.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return `This candidate has a ${Math.round(scores.overallScore)}% match for the position based on skills, experience, and qualifications.`;
  }
}
