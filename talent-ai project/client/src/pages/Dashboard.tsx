import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, Users, Briefcase, Zap, MessageSquare, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.getMetrics.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading || metricsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back, {user.name || "Recruiter"}!</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">Total Candidates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-950">{metrics?.totalCandidates || 0}</div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-600 mt-2">{metrics?.totalCandidates === 0 ? "No candidates yet" : "Active candidates"}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">Total Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-950">{metrics?.totalJobs || 0}</div>
                <Briefcase className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-600 mt-2">{metrics?.totalJobs === 0 ? "No jobs posted" : "Active jobs"}</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">AI Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-950">{metrics?.aiMatches || 0}</div>
                <Zap className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-600 mt-2">Pending matches</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">Interviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-950">{metrics?.interviews || 0}</div>
                <MessageSquare className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-600 mt-2">Scheduled</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">Hiring Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-slate-950">{metrics?.hiringRate || 0}%</div>
                <TrendingUp className="h-8 w-8 text-red-500 opacity-50" />
              </div>
              <p className="text-xs text-slate-600 mt-2">Conversion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Quick Start</CardTitle>
              <CardDescription>Get started with TalentAI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setLocation("/jobs")} className="w-full bg-blue-600 hover:bg-blue-700">Create Job Posting</Button>
              <Button onClick={() => setLocation("/resumes")} variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
                Upload Resumes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Recent Activity</CardTitle>
              <CardDescription>No activity yet</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">Your recent activities will appear here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
