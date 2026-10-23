"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  Percent, 
  Layers, 
  FileCode,
  Download,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { fetchFilesStatus, fetchResumes, SourceFilesStatusResponse, ResumeRecord } from "@/lib/api";

export default function Dashboard() {
  const [fileStatus, setFileStatus] = useState<SourceFilesStatusResponse | null>(null);
  const [recentResumes, setRecentResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [files, resumes] = await Promise.all([
          fetchFilesStatus().catch(() => null),
          fetchResumes(5).catch(() => []),
        ]);
        if (files) setFileStatus(files);
        if (resumes) setRecentResumes(resumes);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalGenerated = recentResumes.length;
  const avgScore = totalGenerated > 0 
    ? Math.round(recentResumes.reduce((acc, r) => acc + (r.match_score || 0), 0) / totalGenerated)
    : 0;

  return (
    <div className="space-y-8">
      {/* Hero / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Resume Tailoring Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fidelity-first LaTeX resume tailoring powered by your personal master documents.
          </p>
        </div>
        <Link
          href="/tailor"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800"
        >
          <Sparkles className="h-4 w-4" />
          Tailor Resume
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium uppercase tracking-wider">
            <span>Source Files</span>
            <Layers className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">
              {fileStatus
                ? Object.values(fileStatus.files).filter((f) => f.exists && f.has_content).length
                : 0}
              <span className="text-sm font-normal text-zinc-400"> / 3 Ready</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {fileStatus?.all_ready ? "All source files detected and ready." : "Configuration required in Settings."}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium uppercase tracking-wider">
            <span>Resumes Generated</span>
            <FileCode className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{totalGenerated}</span>
            <span className="text-xs text-zinc-400 font-normal">tailored versions</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Stored with full LaTeX source & ATS metrics</p>
        </div>

        <div className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-medium uppercase tracking-wider">
            <span>Average ATS Match</span>
            <Percent className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{avgScore > 0 ? `${avgScore}%` : "—"}</span>
            <span className="text-xs text-emerald-600 font-medium">Keywords aligned</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Based on recent generations</p>
        </div>
      </div>

      {/* Source Files Status Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Personal Source Files</h2>
            <p className="text-xs text-zinc-500">The 3 core knowledge files that govern how your resume is generated.</p>
          </div>
          <Link
            href="/settings"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
          >
            Manage Files in Settings <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {fileStatus ? (
            Object.values(fileStatus.files).map((file) => {
              const isConfigured = file.exists && file.has_content;
              return (
                <div
                  key={file.name}
                  className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        data/{file.name}
                      </span>
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Pending
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900">{file.title}</h3>
                    <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{file.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                    <span>{isConfigured ? `${file.line_count} lines` : "Empty / Missing"}</span>
                    <Link
                      href="/settings"
                      className="text-xs font-medium text-zinc-900 hover:underline"
                    >
                      {isConfigured ? "View / Edit" : "Configure"} &rarr;
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 py-6 text-center text-sm text-zinc-400">Loading source files status...</div>
          )}
        </div>
      </div>

      {/* Recent Resumes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Recent Tailored Resumes</h2>
          {recentResumes.length > 0 && (
            <Link href="/history" className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
              View All History <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentResumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="mt-2 text-sm font-semibold text-zinc-800">No resumes tailored yet</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
              Paste a target job description to generate your first tailored LaTeX resume.
            </p>
            <Link
              href="/tailor"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Start Tailoring Now
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs">
            <div className="divide-y divide-zinc-100">
              {recentResumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/60 transition-colors gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/results/${resume.id}`}
                        className="text-sm font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                      >
                        {resume.job_title}
                      </Link>
                      <span className="text-xs text-zinc-400">&bull;</span>
                      <span className="text-xs font-medium text-zinc-600">{resume.company_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(resume.created_at).toLocaleDateString()}
                      </span>
                      <span>&bull;</span>
                      <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200/50">
                        {resume.match_score}% Match
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/results/${resume.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                    >
                      View Results
                      <ArrowRight className="h-3 w-3 text-zinc-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
