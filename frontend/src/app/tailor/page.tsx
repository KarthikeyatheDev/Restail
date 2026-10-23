"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Briefcase, 
  FileText, 
  Loader2,
  CheckCircle2,
  FileCode,
  Info
} from "lucide-react";
import { generateTailoredResume, fetchFilesStatus, SourceFilesStatusResponse } from "@/lib/api";

const SAMPLE_JD = `Role: Senior Full Stack Engineer
Company: CloudScale Dynamics

About the Role:
We are looking for a Senior Full Stack Engineer proficient in Python, TypeScript, React/Next.js, and PostgreSQL to build scalable cloud-native architectures. You will lead the design and implementation of distributed APIs, optimize database queries, and craft high-performance, responsive web interfaces.

Key Requirements:
- 3+ years experience with modern web technologies: Python (Flask/FastAPI/Django), React, Next.js, and TypeScript.
- Strong knowledge of relational databases (PostgreSQL), schema design, and query optimization.
- Familiarity with containerization (Docker), CI/CD pipelines, and cloud environments (AWS/GCP).
- Experience designing RESTful APIs and microservice patterns.
- Passion for clean, maintainable code, unit testing, and agile collaboration.`;

export default function TailorPage() {
  const router = useRouter();
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileStatus, setFileStatus] = useState<SourceFilesStatusResponse | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    "Reading personal behavior rules & master resume repository...",
    "Extracting job requirements & cross-referencing verified achievements...",
    "Selecting optimal bullet points and formatting into target LaTeX template...",
    "Compiling document & generating ATS keyword analysis...",
  ];

  useEffect(() => {
    fetchFilesStatus()
      .then((data) => setFileStatus(data))
      .catch(() => null);
  }, []);

  // Multi-stage progress indicator effect
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setGenerationStep(0);
      interval = setInterval(() => {
        setGenerationStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateTailoredResume({
        job_description: jobDescription,
        job_title: jobTitle,
        company_name: companyName,
      });

      router.push(`/results/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to tailor resume. Please check your setup.");
      setIsGenerating(false);
    }
  };

  const wordCount = jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          Tailor Resume
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Paste the job description below. Restail will select matching experiences from your master resume and compile a high-fidelity LaTeX resume.
        </p>
      </div>

      {/* Source File Status Warning if incomplete */}
      {fileStatus && !fileStatus.all_ready && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-900">Personal source files need configuration</p>
            <p className="text-amber-700">
              Your source files in <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">data/</code> are not yet set up. Restail requires <code className="font-mono font-medium">behavior.md</code>, <code className="font-mono font-medium">master_resume.tex</code>, and <code className="font-mono font-medium">sample_resume.tex</code> to generate authentic resumes without fabricating information.
            </p>
            <div className="pt-1">
              <Link
                href="/settings"
                className="font-semibold text-amber-950 underline hover:text-black inline-flex items-center gap-1"
              >
                Go to Settings to configure your files &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-rose-900">Generation Error</p>
            <p className="text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200/90 bg-white p-6 shadow-xs space-y-6">
          {/* Target Company & Role Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Target Role / Job Title <span className="text-zinc-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  disabled={isGenerating}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Target Company Name <span className="text-zinc-400 font-normal lowercase">(optional)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Stripe, Linear, or Startup"
                  disabled={isGenerating}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700">
                Job Description <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setJobDescription(SAMPLE_JD);
                    if (!jobTitle) setJobTitle("Senior Full Stack Engineer");
                    if (!companyName) setCompanyName("CloudScale Dynamics");
                  }}
                  disabled={isGenerating}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 underline transition-colors"
                >
                  Load Sample Job Description
                </button>
                <span className="text-xs text-zinc-400">
                  {wordCount} {wordCount === 1 ? "word" : "words"}
                </span>
              </div>
            </div>

            <textarea
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete job posting here (responsibilities, required qualifications, tech stack)..."
              disabled={isGenerating}
              required
              className="w-full p-4 text-sm font-sans rounded-xl border border-zinc-200 bg-zinc-50/30 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors leading-relaxed resize-y"
            />
          </div>

          {/* Notice & Guidelines */}
          <div className="rounded-lg bg-zinc-50 p-3.5 border border-zinc-200/60 flex items-start gap-2.5 text-xs text-zinc-600">
            <Info className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <span className="font-semibold text-zinc-800">Strict Fidelity Guarantee:</span> Restail prioritizes facts from your master resume and never fabricates experiences, metrics, or degrees.
            </div>
          </div>

          {/* Submit Button & Progress State */}
          <div className="pt-2 flex flex-col items-center gap-4">
            {isGenerating ? (
              <div className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 space-y-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-900" />
                  <span className="text-sm font-semibold text-zinc-900">Tailoring Your Resume</span>
                </div>

                <div className="text-xs text-zinc-600 max-w-md mx-auto min-h-[20px] transition-all">
                  {steps[generationStep]}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden max-w-md mx-auto">
                  <div
                    className="bg-zinc-900 h-1.5 transition-all duration-700 ease-out"
                    style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={isGenerating || !jobDescription.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Generate Tailored Resume
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
