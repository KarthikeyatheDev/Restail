"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { 
  FileCode, 
  FileText, 
  Check, 
  Copy, 
  Download, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Briefcase
} from "lucide-react";
import { 
  fetchResumeById, 
  recompileResume, 
  ResumeRecord, 
  getDownloadTexUrl, 
  getDownloadPdfUrl, 
  getPdfPreviewUrl 
} from "@/lib/api";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const resumeId = resolvedParams.id;

  const [resume, setResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"latex" | "pdf" | "analysis" | "jd">("latex");
  const [copied, setCopied] = useState(false);
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [editedLatex, setEditedLatex] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchResumeById(resumeId)
      .then((data) => {
        setResume(data);
        setEditedLatex(data.tailored_latex);
        if (data.pdf_filename) {
          setActiveTab("pdf");
        }
      })
      .catch((err) => {
        setStatusMessage("Failed to load resume details.");
      })
      .finally(() => setLoading(false));
  }, [resumeId]);

  const handleCopy = () => {
    if (!resume) return;
    navigator.clipboard.writeText(editedLatex || resume.tailored_latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecompile = async () => {
    if (!resume) return;
    setIsRecompiling(true);
    setStatusMessage(null);
    try {
      const updated = await recompileResume(resume.id, editedLatex);
      setResume(updated);
      if (updated.compilation?.message) {
        setStatusMessage(updated.compilation.message);
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Compilation failed.");
    } finally {
      setIsRecompiling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
        <p className="text-sm text-zinc-500">Loading tailored resume...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-zinc-400 mx-auto" />
        <h2 className="text-lg font-semibold text-zinc-900">Resume Not Found</h2>
        <p className="text-sm text-zinc-500">The requested resume could not be retrieved.</p>
        <Link
          href="/history"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to History
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/history" className="hover:text-zinc-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> History
            </Link>
            <span>/</span>
            <span className="font-mono text-zinc-400">ID #{resume.id}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              {resume.job_title}
            </h1>
            <span className="text-sm text-zinc-400 font-normal">at</span>
            <span className="text-sm font-semibold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-md">
              {resume.company_name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {resume.match_score}% ATS Match
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-500" />}
            {copied ? "Copied LaTeX" : "Copy LaTeX"}
          </button>

          <a
            href={getDownloadTexUrl(resume.id)}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            Download .tex
          </a>

          {resume.pdf_filename && (
            <a
              href={getDownloadPdfUrl(resume.id)}
              download
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-zinc-200" />
              Download PDF
            </a>
          )}

          <button
            onClick={handleRecompile}
            disabled={isRecompiling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-100 transition-colors disabled:opacity-50"
            title="Recompile LaTeX to PDF"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-zinc-500 ${isRecompiling ? "animate-spin" : ""}`} />
            {isRecompiling ? "Compiling..." : "Recompile"}
          </button>

          <Link
            href="/tailor"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-zinc-800 transition-colors"
            title="Tailor another resume or adjust input"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-200" />
            Tailor New
          </Link>
        </div>
      </div>

      {/* Status banner if recompiled or compiler feedback */}
      {statusMessage && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-zinc-700">
            &times;
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("latex")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "latex"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <FileCode className="h-4 w-4" />
            LaTeX Source
          </button>

          <button
            onClick={() => setActiveTab("pdf")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "pdf"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            PDF Preview {resume.pdf_filename && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => setActiveTab("analysis")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "analysis"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            ATS Keyword Analysis
          </button>

          <button
            onClick={() => setActiveTab("jd")}
            className={`py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "jd"
                ? "border-zinc-900 text-zinc-900 font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Job Description
          </button>
        </nav>
      </div>

      {/* Tab 1: LaTeX Source Editor & Viewer */}
      {activeTab === "latex" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Compile-ready LaTeX code preserving template macros and layout</span>
            <div className="flex items-center gap-3">
              <span>{editedLatex.split("\n").length} lines</span>
              <span>&bull;</span>
              <button
                onClick={handleCopy}
                className="font-medium text-zinc-800 hover:underline inline-flex items-center gap-1"
              >
                {copied ? "Copied" : "Copy to Clipboard"}
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
            <textarea
              value={editedLatex}
              onChange={(e) => setEditedLatex(e.target.value)}
              rows={24}
              spellCheck={false}
              className="w-full p-4 font-mono text-xs leading-relaxed text-zinc-800 bg-zinc-50/40 focus:bg-white focus:outline-none resize-y selection:bg-zinc-200"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-zinc-400">
              Tip: You can edit LaTeX directly above and click &quot;Recompile&quot; to test your custom edits.
            </p>
            <button
              onClick={handleRecompile}
              disabled={isRecompiling}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isRecompiling ? "animate-spin" : ""}`} />
              Save & Recompile
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: PDF Preview */}
      {activeTab === "pdf" && (
        <div className="space-y-4">
          {resume.pdf_filename ? (
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-xs">
              <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between text-xs text-zinc-600">
                <span className="font-medium">Compiled PDF Document</span>
                <div className="flex items-center gap-3">
                  <a
                    href={getPdfPreviewUrl(resume.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-zinc-900 flex items-center gap-1 font-medium"
                  >
                    Open in New Tab <ExternalLink className="h-3 w-3" />
                  </a>
                  <a
                    href={getDownloadPdfUrl(resume.id)}
                    download
                    className="hover:text-zinc-900 flex items-center gap-1 font-medium"
                  >
                    Download <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <div className="w-full h-[750px] bg-zinc-100 flex items-center justify-center">
                <iframe
                  src={getPdfPreviewUrl(resume.id)}
                  className="w-full h-full border-none"
                  title="Tailored Resume PDF Preview"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center space-y-4">
              <FileText className="h-10 w-10 text-zinc-400 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-800">PDF Not Compiled</h3>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  A local LaTeX compiler (<code className="font-mono">pdflatex</code> or <code className="font-mono">tectonic</code>) was not detected. Your compile-ready <code className="font-mono">.tex</code> file is 100% complete and can be rendered with one click.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleRecompile}
                  disabled={isRecompiling}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRecompiling ? "animate-spin" : ""}`} />
                  Attempt Cloud Compile
                </button>

                <a
                  href={getDownloadTexUrl(resume.id)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-zinc-500" />
                  Download .tex for Overleaf
                </a>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 text-left max-w-lg mx-auto text-xs text-zinc-500 space-y-2">
                <span className="font-semibold text-zinc-700 block">How to view your PDF:</span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-600">
                  <li>Download the <code className="font-mono text-zinc-800">.tex</code> file above.</li>
                  <li>Open <a href="https://www.overleaf.com" target="_blank" rel="noreferrer" className="underline text-zinc-900">Overleaf.com</a> or your local TeX distribution (TeX Live / MiKTeX).</li>
                  <li>Click &quot;Compile&quot; to obtain your pristine PDF.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: ATS & Keyword Analysis */}
      {activeTab === "analysis" && (
        <div className="space-y-6">
          {/* Match Score Overview */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-medium tracking-wider text-zinc-400">Relevance Alignment</span>
              <h3 className="text-xl font-bold text-zinc-900 mt-0.5">ATS Alignment & Requirement Audit</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Generated via full multi-stage verification against your verified master resume and behavior rules.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-emerald-50/50">
                <span className="text-lg font-bold text-emerald-800">{resume.match_score}%</span>
              </div>
            </div>
          </div>

          {/* 3-Tier Requirement Coverage Audit Report */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Job Requirements Coverage Audit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Supported Requirements */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Supported ({resume.supported_requirements?.length || 0})
                  </h4>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Fully verified and backed by experience or projects in your master resume.
                </p>
                <div className="space-y-2 pt-1">
                  {resume.supported_requirements && resume.supported_requirements.length > 0 ? (
                    resume.supported_requirements.map((req, i) => (
                      <div key={i} className="text-xs bg-white border border-emerald-200/60 rounded-md p-2.5 text-zinc-800 shadow-2xs">
                        {req}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic">No explicit items recorded.</div>
                  )}
                </div>
              </div>

              {/* Partially Supported Requirements */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/30 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    Partially Supported ({resume.partially_supported_requirements?.length || 0})
                  </h4>
                </div>
                <p className="text-[11px] text-amber-700">
                  Related, foundational, or transferable skills present.
                </p>
                <div className="space-y-2 pt-1">
                  {resume.partially_supported_requirements && resume.partially_supported_requirements.length > 0 ? (
                    resume.partially_supported_requirements.map((req, i) => (
                      <div key={i} className="text-xs bg-white border border-amber-200/60 rounded-md p-2.5 text-zinc-800 shadow-2xs">
                        {req}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic">None identified.</div>
                  )}
                </div>
              </div>

              {/* Unsupported Requirements */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-zinc-400 shrink-0" />
                    Unsupported ({resume.unsupported_requirements?.length || 0})
                  </h4>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Required by JD but omitted to strictly preserve factual accuracy.
                </p>
                <div className="space-y-2 pt-1">
                  {resume.unsupported_requirements && resume.unsupported_requirements.length > 0 ? (
                    resume.unsupported_requirements.map((req, i) => (
                      <div key={i} className="text-xs bg-white border border-zinc-200 rounded-md p-2.5 text-zinc-700 shadow-2xs">
                        {req}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-zinc-400 italic">All requirements addressed!</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tailoring Summary */}
          {resume.summary && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Tailoring Rationale & Decisions
              </h3>
              <div className="text-xs text-zinc-700 leading-relaxed space-y-1.5 whitespace-pre-line bg-zinc-50/60 p-4 rounded-lg border border-zinc-100">
                {resume.summary}
              </div>
            </div>
          )}

          {/* Keywords Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Keywords */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Matched Keywords ({resume.matched_keywords?.length || 0})
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Identified in target JD and authentically present in your tailored resume.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {resume.matched_keywords && resume.matched_keywords.length > 0 ? (
                  resume.matched_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">No specific keywords recorded.</span>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Unmatched Job Keywords ({resume.missing_keywords?.length || 0})
                </h3>
              </div>
              <p className="text-xs text-zinc-500">
                Required by JD but omitted to preserve absolute fidelity with your real background.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {resume.missing_keywords && resume.missing_keywords.length > 0 ? (
                  resume.missing_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-xs font-medium rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-400">All core JD keywords addressed!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Target Job Description */}
      {activeTab === "jd" && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Original Job Description
            </h3>
            <span className="text-xs text-zinc-400">
              {resume.job_description.split(/\s+/).length} words
            </span>
          </div>
          <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100 text-xs text-zinc-700 leading-relaxed font-sans whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {resume.job_description}
          </div>
        </div>
      )}
    </div>
  );
}
