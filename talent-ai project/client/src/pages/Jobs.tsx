import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Edit2, Trash2, Globe } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const jobDescriptionPresets = [
  {
    label: "AI Engineer",
    title: "Senior AI Engineer - Founding Team",
    location: "Pune/Noida, India (Hybrid)",
    description:
      "Build the intelligence layer for an AI-native talent intelligence platform. Own retrieval, ranking, matching systems, model evaluation, and LLM-powered product features from prototype to production.",
    requirements:
      "Required:\n- Production experience with embeddings-based retrieval systems\n- Vector databases or hybrid search experience with Pinecone, Weaviate, Milvus, Qdrant, OpenSearch, Elasticsearch, or FAISS\n- Strong Python skills\n- Experience designing ranking evaluation with NDCG, MRR, MAP, or similar metrics\n- 5-9 years of ML/AI experience in product teams",
  },
  {
    label: "Full Stack",
    title: "Full Stack Product Engineer",
    location: "Bengaluru, India (Hybrid)",
    description:
      "Design and ship recruiter-facing workflows across React, Node.js, APIs, dashboards, and data-heavy product surfaces. Collaborate with product and AI teams to turn matching intelligence into usable hiring tools.",
    requirements:
      "Required:\n- React, TypeScript, Node.js, and REST or tRPC API experience\n- Strong database fundamentals with SQL or document stores\n- Experience building dashboards, forms, filters, and workflow tools\n- Comfort working with authentication, file uploads, and analytics\n- 3-7 years of product engineering experience",
  },
  {
    label: "Data Analyst",
    title: "People Analytics Data Analyst",
    location: "Gurugram, India (Onsite)",
    description:
      "Analyze hiring funnels, candidate quality signals, recruiter productivity, and workforce trends. Build reports and insights that help talent teams make faster and fairer hiring decisions.",
    requirements:
      "Required:\n- Advanced SQL and spreadsheet analysis\n- Experience with Python, pandas, Power BI, Tableau, or Looker\n- Ability to define metrics and communicate insights clearly\n- Understanding of funnel analysis, cohort analysis, and operational dashboards\n- 2-5 years in analytics or business intelligence",
  },
  {
    label: "ML Ops",
    title: "Machine Learning Operations Engineer",
    location: "Remote, India",
    description:
      "Operate production ML systems for candidate matching, model monitoring, data pipelines, and automated evaluation. Improve reliability, observability, and deployment speed for AI services.",
    requirements:
      "Required:\n- Python, Docker, CI/CD, and cloud deployment experience\n- Experience with model serving, monitoring, and batch pipelines\n- Familiarity with vector search, feature stores, or ML experiment tracking\n- Strong debugging and production incident response skills\n- 4-8 years in platform, data, or ML engineering",
  },
];

export default function Jobs() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [formData, setFormData] = useState({ title: "", description: "", requirements: "", location: "" });

  const { data: jobs, isLoading: jobsLoading, refetch } = trpc.jobs.list.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const createMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Job created successfully");
      setFormData({ title: "", description: "", requirements: "", location: "" });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job");
    },
  });

  const updateMutation = trpc.jobs.update.useMutation({
    onSuccess: () => {
      toast.success("Job updated successfully");
      setEditingJob(null);
      setFormData({ title: "", description: "", requirements: "", location: "" });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update job");
    },
  });

  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete job");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  if (loading || jobsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" />
          <p className="text-slate-700">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    if (editingJob) {
      updateMutation.mutate({
        id: editingJob.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (job: any) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements || "",
      location: job.location || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (jobId: number) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      deleteMutation.mutate({ id: jobId });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Job Postings</h1>
            <p className="text-slate-600 mt-2">Manage your job postings and descriptions</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  setEditingJob(null);
                  setFormData({ title: "", description: "", requirements: "", location: "" });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-slate-200 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-slate-950">{editingJob ? "Edit Job" : "Create New Job"}</DialogTitle>
                <DialogDescription>
                  {editingJob ? "Update the job details" : "Create a new job posting with description and requirements"}
                </DialogDescription>
              </DialogHeader>
              {!editingJob && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-3">
                  <span className="text-xs text-slate-700">Quick fill with a job description template</span>
                  <div className="flex flex-wrap gap-2">
                    {jobDescriptionPresets.map(preset => (
                      <Button
                        key={preset.label}
                        size="sm"
                        variant="secondary"
                        type="button"
                        className="bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 border border-blue-500/20 text-xs"
                        onClick={() => setFormData({
                          title: preset.title,
                          location: preset.location,
                          description: preset.description,
                          requirements: preset.requirements,
                        })}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Job Title</label>
                  <Input
                    placeholder="e.g., Senior Python Developer"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Location</label>
                  <Input
                    placeholder="e.g., San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-950 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Job Description</label>
                  <Textarea
                    placeholder="Describe the role, responsibilities, and what you're looking for..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-950 mt-1 h-32"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Requirements</label>
                  <Textarea
                    placeholder="List the required skills, experience, and qualifications..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="bg-slate-50 border-slate-200 text-slate-950 mt-1 h-24"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-slate-200 text-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Job"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Jobs List */}
        <div className="grid gap-4">
          {jobs && jobs.length > 0 ? (
            jobs.map((job: any) => (
              <Card key={job.id} className="bg-white border-slate-200 hover:border-blue-500 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-slate-950">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2">
                        <Globe className="h-4 w-4" />
                        {job.location || "Remote"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(job)}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(job.id)}
                        className="border-slate-200 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 text-sm mb-3">{job.description}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="px-2 py-1 bg-slate-50 text-slate-700 rounded">
                      Status: {job.status}
                    </span>
                    <span className="px-2 py-1 bg-slate-50 text-slate-700 rounded">
                      Created: {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <p className="text-slate-600 text-center py-8">No jobs created yet. Create your first job posting!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
