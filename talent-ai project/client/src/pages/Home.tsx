import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Loader2, Zap, Users, TrendingUp, Brain, LogOut, LayoutDashboard } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  // When already signed in, show a clear screen instead of silently redirecting
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center space-y-6 p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600/10 p-4 rounded-full border border-blue-500/20">
              <Brain className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-950">Welcome back, {user.name || "User"}</h1>
          <p className="text-slate-600">You are already signed in to TalentAI.</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setLocation("/dashboard")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button
              onClick={async () => {
                await logout();
                window.location.href = "/";
              }}
              variant="outline"
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 py-6 text-base"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-slate-950">TalentAI</span>
          </div>
          <Button onClick={() => {window.location.href=getLoginUrl()}} className="bg-blue-600 hover:bg-blue-700">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-950 mb-6 leading-tight">
            TalentAI - Explainable AI Hiring Intelligence
          </h1>
          <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
            Discover the perfect candidates with intelligent semantic matching, explainable AI rankings, and data-driven hiring decisions.
          </p>
          <Button
            onClick={() => { window.location.href = getLoginUrl()}}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            Get Started Now
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <Card className="bg-white border-slate-200 hover:border-blue-500 transition-colors">
            <CardHeader>
              <Zap className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-slate-950">AI Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Semantic similarity scoring that understands skills beyond keywords.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:border-blue-500 transition-colors">
            <CardHeader>
              <Users className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-slate-950">Candidate Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Comprehensive profiles with extracted skills, experience, and achievements.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:border-blue-500 transition-colors">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-slate-950">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Real-time hiring metrics and candidate distribution insights.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 hover:border-blue-500 transition-colors">
            <CardHeader>
              <Brain className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle className="text-slate-950">Explainable AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Transparent scoring with detailed explanations for every ranking.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16 mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Hiring?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join recruiters who are making smarter hiring decisions with AI.
          </p>
          <Button
            onClick={() =>{ window.location.href=getLoginUrl()}}
            size="lg"
            className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-6 text-lg font-semibold"
          >
            Start Recruiting Smarter
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>&copy; 2026 TalentAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
