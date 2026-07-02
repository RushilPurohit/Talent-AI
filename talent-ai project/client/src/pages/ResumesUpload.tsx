import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, Database, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ResumesUpload() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [checkingProgress, setCheckingProgress] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setLocation("/");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Load resumes from database using tRPC
  const { data: dbResumes, isLoading: dbResumesLoading, refetch: refetchResumes } = trpc.resumes.list.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: File[]) => {
    const validFiles = files.filter(file => {
      const isPDF = file.type === "application/pdf";
      const isDOCX = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      
      if (!isPDF && !isDOCX) {
        toast.error(`${file.name} is not a valid format. Please upload PDF or DOCX files.`);
        return false;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      for (const file of validFiles) {
        const fileId = Math.random();
        const newFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          status: "processing",
          uploadedAt: new Date(),
          parsedData: null,
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        
        try {
          // STEP 1: Uploading
          setCheckingProgress(prev => ({ ...prev, [fileId]: "1. Uploading file to storage..." }));
          const base64Content = await readFileAsBase64(file);
          await new Promise(r => setTimeout(r, 800)); // processing visual delay
          
          // STEP 2: Extraction
          setCheckingProgress(prev => ({ ...prev, [fileId]: "2. Extracting skills & qualifications..." }));
          await new Promise(r => setTimeout(r, 800)); // processing visual delay
          
          // STEP 3: DB Storing
          setCheckingProgress(prev => ({ ...prev, [fileId]: "3. Storing in database..." }));
          
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              content: base64Content,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to upload file to backend");
          }

          const result = await response.json();
          
          // Update file status to completed
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: "completed", parsedData: result.resume?.parsedData }
                : f
            )
          );
          
          toast.success(`${file.name} checked, uploaded, and saved successfully!`);
          refetchResumes(); // reload db list
        } catch (error) {
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === fileId 
                ? { ...f, status: "error" }
                : f
            )
          );
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    } catch (error) {
      toast.error("Failed to upload resumes");
    } finally {
      setIsUploading(false);
    }
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Resume Upload</h1>
          <p className="text-slate-600 mt-2">Upload, check, and store resumes with AI extraction</p>
        </div>

        {/* Upload Area */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-slate-950">Upload Resumes</CardTitle>
            <CardDescription>Drag and drop or click to upload PDF or DOCX files</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <Upload className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-950 mb-2">Drop your resumes here</h3>
              <p className="text-slate-600 mb-4">or</p>
              <label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx"
                  onChange={handleFileInput}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  asChild
                  className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  disabled={isUploading}
                >
                  <span>
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-slate-500 mt-4">
                Supported formats: PDF, DOCX (Max 10MB per file)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Files Checking Progress */}
        {uploadedFiles.length > 0 && (
          <Card className="bg-white border-slate-200 animate-in fade-in duration-300">
            <CardHeader>
              <CardTitle className="text-slate-950">Upload Progress & Verification</CardTitle>
              <CardDescription>{uploadedFiles.length} file(s) processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col p-4 bg-slate-50 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-slate-950 font-medium">{file.name}</p>
                          <p className="text-xs text-slate-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "processing" && (
                          <div className="flex items-center gap-2 text-blue-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-semibold">Checking...</span>
                          </div>
                        )}
                        {file.status === "completed" && (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">Ready in Database</span>
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm font-semibold">Failed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step description */}
                    {file.status === "processing" && (
                      <div className="bg-slate-50 px-3 py-2 rounded border border-blue-500/20 flex items-center justify-between text-xs">
                        <span className="text-blue-300 font-mono animate-pulse">
                          {checkingProgress[file.id] || "Analyzing document..."}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumes in Database List */}
        <Card className="bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-slate-950 flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                Resumes in Database
              </CardTitle>
              <CardDescription>Verified and stored resumes available for matching</CardDescription>
            </div>
            <Button onClick={() => refetchResumes()} variant="outline" size="sm" className="border-slate-200 text-slate-700">
              Refresh List
            </Button>
          </CardHeader>
          <CardContent>
            {dbResumesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
              </div>
            ) : dbResumes && dbResumes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-700">
                  <thead className="text-xs uppercase bg-white/80 text-slate-600">
                    <tr>
                      <th scope="col" className="px-6 py-3 rounded-l-lg">Filename</th>
                      <th scope="col" className="px-6 py-3">File Location</th>
                      <th scope="col" className="px-6 py-3">Skills Identified</th>
                      <th scope="col" className="px-6 py-3">Exp</th>
                      <th scope="col" className="px-6 py-3 rounded-r-lg">Date Stored</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbResumes.map((resume: any) => (
                      <tr key={resume.id} className="border-b border-slate-200 hover:bg-slate-100 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-950 flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          {resume.fileName}
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={resume.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline font-mono text-xs"
                          >
                            {resume.fileUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {resume.parsedData?.skills?.map((s: string) => (
                              <span key={s} className="px-1.5 py-0.5 bg-slate-50 text-slate-700 text-xs rounded">
                                {s}
                              </span>
                            )) || <span className="text-slate-500">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {resume.parsedData?.experience ?? 0}y
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6">No resumes stored in database yet. Try uploading one above!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
