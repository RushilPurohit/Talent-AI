import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { getAnalytics, getRecentActivity, getUserJobs, getCandidates, createJob, getJobById, updateJob, deleteJob } from "./db";
import { calculateSemanticMatch } from "./rankingEngine";
import { getDatasetCandidates, computeDatasetStats } from "./datasetLoader";
import { verifyUserCredentials, registerNewUser } from "./userStore";
import { getUploadedResumes } from "./resumeStore";
import { sdk } from "./_core/sdk";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = verifyUserCredentials(input.email, input.password);
        if (!user) {
          throw new Error("Invalid email or password");
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
    signUp: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(["recruiter", "admin"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = registerNewUser(input.name, input.email, input.password, input.role);

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user };
      }),
  }),

  dashboard: router({
    getMetrics: protectedProcedure.query(async ({ ctx }) => {
      const analytics = await getAnalytics(ctx.user.id);
      const jobs = await getUserJobs(ctx.user.id);
      const recentActivity = await getRecentActivity(ctx.user.id, 5);
      const datasetCandidates = getDatasetCandidates();

      return {
        totalCandidates: datasetCandidates.length,
        totalJobs: jobs.length,
        aiMatches: datasetCandidates.filter(c => c.redrob_signals.open_to_work_flag).length,
        interviews: datasetCandidates.filter(c => c.redrob_signals.interview_completion_rate > 0.7).length,
        hiringRate: Math.round(
          (datasetCandidates.filter(c => c.redrob_signals.offer_acceptance_rate > 0).length /
          Math.max(datasetCandidates.length, 1)) * 100
        ),
        recentActivity: recentActivity,
        analytics: analytics,
      };
    }),
  }),

  jobs: router({
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        requirements: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createJob({
          userId: ctx.user.id,
          ...input,
          status: 'draft',
        });
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserJobs(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getJobById(input.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        requirements: z.string().optional(),
        location: z.string().optional(),
        status: z.enum(['draft', 'published', 'closed']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateJob(id, data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteJob(input.id);
      }),
  }),

  candidates: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getCandidates(100, 0);
    }),

    listFromDataset: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        skill: z.string().optional(),
        experienceLevel: z.string().optional(),
        workMode: z.string().optional(),
        openToWork: z.boolean().optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }))
      .query(({ input }) => {
        let results = getDatasetCandidates();

        if (input.search) {
          const q = input.search.toLowerCase();
          results = results.filter(c =>
            c.profile.anonymized_name.toLowerCase().includes(q) ||
            c.profile.headline.toLowerCase().includes(q) ||
            c.profile.current_title.toLowerCase().includes(q) ||
            c.profile.current_company.toLowerCase().includes(q) ||
            c.profile.location.toLowerCase().includes(q)
          );
        }

        if (input.skill) {
          const sq = input.skill.toLowerCase();
          results = results.filter(c =>
            c.skills.some(s => s.name.toLowerCase().includes(sq))
          );
        }

        if (input.experienceLevel) {
          results = results.filter(c => {
            const yoe = c.profile.years_of_experience;
            if (input.experienceLevel === "junior") return yoe < 3;
            if (input.experienceLevel === "mid") return yoe >= 3 && yoe < 7;
            if (input.experienceLevel === "senior") return yoe >= 7 && yoe < 12;
            if (input.experienceLevel === "lead") return yoe >= 12;
            return true;
          });
        }

        if (input.workMode) {
          results = results.filter(
            c => c.redrob_signals.preferred_work_mode === input.workMode
          );
        }

        if (input.openToWork === true) {
          results = results.filter(c => c.redrob_signals.open_to_work_flag);
        }

        const total = results.length;
        const paginated = results.slice(input.offset, input.offset + input.limit);

        return { candidates: paginated, total };
      }),

    getByDatasetId: protectedProcedure
      .input(z.object({ candidateId: z.string() }))
      .query(({ input }) => {
        const all = getDatasetCandidates();
        return all.find(c => c.candidate_id === input.candidateId) ?? null;
      }),

    topMatchesForJob: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        limit: z.number().optional().default(50),
      }))
      .query(async ({ input }) => {
        const job = await getJobById(input.jobId);
        if (!job) {
          throw new Error("Job not found");
        }

        const jobText = `${job.title} ${job.description} ${job.requirements || ""}`.toLowerCase();
        const tokens = Array.from(new Set(
          jobText
            .replace(/[^a-z0-9+#. ]/g, " ")
            .split(/\s+/)
            .filter(token => token.length > 2)
        ));

        const scored = getDatasetCandidates().map(candidate => {
          const skills = candidate.skills.map(skill => skill.name.toLowerCase());
          const profileText = [
            candidate.profile.headline,
            candidate.profile.summary,
            candidate.profile.current_title,
            candidate.profile.current_industry,
            ...candidate.career_history.map(item => `${item.title} ${item.description}`),
            ...candidate.education.map(item => `${item.degree} ${item.field_of_study}`),
            ...(candidate.certifications ?? []).map(item => item.name),
            ...skills,
          ].join(" ").toLowerCase();

          const matchedSkills = skills.filter(skill =>
            jobText.includes(skill) || skill.split(/[\s/+-]+/).some(part => part.length > 2 && jobText.includes(part))
          );
          const missingKeywords = tokens
            .filter(token => !profileText.includes(token))
            .filter(token => !["required", "experience", "years", "with", "and", "the", "for", "job", "role"].includes(token))
            .slice(0, 6);
          const keywordHits = tokens.filter(token => profileText.includes(token)).length;
          const skillScore = Math.min((matchedSkills.length / Math.max(tokens.length / 8, 1)) * 55, 55);
          const keywordScore = Math.min((keywordHits / Math.max(tokens.length, 1)) * 25, 25);
          const experienceScore = Math.min(candidate.profile.years_of_experience * 2, 12);
          const signalScore =
            (candidate.redrob_signals.open_to_work_flag ? 4 : 0) +
            (candidate.redrob_signals.verified_email ? 2 : 0) +
            (candidate.redrob_signals.linkedin_connected ? 2 : 0);
          const matchScore = Math.round(Math.min(skillScore + keywordScore + experienceScore + signalScore, 100));
          const whyHire = [
            matchedSkills.length > 0
              ? `Relevant skills found: ${matchedSkills.slice(0, 5).join(", ")}.`
              : "Profile contains related keywords from the job description.",
            `${candidate.profile.years_of_experience} years of experience aligns with the role seniority.`,
            candidate.redrob_signals.open_to_work_flag
              ? "Candidate is open to work, improving hiring readiness."
              : "Candidate has a complete profile for recruiter review.",
            candidate.redrob_signals.verified_email || candidate.redrob_signals.verified_phone
              ? "Verified contact signals reduce outreach risk."
              : "Profile has enough public hiring signals for initial screening.",
          ];
          const whyNotHire = [
            matchedSkills.length < 3
              ? "Few exact skill matches were found against this job description."
              : "",
            missingKeywords.length > 0
              ? `Possible gaps: ${missingKeywords.slice(0, 5).join(", ")}.`
              : "",
            candidate.redrob_signals.notice_period_days > 60
              ? `Long notice period of ${candidate.redrob_signals.notice_period_days} days may slow hiring.`
              : "",
            !candidate.redrob_signals.open_to_work_flag
              ? "Candidate is not explicitly marked open to work."
              : "",
            candidate.redrob_signals.github_activity_score === -1 && jobText.includes("github")
              ? "GitHub activity is not linked even though technical activity may matter for this role."
              : "",
          ].filter(Boolean);
          const recommendation =
            matchScore >= 75
              ? "Strong hire recommendation: shortlist for interview."
              : matchScore >= 55
                ? "Conditional recommendation: review gaps before interview."
                : "Low-confidence recommendation: keep as backup unless requirements are flexible.";
          const semanticMatches = tokens
            .filter(token => profileText.includes(token))
            .slice(0, 8);
          const resumeEvidence = [
            candidate.profile.current_title
              ? `Current title: ${candidate.profile.current_title}.`
              : "",
            candidate.profile.current_company
              ? `Current company: ${candidate.profile.current_company}.`
              : "",
            candidate.career_history[0]
              ? `Recent role: ${candidate.career_history[0].title} at ${candidate.career_history[0].company}.`
              : "",
            candidate.education[0]
              ? `Education: ${candidate.education[0].degree} in ${candidate.education[0].field_of_study}.`
              : "",
          ].filter(Boolean);
          const confidenceLevel =
            matchScore >= 75 && matchedSkills.length >= 3
              ? "High"
              : matchScore >= 55
                ? "Medium"
                : "Low";
          const xaiExplanation = {
            overallExplanation: `This candidate received ${matchScore}% because the resume overlaps with the job through ${matchedSkills.slice(0, 3).join(", ") || "profile keywords"}, experience signals, and hiring readiness indicators.`,
            top5Strengths: whyHire.slice(0, 5),
            missingSkills: missingKeywords,
            semanticMatches,
            resumeEvidence,
            riskFactors: whyNotHire.length > 0 ? whyNotHire : ["No major risk factors were detected from available data."],
            confidenceLevel,
            hiringRecommendation: recommendation,
          };

          return {
            ...candidate,
            matchScore,
            matchedSkills: matchedSkills.slice(0, 8),
            missingKeywords,
            whyHire,
            whyNotHire: whyNotHire.length > 0 ? whyNotHire : ["No major concerns found from the available profile data."],
            recommendation,
            xaiExplanation,
            matchReason: matchedSkills.length > 0
              ? `Matches ${matchedSkills.slice(0, 4).join(", ")} for this job description.`
              : "Selected from profile keywords, experience, and hiring signals.",
          };
        });

        scored.sort((a, b) => b.matchScore - a.matchScore);

        return {
          job,
          candidates: scored.slice(0, input.limit),
          total: scored.length,
        };
      }),
  }),

  analytics: router({
    getDatasetStats: protectedProcedure.query(() => {
      return computeDatasetStats();
    }),
  }),

  ranking: router({
    calculateMatch: protectedProcedure
      .input(z.object({
        candidateId: z.number(),
        jobId: z.number(),
        candidateProfile: z.object({
          skills: z.array(z.object({
            skillName: z.string(),
            proficiency: z.string(),
            yearsOfExperience: z.string().optional(),
          })),
          experience: z.array(z.object({
            company: z.string(),
            position: z.string(),
            description: z.string().optional(),
          })),
          education: z.array(z.object({
            institution: z.string(),
            degree: z.string(),
            fieldOfStudy: z.string().optional(),
          })),
          projects: z.array(z.object({
            title: z.string(),
            description: z.string(),
          })).optional(),
          certifications: z.array(z.object({
            name: z.string(),
            issuer: z.string(),
          })).optional(),
          languages: z.array(z.object({
            language: z.string(),
            proficiency: z.string(),
          })).optional(),
        }),
        jobRequirements: z.object({
          title: z.string(),
          description: z.string(),
          requirements: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const result = await calculateSemanticMatch(
          input.candidateProfile,
          input.jobRequirements
        );
        return {
          ...result,
          candidateId: input.candidateId,
          jobId: input.jobId,
        };
      }),
  }),

  resumes: router({
    list: protectedProcedure.query(() => {
      return getUploadedResumes();
    }),
  }),
});

export type AppRouter = typeof appRouter;
