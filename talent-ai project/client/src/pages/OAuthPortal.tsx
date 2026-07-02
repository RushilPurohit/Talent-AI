import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Mail, Lock, User, Shield, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function OAuthPortal() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"recruiter" | "admin">("recruiter");
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Logged in successfully!");
      await refresh();
      setLocation("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to log in. Please check your credentials.");
    },
  });

  const signupMutation = trpc.auth.signUp.useMutation({
    onSuccess: async () => {
      toast.success("Account created successfully!");
      await refresh();
      setLocation("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign up.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signin") {
      if (!email || !password) {
        toast.error("Please fill in all fields.");
        return;
      }
      loginMutation.mutate({ email, password });
    } else {
      if (!name || !email || !password) {
        toast.error("Please fill in all fields.");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      signupMutation.mutate({ name, email, password, role });
    }
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Card className="w-full max-w-md mx-4 bg-white/95 border-slate-200 shadow-2xl backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-600/10 p-3 rounded-full border border-blue-500/20">
              <Brain className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-950 tracking-tight">
            {mode === "signin" ? "Sign In to TalentAI" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {mode === "signin"
              ? "Access your recruitment dashboard"
              : "Register as a Recruiter or Admin"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white border-slate-200 text-slate-950 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  type="email"
                  placeholder="recruiter@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-slate-200 text-slate-950 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-950 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Choose Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("recruiter")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "recruiter"
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    disabled={isLoading}
                  >
                    <User className="h-4 w-4" />
                    Recruiter
                    {role === "recruiter" && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                      role === "admin"
                        ? "bg-purple-600/10 border-purple-500 text-purple-400"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                    disabled={isLoading}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                    {role === "admin" && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 mt-4 text-base font-semibold transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  {mode === "signin" ? "Sign In" : "Sign Up"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-2 pb-6">
          <div className="text-sm text-center text-slate-600">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
          {mode === "signin" && (
            <div className="border-t border-slate-200 w-full pt-3 text-center">
              <span className="text-xs text-slate-500">
                Default Accounts: recruiter@example.com (pw: password123)
              </span>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
