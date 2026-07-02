import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, Users, TrendingUp, Star, MapPin, DollarSign, Award, Activity, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar,
  AreaChart, Area,
} from "recharts";
import { trpc } from "@/lib/trpc";

// ─── Colour palettes ──────────────────────────────────────────────────────────
const SKILL_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

const WORK_MODE_COLORS: Record<string, string> = {
  remote: "#6366f1",
  hybrid: "#8b5cf6",
  onsite: "#22c55e",
  flexible: "#f59e0b",
};

const EXP_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7"];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-xl text-sm">
      {label && <p className="text-slate-600 mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill ?? "#94a3b8" }}>
          {p.name ?? p.dataKey}: <span className="font-bold text-slate-950">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Mini progress bar ────────────────────────────────────────────────────────
const ProgressBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
  <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
    <div
      className="h-full rounded-full transition-all duration-700"
      style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }}
    />
  </div>
);

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; trend?: string;
}) => (
  <Card className="bg-white border-slate-200 hover:border-slate-300 transition-colors">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: `${color}20` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-950">{value}</p>
      <p className="text-slate-600 text-xs mt-1">{label}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </CardContent>
  </Card>
);

export default function Analytics() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.analytics.getDatasetStats.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [loading, isAuthenticated, setLocation]);

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  // ── Derived data ──
  const topSkills = (stats?.topSkills ?? []).slice(0, 10).map((s, i) => ({
    ...s,
    fill: SKILL_COLORS[i % SKILL_COLORS.length],
  }));

  const workMode = (stats?.workModeDistribution ?? []).map(w => ({
    ...w,
    fill: WORK_MODE_COLORS[w.name?.toLowerCase()] ?? "#94a3b8",
  }));

  const expLevels = (stats?.experienceLevels ?? []).map((e, i) => ({
    ...e,
    fill: EXP_COLORS[i % EXP_COLORS.length],
  }));

  const scoreDistrib = (stats?.scoreDistribution ?? []);

  const locations = (stats?.locationDistribution ?? []).slice(0, 8);

  const trustMetrics = [
    { name: "Verified Email", value: stats?.verifiedEmailPct ?? 0, fill: "#6366f1" },
    { name: "LinkedIn Connected", value: stats?.linkedinConnectedPct ?? 0, fill: "#3b82f6" },
    { name: "Willing to Relocate", value: stats?.willingToRelocatePct ?? 0, fill: "#22c55e" },
    { name: "Open to Work", value: stats?.totalCandidates
        ? Math.round(((stats?.openToWork ?? 0) / stats.totalCandidates) * 100)
        : 0, fill: "#f59e0b" },
  ];

  // Salary area chart mock progression (min→max per band)
  const salaryAreaData = [
    { band: "Junior", min: 4, max: 8 },
    { band: "Mid", min: 8, max: 14 },
    { band: "Senior", min: 14, max: 24 },
    { band: "Lead", min: 22, max: 38 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Analytics Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Live insights from <span className="text-blue-400 font-medium">{stats?.totalCandidates ?? 0}</span> candidate profiles in the dataset
          </p>
        </div>

        {/* ── KPI row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Candidates" value={stats?.totalCandidates ?? 0}
            icon={Users} color="#6366f1" trend="Live" />
          <KpiCard label="Open to Work" value={stats?.openToWork ?? 0}
            sub={`of ${stats?.totalCandidates ?? 0} total`}
            icon={TrendingUp} color="#22c55e" />
          <KpiCard label="Avg Profile Score" value={`${stats?.avgProfileCompleteness ?? 0}%`}
            icon={Star} color="#f59e0b" />
          <KpiCard label="Avg Experience" value={`${stats?.avgYearsExperience ?? 0} yrs`}
            icon={Award} color="#8b5cf6" />
        </div>

        {/* ── Row 1: Skills + Work Mode ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Top Skills — horizontal bar */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Top 10 Skills in Demand</CardTitle>
              <CardDescription>Frequency of skills across all candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={topSkills} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis type="category" dataKey="skill" stroke="#64748b"
                    width={100} tick={{ fontSize: 11, fill: "#cbd5e1" }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} label={{ position: "right", fill: "#94a3b8", fontSize: 11 }}>
                    {topSkills.map((s, i) => (
                      <Cell key={i} fill={s.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Work Mode — donut pie */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Work Mode Preferences</CardTitle>
              <CardDescription>How candidates prefer to work</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={workMode}
                    cx="50%" cy="50%"
                    innerRadius={65} outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                  >
                    {workMode.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {workMode.map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: w.fill }} />
                    {w.name} ({w.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: Experience levels + Score distribution ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Experience levels — bar with gradient cells */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Experience Level Breakdown</CardTitle>
              <CardDescription>Candidate count by seniority tier</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={expLevels} margin={{ top: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}
                    label={{ position: "top", fill: "#94a3b8", fontSize: 12 }}>
                    {expLevels.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Profile score distribution */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950">Profile Score Distribution</CardTitle>
              <CardDescription>How complete candidates' profiles are</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={scoreDistrib}
                    cx="50%" cy="50%"
                    outerRadius={105}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#475569" }}
                  >
                    {scoreDistrib.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.fill ?? SKILL_COLORS[i % SKILL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-slate-700 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Location + Trust signals ── */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Top Locations */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                Top Locations
              </CardTitle>
              <CardDescription>Cities with the most candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mt-1">
                {locations.map((loc: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-800">{loc.name}</span>
                      <span className="text-slate-600 font-medium">{loc.value} candidates</span>
                    </div>
                    <ProgressBar
                      value={loc.value}
                      max={locations[0]?.value ?? 1}
                      color={SKILL_COLORS[i % SKILL_COLORS.length]}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trust & Verification Signals */}
          <Card className="bg-white border-slate-200">
            <CardHeader>
              <CardTitle className="text-slate-950 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Trust & Verification
              </CardTitle>
              <CardDescription>Candidate credibility signals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius={20} outerRadius={90}
                  data={trustMetrics}
                  startAngle={90} endAngle={-270}
                >
                  <RadialBar
                    label={{ position: "insideStart", fill: "#fff", fontSize: 10 }}
                    background={{ fill: "#1e293b" }}
                    dataKey="value"
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-slate-700 text-xs">{value}</span>}
                    iconSize={8}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {trustMetrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.fill }} />
                    <span className="text-xs text-slate-600">{m.name}</span>
                    <span className="text-xs font-bold ml-auto" style={{ color: m.fill }}>{m.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Salary range area chart ── */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              Expected Salary Range by Seniority (INR LPA)
            </CardTitle>
            <CardDescription>
              Min–Max salary expectations across experience bands &mdash; dataset avg: {stats?.avgSalaryMin ?? 0}–{stats?.avgSalaryMax ?? 0} LPA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={salaryAreaData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="band" stroke="#64748b" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(v) => `₹${v}L`} />
                <Tooltip content={<DarkTooltip />}
                  formatter={(v: any) => [`₹${v} LPA`]} />
                <Area type="monotone" dataKey="max" name="Max Salary"
                  stroke="#6366f1" fill="url(#maxGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="min" name="Min Salary"
                  stroke="#22c55e" fill="url(#minGrad)" strokeWidth={2} />
                <Legend formatter={(v) => <span className="text-slate-700 text-xs">{v}</span>} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ── Row 5: Key metrics summary ── */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              label: "Average Salary Range",
              value: `₹${stats?.avgSalaryMin ?? 0}–${stats?.avgSalaryMax ?? 0} LPA`,
              sub: "Expected across all candidates",
              color: "#22c55e",
              icon: Activity,
            },
            {
              label: "Verified Email",
              value: `${stats?.verifiedEmailPct ?? 0}%`,
              sub: "Of all candidate accounts",
              color: "#3b82f6",
              icon: CheckCircle,
            },
            {
              label: "Willing to Relocate",
              value: `${stats?.willingToRelocatePct ?? 0}%`,
              sub: "Ready for on-site opportunities",
              color: "#a855f7",
              icon: MapPin,
            },
          ].map((m, i) => (
            <Card key={i} className="bg-white border-slate-200">
              <CardContent className="pt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg" style={{ background: `${m.color}20` }}>
                    <m.icon className="h-4 w-4" style={{ color: m.color }} />
                  </div>
                  <span className="text-slate-600 text-sm">{m.label}</span>
                </div>
                <p className="text-3xl font-bold text-slate-950">{m.value}</p>
                <p className="text-xs text-slate-500 mt-1">{m.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
