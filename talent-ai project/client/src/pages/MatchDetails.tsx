import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Target, Lightbulb, Award } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function MatchDetails() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Mock data for demonstration
  const matchData = {
    candidateName: "Alice Johnson",
    jobTitle: "Senior Full-Stack Developer",
    overallScore: 92,
    skillsScore: 95,
    experienceScore: 88,
    projectsScore: 90,
    educationScore: 85,
    certificationsScore: 80,
    activityScore: 85,
    
    matchedSkills: ["Python", "JavaScript", "React", "Node.js", "AWS"],
    missingSkills: ["Kubernetes", "GraphQL"],
    
    strengths: [
      "Extensive full-stack development experience with 5+ years",
      "Strong proficiency in all required core technologies",
      "Proven track record of delivering scalable web applications",
      "Multiple relevant professional certifications",
      "Active contributor to open-source projects"
    ],
    
    weaknesses: [
      "Limited experience with Kubernetes orchestration",
      "No specific GraphQL implementation experience",
      "Relatively new to microservices architecture"
    ],
    
    recommendations: [
      "Excellent fit for the role - proceed with technical interview",
      "Focus interview on microservices architecture experience",
      "Consider onboarding plan for Kubernetes learning",
      "Potential for immediate contribution to core features"
    ],
    
    interviewQuestions: [
      {
        question: "Tell us about your experience with React and Node.js. What's the most complex application you've built?",
        category: "technical",
        difficulty: "medium"
      },
      {
        question: "Describe your approach to scaling a web application from 1000 to 1 million users.",
        category: "technical",
        difficulty: "hard"
      },
      {
        question: "Tell us about a time you had to refactor legacy code. What challenges did you face?",
        category: "experience",
        difficulty: "medium"
      },
      {
        question: "How do you approach learning new technologies or frameworks?",
        category: "behavioral",
        difficulty: "easy"
      },
      {
        question: "Why are you interested in this Senior Full-Stack Developer position?",
        category: "behavioral",
        difficulty: "easy"
      }
    ]
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-blue-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500/20";
    if (score >= 80) return "bg-blue-500/20";
    if (score >= 70) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Match Analysis</h1>
          <p className="text-slate-600 mt-2">
            {matchData.candidateName} → {matchData.jobTitle}
          </p>
        </div>

        {/* Overall Score */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-700 text-sm mb-1">Overall AI Match Score</p>
                <p className="text-slate-600 text-sm">Candidate-Job Compatibility</p>
              </div>
              <div className={`text-6xl font-bold ${getScoreColor(matchData.overallScore)}`}>
                {matchData.overallScore}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950">Score Breakdown</CardTitle>
            <CardDescription>Component-wise scoring analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: "Skills Match", score: matchData.skillsScore, weight: "40%" },
                { label: "Experience Match", score: matchData.experienceScore, weight: "25%" },
                { label: "Projects Match", score: matchData.projectsScore, weight: "15%" },
                { label: "Education Match", score: matchData.educationScore, weight: "10%" },
                { label: "Certifications Match", score: matchData.certificationsScore, weight: "5%" },
                { label: "Activity Score", score: matchData.activityScore, weight: "5%" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-700">{item.label}</span>
                    <div className="flex gap-2">
                      <span className={`font-semibold ${getScoreColor(item.score)}`}>
                        {item.score}%
                      </span>
                      <span className="text-slate-500">({item.weight})</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getScoreBgColor(item.score)}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Skills Analysis */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Matched Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matchData.matchedSkills.map((skill) => (
                  <Badge key={skill} className="bg-green-500/20 text-green-400 border-green-500/50">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Missing Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {matchData.missingSkills.map((skill) => (
                  <Badge key={skill} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {matchData.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Weaknesses */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {matchData.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-400" />
              Hiring Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {matchData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3">
                  <Target className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Interview Questions */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950 flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-400" />
              Suggested Interview Questions
            </CardTitle>
            <CardDescription>AI-generated questions tailored to this candidate and role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matchData.interviewQuestions.map((q, idx) => (
                <div key={idx} className="border-l-2 border-slate-200 pl-4 py-2">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-slate-950 font-medium pr-2">{q.question}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-slate-50 text-slate-700 border-slate-200">
                      {q.category}
                    </Badge>
                    <Badge className={`${
                      q.difficulty === "hard" ? "bg-red-500/20 text-red-400" :
                      q.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-green-500/20 text-green-400"
                    }`}>
                      {q.difficulty}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            Schedule Interview
          </Button>
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-700">
            Send Feedback
          </Button>
          <Button variant="outline" className="flex-1 border-slate-200 text-slate-700">
            Export Report
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
