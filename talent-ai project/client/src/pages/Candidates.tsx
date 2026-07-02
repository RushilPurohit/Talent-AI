import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Eye, MapPin, Briefcase, Award, BookOpen, Star, CheckCircle, Download, CalendarCheck, Send, Calendar, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function Candidates() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [filterExperience, setFilterExperience] = useState("");
  const [filterWorkMode, setFilterWorkMode] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedJobId, setSelectedJobId] = useState("all");

  // Interview scheduling state
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [interviewMode, setInterviewMode] = useState("video");
  const [recruiterMessage, setRecruiterMessage] = useState("");
  const [scheduledInterviews, setScheduledInterviews] = useState<Record<string, any>>({});
  const [isScheduling, setIsScheduling] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleScheduleInterview = () => {
    if (!interviewDate) {
      toast.error("Please select an interview date.");
      return;
    }
    setIsScheduling(true);
    setTimeout(() => {
      const candidateId = selectedCandidate.candidate_id;
      const formatted = new Date(`${interviewDate}T${interviewTime}`).toLocaleString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      setScheduledInterviews(prev => ({
        ...prev,
        [candidateId]: {
          date: interviewDate,
          time: interviewTime,
          mode: interviewMode,
          message: recruiterMessage,
          formatted,
          candidateName: selectedCandidate.profile.anonymized_name,
          scheduledAt: new Date().toISOString(),
        },
      }));
      setIsScheduling(false);
      setShowScheduleDialog(false);
      setInterviewDate("");
      setInterviewTime("10:00");
      setInterviewMode("video");
      setRecruiterMessage("");
      toast.success(`Interview scheduled with ${selectedCandidate.profile.anonymized_name} on ${formatted}`);
    }, 800);
  };

  const { data, isLoading: candidatesLoading } = trpc.candidates.listFromDataset.useQuery(
    {
      search: debouncedSearch || undefined,
      skill: filterSkill && filterSkill.trim() ? filterSkill : undefined,
      experienceLevel: filterExperience && filterExperience.trim() ? filterExperience : undefined,
      workMode: filterWorkMode && filterWorkMode.trim() ? filterWorkMode : undefined,
      limit: 50,
      offset: 0,
    },
    { enabled: isAuthenticated && !loading && selectedJobId === "all" }
  );
  const { data: jobs } = trpc.jobs.list.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });
  const { data: topMatches, isLoading: topMatchesLoading } = trpc.candidates.topMatchesForJob.useQuery(
    {
      jobId: Number(selectedJobId),
      limit: 50,
    },
    { enabled: isAuthenticated && !loading && selectedJobId !== "all" }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isTopMatchesMode = selectedJobId !== "all";
  const candidates = isTopMatchesMode ? (topMatches?.candidates ?? []) : (data?.candidates ?? []);
  const total = isTopMatchesMode ? (topMatches?.total ?? 0) : (data?.total ?? 0);
  const isCandidatesLoading = isTopMatchesMode ? topMatchesLoading : candidatesLoading;

  const exportToExcel = () => {
    if (candidates.length === 0) return;

    const rows = candidates.map((c: any) => ({
      "Candidate ID": c.candidate_id,
      "Name": c.profile.anonymized_name,
      "Headline": c.profile.headline,
      "Location": `${c.profile.location}, ${c.profile.country}`,
      "Current Title": c.profile.current_title,
      "Current Company": c.profile.current_company,
      "Industry": c.profile.current_industry,
      "Years of Experience": c.profile.years_of_experience,
      "Skills": c.skills.map((s: any) => s.name).join(", "),
      "Match Score": c.matchScore ?? "",
      "Matched Skills": c.matchedSkills?.join(", ") ?? "",
      "Why Hire": c.whyHire?.join(" | ") ?? "",
      "Why Not Hire": c.whyNotHire?.join(" | ") ?? "",
      "Recommendation": c.recommendation ?? "",
      "Overall Explanation": c.xaiExplanation?.overallExplanation ?? "",
      "Top 5 Strengths": c.xaiExplanation?.top5Strengths?.join(" | ") ?? "",
      "Missing Skills": c.xaiExplanation?.missingSkills?.join(", ") ?? "",
      "Semantic Matches": c.xaiExplanation?.semanticMatches?.join(", ") ?? "",
      "Resume Evidence": c.xaiExplanation?.resumeEvidence?.join(" | ") ?? "",
      "Risk Factors": c.xaiExplanation?.riskFactors?.join(" | ") ?? "",
      "Confidence Level": c.xaiExplanation?.confidenceLevel ?? "",
      "Hiring Recommendation": c.xaiExplanation?.hiringRecommendation ?? "",
      "Top Skill Proficiency": c.skills[0]?.proficiency ?? "",
      "Work Mode": c.redrob_signals.preferred_work_mode,
      "Open to Work": c.redrob_signals.open_to_work_flag ? "Yes" : "No",
      "Notice Period (days)": c.redrob_signals.notice_period_days,
      "Salary Min (LPA)": c.redrob_signals.expected_salary_range_inr_lpa?.min ?? "",
      "Salary Max (LPA)": c.redrob_signals.expected_salary_range_inr_lpa?.max ?? "",
      "Willing to Relocate": c.redrob_signals.willing_to_relocate ? "Yes" : "No",
      "Profile Score": c.redrob_signals.profile_completeness_score,
      "GitHub Score": c.redrob_signals.github_activity_score === -1 ? "Not linked" : c.redrob_signals.github_activity_score,
      "Interview Rate (%)": c.redrob_signals.interview_completion_rate,
      "Verified Email": c.redrob_signals.verified_email ? "Yes" : "No",
      "Verified Phone": c.redrob_signals.verified_phone ? "Yes" : "No",
      "LinkedIn Connected": c.redrob_signals.linkedin_connected ? "Yes" : "No",
      "Education": c.education.map((e: any) => `${e.degree} (${e.institution})`).join(" | "),
      "Certifications": (c.certifications ?? []).map((cert: any) => cert.name).join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Auto-size columns
    const colWidths = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] ?? "").length)) + 2,
    }));
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidates");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `candidates_export_${today}.xlsx`);
  };

  const getProficiencyColor = (proficiency: string) => {
    switch (proficiency) {
      case "expert": return "bg-green-500/20 text-green-400";
      case "advanced": return "bg-blue-500/20 text-blue-400";
      case "intermediate": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getWorkModeColor = (mode: string) => {
    switch (mode) {
      case "remote": return "bg-blue-500/20 text-blue-400";
      case "hybrid": return "bg-purple-500/20 text-purple-400";
      case "onsite": return "bg-green-500/20 text-green-400";
      default: return "bg-orange-500/20 text-orange-400";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Candidates</h1>
            <p className="text-slate-600 mt-2">
              {isCandidatesLoading
                ? "Loading..."
                : isTopMatchesMode
                  ? `Top ${candidates.length} resumes selected for ${topMatches?.job?.title ?? "selected job"}`
                  : `Showing ${candidates.length} of ${total} candidates`}
            </p>
          </div>
          <Button
            onClick={exportToExcel}
            disabled={candidates.length === 0 || isCandidatesLoading}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950">Search & Filter</CardTitle>
            <CardDescription>Select a job to rank and show the top 50 resumes for its description.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-5">
                <label className="text-sm font-medium text-slate-700">Top 50 by Job Description</label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-950 mt-1">
                    <SelectValue placeholder="Choose a job" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 border-slate-200">
                    <SelectItem value="all">All candidates</SelectItem>
                    {(jobs ?? []).map((job: any) => (
                      <SelectItem key={job.id} value={String(job.id)}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm font-medium text-slate-700">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Search by name, title, company, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-950 pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Skills</label>
                <Input
                  placeholder="e.g. Python, React..."
                  value={filterSkill}
                  onChange={(e) => setFilterSkill(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-950 mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Experience</label>
                <Select value={filterExperience} onValueChange={setFilterExperience}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-950 mt-1">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 border-slate-200">
                    <SelectItem value=" ">All levels</SelectItem>
                    <SelectItem value="junior">Junior (&lt;3 years)</SelectItem>
                    <SelectItem value="mid">Mid (3-7 years)</SelectItem>
                    <SelectItem value="senior">Senior (7-12 years)</SelectItem>
                    <SelectItem value="lead">Lead (12+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Work Mode</label>
                <Select value={filterWorkMode} onValueChange={setFilterWorkMode}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-950 mt-1">
                    <SelectValue placeholder="All modes" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-50 border-slate-200">
                    <SelectItem value=" ">All modes</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        {isCandidatesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <div className="grid gap-4">
            {candidates.length > 0 ? (
              candidates.map((candidate) => (
                <Card
                  key={candidate.candidate_id}
                  className="bg-white border-slate-200 hover:border-blue-500 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-950">
                            {candidate.profile.anonymized_name}
                          </h3>
                          {typeof candidate.matchScore === "number" && (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 text-xs rounded-full border border-blue-500/20 flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {candidate.matchScore}% match
                            </span>
                          )}
                          {candidate.redrob_signals.open_to_work_flag && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                              Open to Work
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getWorkModeColor(candidate.redrob_signals.preferred_work_mode)}`}>
                            {candidate.redrob_signals.preferred_work_mode}
                          </span>
                        </div>
                        <p className="text-blue-400 text-sm font-medium mb-1">{candidate.profile.headline}</p>
                        <p className="text-slate-600 text-sm mb-3 line-clamp-2">{candidate.profile.summary}</p>
                        {candidate.matchReason && (
                          <p className="text-sm text-slate-700 mb-3 bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                            {candidate.matchReason}
                          </p>
                        )}
                        {candidate.xaiExplanation && (
                          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <h4 className="text-sm font-semibold text-slate-950">Explainable AI</h4>
                              <span className="text-xs text-blue-600 font-medium">
                                Confidence: {candidate.xaiExplanation.confidenceLevel}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">
                              {candidate.xaiExplanation.overallExplanation}
                            </p>
                          </div>
                        )}
                        {candidate.whyHire && candidate.whyNotHire && (
                          <div className="grid md:grid-cols-2 gap-3 mb-4">
                            <div className="bg-green-50 border border-green-100 rounded-md p-3">
                              <h4 className="text-sm font-semibold text-green-700 mb-2">Why hire</h4>
                              <ul className="space-y-1">
                                {candidate.whyHire.slice(0, 3).map((reason: string) => (
                                  <li key={reason} className="text-xs text-slate-700">{reason}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="bg-red-50 border border-red-100 rounded-md p-3">
                              <h4 className="text-sm font-semibold text-red-700 mb-2">Why not hire</h4>
                              <ul className="space-y-1">
                                {candidate.whyNotHire.slice(0, 3).map((reason: string) => (
                                  <li key={reason} className="text-xs text-slate-700">{reason}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700 truncate">
                              {candidate.profile.location}, {candidate.profile.country}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700">
                              {candidate.profile.years_of_experience}y exp
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700">
                              {candidate.certifications?.length ?? 0} certs
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-slate-600 flex-shrink-0" />
                            <span className="text-sm text-slate-700 truncate">
                              {candidate.profile.current_company}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {candidate.skills.slice(0, 6).map((skill) => (
                            <span
                              key={skill.name}
                              className={`px-2 py-0.5 text-xs rounded ${getProficiencyColor(skill.proficiency)}`}
                            >
                              {skill.name}
                            </span>
                          ))}
                          {(candidate.matchedSkills ?? []).slice(0, 4).map((skill: string) => (
                            <span
                              key={`matched-${skill}`}
                              className="px-2 py-0.5 text-xs rounded bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            >
                              Match: {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 6 && (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded">
                              +{candidate.skills.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4 ml-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-400">
                            {Math.round(candidate.redrob_signals.profile_completeness_score)}
                          </div>
                          <div className="text-xs text-slate-600">Profile Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-400">
                            {candidate.redrob_signals.notice_period_days}d
                          </div>
                          <div className="text-xs text-slate-600">Notice</div>
                        </div>
                        <Button
                          onClick={() => setSelectedCandidate(candidate)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white border-slate-200">
                <CardContent className="pt-6">
                  <p className="text-slate-600 text-center py-8">
                    No candidates found matching your filters.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Candidate Profile Dialog */}
      {selectedCandidate && (
        <Dialog open={!!selectedCandidate} onOpenChange={() => setSelectedCandidate(null)}>
          <DialogContent className="bg-white border-slate-200 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-950">
                {selectedCandidate.profile.anonymized_name}
              </DialogTitle>
              <DialogDescription className="text-blue-400">
                {selectedCandidate.profile.headline}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Profile Score */}
              <div className="bg-slate-50 p-4 rounded-lg grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(selectedCandidate.redrob_signals.profile_completeness_score)}%
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Profile Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(selectedCandidate.redrob_signals.interview_completion_rate * 100)}%
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Interview Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedCandidate.redrob_signals.connection_count}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Connections</div>
                </div>
              </div>

              {selectedCandidate.recommendation && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h4 className="text-slate-950 font-semibold mb-1">Explainable AI Recommendation</h4>
                  <p className="text-sm text-slate-700">{selectedCandidate.recommendation}</p>
                </div>
              )}

              {selectedCandidate.xaiExplanation && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-slate-950 font-semibold mb-1">Overall explanation</h4>
                    <p className="text-sm text-slate-700">{selectedCandidate.xaiExplanation.overallExplanation}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-green-700 mb-2">Top 5 strengths</h5>
                      <ul className="space-y-1">
                        {selectedCandidate.xaiExplanation.top5Strengths.map((item: string) => (
                          <li key={item} className="text-sm text-slate-700">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-red-700 mb-2">Risk factors</h5>
                      <ul className="space-y-1">
                        {selectedCandidate.xaiExplanation.riskFactors.map((item: string) => (
                          <li key={item} className="text-sm text-slate-700">{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-950 mb-2">Missing skills</h5>
                      <p className="text-sm text-slate-700">
                        {selectedCandidate.xaiExplanation.missingSkills.length > 0
                          ? selectedCandidate.xaiExplanation.missingSkills.join(", ")
                          : "No major missing skills detected."}
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-950 mb-2">Semantic matches</h5>
                      <p className="text-sm text-slate-700">
                        {selectedCandidate.xaiExplanation.semanticMatches.join(", ") || "No semantic matches available."}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-slate-950 mb-2">Resume evidence</h5>
                    <ul className="space-y-1">
                      {selectedCandidate.xaiExplanation.resumeEvidence.map((item: string) => (
                        <li key={item} className="text-sm text-slate-700">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-slate-950 mb-1">Confidence level</h5>
                      <p className="text-sm text-blue-600 font-medium">{selectedCandidate.xaiExplanation.confidenceLevel}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-950 mb-1">Hiring recommendation</h5>
                      <p className="text-sm text-slate-700">{selectedCandidate.xaiExplanation.hiringRecommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedCandidate.whyHire && selectedCandidate.whyNotHire && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <h4 className="text-green-700 font-semibold mb-3">Why hire this candidate</h4>
                    <ul className="space-y-2">
                      {selectedCandidate.whyHire.map((reason: string) => (
                        <li key={reason} className="text-sm text-slate-700">{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <h4 className="text-red-700 font-semibold mb-3">Why not hire this candidate</h4>
                    <ul className="space-y-2">
                      {selectedCandidate.whyNotHire.map((reason: string) => (
                        <li key={reason} className="text-sm text-slate-700">{reason}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Location & Basic Info */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">
                      {selectedCandidate.profile.location}, {selectedCandidate.profile.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">
                      {selectedCandidate.profile.years_of_experience} years experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700 capitalize">
                      {selectedCandidate.redrob_signals.preferred_work_mode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">
                      Notice: {selectedCandidate.redrob_signals.notice_period_days} days
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-2">Summary</h4>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {selectedCandidate.profile.summary}
                </p>
              </div>

              {/* Career History */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-3">Career History</h4>
                <div className="space-y-3">
                  {selectedCandidate.career_history.map((job: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="text-slate-950 font-medium text-sm">{job.title}</p>
                          <p className="text-blue-400 text-xs">{job.company}</p>
                        </div>
                        <div className="text-right">
                          {job.is_current && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                          <p className="text-slate-500 text-xs mt-1">{job.duration_months}m</p>
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs line-clamp-2">{job.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-3">Education</h4>
                <div className="space-y-2">
                  {selectedCandidate.education.map((edu: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-slate-950 text-sm font-medium">{edu.degree} - {edu.field_of_study}</p>
                      <p className="text-blue-400 text-xs">{edu.institution}</p>
                      <p className="text-slate-600 text-xs">
                        {edu.start_year} - {edu.end_year}
                        {edu.grade ? ` | ${edu.grade}` : ""}
                        {edu.tier ? ` | ${edu.tier.replace("_", " ")}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-3">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill: any) => (
                    <span
                      key={skill.name}
                      className={`px-3 py-1 rounded-full text-sm ${getProficiencyColor(skill.proficiency)}`}
                    >
                      {skill.name}
                      <span className="ml-1 opacity-60 text-xs">({skill.proficiency})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              {selectedCandidate.certifications?.length > 0 && (
                <div>
                  <h4 className="text-slate-950 font-semibold mb-3">Certifications</h4>
                  <ul className="space-y-2">
                    {selectedCandidate.certifications.map((cert: any) => (
                      <li key={cert.name} className="flex items-center gap-2 text-slate-700 text-sm">
                        <Award className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                        {cert.name} - {cert.issuer} ({cert.year})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Salary & Preferences */}
              <div>
                <h4 className="text-slate-950 font-semibold mb-3">Salary & Preferences</h4>
                <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600">Expected (INR LPA)</span>
                    <p className="text-slate-950 font-medium">
                      {selectedCandidate.redrob_signals.expected_salary_range_inr_lpa.min} -&nbsp;
                      {selectedCandidate.redrob_signals.expected_salary_range_inr_lpa.max}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Willing to Relocate</span>
                    <p className={`font-medium ${selectedCandidate.redrob_signals.willing_to_relocate ? "text-green-400" : "text-red-400"}`}>
                      {selectedCandidate.redrob_signals.willing_to_relocate ? "Yes" : "No"}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">GitHub Score</span>
                    <p className="text-slate-950 font-medium">
                      {selectedCandidate.redrob_signals.github_activity_score === -1
                        ? "Not linked"
                        : `${selectedCandidate.redrob_signals.github_activity_score}/100`}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-600">Verified</span>
                    <p className="text-slate-700 text-xs mt-1">
                      {selectedCandidate.redrob_signals.verified_email && "Email "}
                      {selectedCandidate.redrob_signals.verified_phone && "Phone "}
                      {selectedCandidate.redrob_signals.linkedin_connected && "LinkedIn"}
                      {!selectedCandidate.redrob_signals.verified_email &&
                        !selectedCandidate.redrob_signals.verified_phone &&
                        !selectedCandidate.redrob_signals.linkedin_connected && "None"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Scheduled Interview Banner */}
              {scheduledInterviews[selectedCandidate.candidate_id] && (
                <div className="bg-green-50 border border-green-500/40 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <CalendarCheck className="h-5 w-5" />
                    Interview Scheduled
                  </div>
                  <p className="text-slate-950 text-sm">
                    <span className="text-slate-600">Date & Time: </span>
                    {scheduledInterviews[selectedCandidate.candidate_id].formatted}
                  </p>
                  <p className="text-slate-950 text-sm capitalize">
                    <span className="text-slate-600">Mode: </span>
                    {scheduledInterviews[selectedCandidate.candidate_id].mode} interview
                  </p>
                  {scheduledInterviews[selectedCandidate.candidate_id].message && (
                    <div className="mt-2 bg-slate-50 rounded p-3 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                        <Send className="h-3 w-3" /> Message sent to candidate:
                      </p>
                      <p className="text-slate-800 text-sm italic">
                        "{scheduledInterviews[selectedCandidate.candidate_id].message}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowScheduleDialog(true)}
                  className={`flex-1 ${
                    scheduledInterviews[selectedCandidate.candidate_id]
                      ? "bg-green-700 hover:bg-green-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {scheduledInterviews[selectedCandidate.candidate_id] ? "Reschedule Interview" : "Schedule Interview"}
                </Button>
                <Button variant="outline" className="flex-1 border-slate-200 text-slate-700">
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-950 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              Schedule Interview
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {selectedCandidate?.profile.anonymized_name} — set a date, time, and write a message to the candidate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Date */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Interview Date</label>
              <Input
                type="date"
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="bg-slate-50 border-slate-200 text-slate-950"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Interview Time</label>
              <Input
                type="time"
                value={interviewTime}
                onChange={e => setInterviewTime(e.target.value)}
                className="bg-slate-50 border-slate-200 text-slate-950"
              />
            </div>

            {/* Mode */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Interview Mode</label>
              <Select value={interviewMode} onValueChange={setInterviewMode}>
                <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-950">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-50 border-slate-200">
                  <SelectItem value="video">Video Call</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                  <SelectItem value="technical">Technical Round</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message to Candidate */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Message to Candidate
              </label>
              <textarea
                value={recruiterMessage}
                onChange={e => setRecruiterMessage(e.target.value)}
                placeholder={`Hi ${selectedCandidate?.profile.anonymized_name?.split(" ")[0] ?? "there"}, we would like to invite you for an interview...`}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-sm rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleScheduleInterview}
                disabled={isScheduling}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isScheduling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Confirm Schedule
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowScheduleDialog(false)}
                className="border-slate-200 text-slate-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
