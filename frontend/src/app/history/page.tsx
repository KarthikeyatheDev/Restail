"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  History, 
  Search, 
  Download, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  FileCode, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Filter
} from "lucide-react";
import { fetchResumes, deleteResume, ResumeRecord, getDownloadTexUrl, getDownloadPdfUrl } from "@/lib/api";

export default function HistoryPage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadResumes = async () => {
    try {
      const data = await fetchResumes();
      setResumes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tailored resume record?")) return;
    setDeletingId(id);
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      alert("Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResumes = resumes.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.job_title.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      r.matched_keywords?.some((k) => k.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
            Generation History
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Archive of all previously tailored LaTeX resumes and ATS alignment reports.
          </p>
        </div>
        <Link
          href="/tailor"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors self-start sm:self-auto"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tailor New
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by job title, company, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-colors"
          />
        </div>
        <span className="text-xs text-zinc-400">
          Showing {filteredResumes.length} of {resumes.length}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
          <p className="mt-2 text-xs text-zinc-500">Loading history records...</p>
        </div>
      ) : filteredResumes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 p-12 text-center">
          <History className="mx-auto h-8 w-8 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-800">
            {searchQuery ? "No matching resumes found" : "No tailored resumes yet"}
          </h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search terms or clear the filter."
              : "Generate a tailored resume to see it archived here."}
          </p>
          {!searchQuery && (
            <Link
              href="/tailor"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              Start Tailoring Now
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xs">
          <div className="divide-y divide-zinc-100">
            {filteredResumes.map((resume) => (
              <div
                key={resume.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-zinc-50/70 transition-colors gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/results/${resume.id}`}
                      className="text-sm font-semibold text-zinc-900 hover:text-zinc-700 transition-colors"
                    >
                      {resume.job_title}
                    </Link>
                    <span className="text-zinc-300">&bull;</span>
                    <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                      {resume.company_name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.2 text-[11px] font-medium text-emerald-700 border border-emerald-200/50">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      {resume.match_score}% Match
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(resume.created_at).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <span>&bull;</span>
                    <span>{resume.pdf_filename ? "PDF Compiled" : "LaTeX Ready"}</span>
                    {resume.matched_keywords && resume.matched_keywords.length > 0 && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate max-w-xs text-zinc-500">
                          {resume.matched_keywords.slice(0, 3).join(", ")}
                          {resume.matched_keywords.length > 3 ? "..." : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/results/${resume.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                  >
                    View
                    <ArrowRight className="h-3 w-3 text-zinc-400" />
                  </Link>

                  <a
                    href={getDownloadTexUrl(resume.id)}
                    download
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                    title="Download .tex"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>

                  <button
                    onClick={() => handleDelete(resume.id)}
                    disabled={deletingId === resume.id}
                    className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                    title="Delete resume"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
