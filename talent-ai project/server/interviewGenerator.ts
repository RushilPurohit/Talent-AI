import { invokeLLM } from "./_core/llm";

interface InterviewQuestionRequest {
  candidateName: string;
  candidateSkills: string[];
  candidateExperience: string;
  jobTitle: string;
  jobDescription: string;
  matchScore: number;
}

interface InterviewQuestion {
  question: string;
  category: "technical" | "behavioral" | "experience" | "skills";
  difficulty: "easy" | "medium" | "hard";
  expectedTopics: string[];
}

interface InterviewQuestionsResponse {
  questions: InterviewQuestion[];
  interviewDuration: number;
  focusAreas: string[];
  notes: string;
}

/**
 * Generate personalized interview questions based on candidate profile and job requirements
 */
export async function generateInterviewQuestions(
  request: InterviewQuestionRequest
): Promise<InterviewQuestionsResponse> {
  const prompt = `Generate 5 interview questions for a candidate interview.

Candidate: ${request.candidateName}
Skills: ${request.candidateSkills.join(", ")}
Experience: ${request.candidateExperience}
Job Title: ${request.jobTitle}
Job Description: ${request.jobDescription}
AI Match Score: ${request.matchScore}%

Generate questions that:
1. Assess technical skills relevant to the job
2. Explore relevant work experience
3. Evaluate cultural fit and soft skills
4. Probe into specific projects and achievements
5. Understand career goals and motivation

Return a JSON object with:
- questions: array of interview questions with category (technical/behavioral/experience/skills), difficulty (easy/medium/hard), and expectedTopics
- interviewDuration: estimated interview duration in minutes
- focusAreas: key areas to focus on during the interview
- notes: additional notes for the interviewer`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert recruiter and interview coach. Generate thoughtful, role-specific interview questions that help assess candidate fit.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "interview_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    category: {
                      type: "string",
                      enum: ["technical", "behavioral", "experience", "skills"],
                    },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"],
                    },
                    expectedTopics: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["question", "category", "difficulty", "expectedTopics"],
                  additionalProperties: false,
                },
              },
              interviewDuration: { type: "number" },
              focusAreas: {
                type: "array",
                items: { type: "string" },
              },
              notes: { type: "string" },
            },
            required: ["questions", "interviewDuration", "focusAreas", "notes"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      return JSON.parse(content) as InterviewQuestionsResponse;
    }
    // If content is not a string, return default questions
    return generateDefaultInterviewQuestions(request);
  } catch (error) {
    console.error("Error generating interview questions:", error);
    // Return default questions if LLM fails
    return generateDefaultInterviewQuestions(request);
  }
}

/**
 * Generate default interview questions as fallback
 */
function generateDefaultInterviewQuestions(
  request: InterviewQuestionRequest
): InterviewQuestionsResponse {
  const skills = request.candidateSkills.slice(0, 2);
  
  return {
    questions: [
      {
        question: `Tell us about your experience with ${skills[0] || "the technologies required for this role"}. What projects have you worked on?`,
        category: "experience",
        difficulty: "medium",
        expectedTopics: ["Project experience", "Technical depth", "Problem-solving"],
      },
      {
        question: `Describe a challenging technical problem you solved. How did you approach it?`,
        category: "technical",
        difficulty: "medium",
        expectedTopics: ["Problem-solving", "Technical skills", "Communication"],
      },
      {
        question: `How do you stay updated with the latest developments in ${skills[0] || "your field"}?`,
        category: "behavioral",
        difficulty: "easy",
        expectedTopics: ["Learning mindset", "Professional growth", "Industry awareness"],
      },
      {
        question: `Tell us about a time you had to work with a difficult team member. How did you handle it?`,
        category: "behavioral",
        difficulty: "medium",
        expectedTopics: ["Teamwork", "Communication", "Conflict resolution"],
      },
      {
        question: `Why are you interested in this ${request.jobTitle} position, and how do your skills align with our needs?`,
        category: "skills",
        difficulty: "easy",
        expectedTopics: ["Motivation", "Role understanding", "Skill alignment"],
      },
    ],
    interviewDuration: 45,
    focusAreas: [
      `Technical expertise in ${skills.join(" and ")}`,
      "Relevant project experience",
      "Problem-solving approach",
      "Team collaboration",
      "Career goals and motivation",
    ],
    notes: `This candidate has a ${request.matchScore}% match score. Focus on verifying technical skills and assessing cultural fit. Pay special attention to their experience with ${skills.join(" and ")}.`,
  };
}

/**
 * Generate detailed match explanation with strengths and weaknesses
 */
export async function generateDetailedMatchExplanation(
  candidateName: string,
  candidateProfile: any,
  jobRequirements: any,
  scores: any
): Promise<{
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  const prompt = `Provide a detailed analysis of this candidate-job match.

Candidate: ${candidateName}
Skills: ${candidateProfile.skills?.map((s: any) => s.skillName).join(", ") || "Not specified"}
Experience: ${candidateProfile.experience?.length || 0} positions
Education: ${candidateProfile.education?.map((e: any) => e.degree).join(", ") || "Not specified"}

Job: ${jobRequirements.title}
Requirements: ${jobRequirements.requirements}

Scores:
- Skills Match: ${scores.skillsScore}%
- Experience Match: ${scores.experienceScore}%
- Overall Match: ${scores.overallScore}%

Provide a JSON object with:
- summary: 2-3 sentence professional summary of the match
- strengths: array of 3-4 key strengths
- weaknesses: array of 2-3 areas for improvement
- recommendations: array of 2-3 recommendations for the hiring team`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert recruiter providing detailed candidate-job match analysis.",
        },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["summary", "strengths", "weaknesses", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (typeof content === "string") {
      return JSON.parse(content) as { summary: string; strengths: string[]; weaknesses: string[]; recommendations: string[] };
    }
    // If content is not a string, return default analysis
    return {
      summary: `${candidateName} is a ${scores.overallScore}% match for the ${jobRequirements.title} position.`,
      strengths: ["Relevant technical skills", "Professional experience"],
      weaknesses: ["Some skill gaps identified"],
      recommendations: ["Consider for the role with focus on skill development"],
    };
  } catch (error) {
    console.error("Error generating detailed match explanation:", error);
    return {
      summary: `${candidateName} is a ${scores.overallScore}% match for the ${jobRequirements.title} position. The candidate has relevant skills and experience that align with the job requirements.`,
      strengths: [
        "Relevant technical skills",
        "Professional experience",
        "Educational background",
      ],
      weaknesses: [
        "Some skill gaps identified",
        "Limited experience in specific area",
      ],
      recommendations: [
        "Consider for the role with focus on skill development",
        "Schedule technical interview to assess depth",
      ],
    };
  }
}
