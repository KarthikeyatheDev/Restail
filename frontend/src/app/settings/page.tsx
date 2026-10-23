"use client";

import { useEffect, useState, useRef } from "react";
import { 
  Settings, 
  FileCode, 
  FileText, 
  Upload, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Edit3, 
  Eye, 
  Cpu, 
  Database, 
  Terminal,
  X,
  FilePlus,
  HelpCircle,
  Copy
} from "lucide-react";
import { 
  fetchFilesStatus, 
  fetchFileContent, 
  saveFileContent, 
  uploadSourceFile, 
  initFileTemplate, 
  fetchSettings,
  SourceFilesStatusResponse,
  SettingsResponse,
  SourceFileInfo
} from "@/lib/api";

export default function SettingsPage() {
  const [fileStatus, setFileStatus] = useState<SourceFilesStatusResponse | null>(null);
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Editor modal state
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorFeedback, setEditorFeedback] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTargetFile, setUploadTargetFile] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [files, sysSettings] = await Promise.all([
        fetchFilesStatus().catch(() => null),
        fetchSettings().catch(() => null),
      ]);
      if (files) setFileStatus(files);
      if (sysSettings) setSettings(sysSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenFileEditor = async (filename: string) => {
    setActiveFile(filename);
    setEditorLoading(true);
    setEditorFeedback(null);
    try {
      const data = await fetchFileContent(filename);
      setEditorContent(data.content || "");
    } catch (err: any) {
      setEditorContent("");
      setEditorFeedback("File currently does not exist on disk. You can paste content below and save.");
    } finally {
      setEditorLoading(false);
    }
  };

  const handleSaveEditor = async () => {
    if (!activeFile) return;
    setSaving(true);
    setEditorFeedback(null);
    try {
      await saveFileContent(activeFile, editorContent);
      setEditorFeedback("Saved successfully!");
      loadData();
    } catch (err: any) {
      setEditorFeedback(err.message || "Failed to save file.");
    } finally {
      setSaving(false);
    }
  };

  const handleInitTemplate = async (filename: string) => {
    if (!confirm(`Initialize starter structure for data/${filename}?`)) return;
    try {
      await initFileTemplate(filename);
      loadData();
      if (activeFile === filename) {
        handleOpenFileEditor(filename);
      }
    } catch (err: any) {
      alert("Failed to initialize template.");
    }
  };

  const triggerUpload = (filename: string) => {
    setUploadTargetFile(filename);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetFile) return;
    try {
      await uploadSourceFile(uploadTargetFile, file);
      loadData();
      alert(`Successfully uploaded ${uploadTargetFile}!`);
      if (activeFile === uploadTargetFile) {
        handleOpenFileEditor(uploadTargetFile);
      }
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploadTargetFile(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hidden file input for file replacement */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUploadChange}
        className="hidden"
      />

      {/* Header */}
      <div className="border-b border-zinc-200/80 pb-5">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
          Source Files & System Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your personal knowledge base, inspect LLM connectivity, and verify compilation status.
        </p>
      </div>

      {/* Source Files Replacement & Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Source Files Status</h2>
            <p className="text-xs text-zinc-500">
              Restail strictly tailors from these three local files. Missing files must be created or uploaded.
            </p>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" /> Refresh Status
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {fileStatus ? (
            Object.values(fileStatus.files).map((file: SourceFileInfo) => {
              const isConfigured = file.exists && file.has_content;
              return (
                <div
                  key={file.name}
                  className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-800">
                        data/{file.name}
                      </span>
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.2 rounded-full">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Ready ({file.line_count} lines)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.2 rounded-full">
                          <AlertCircle className="h-3 w-3 text-amber-600" /> Pending / Missing
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900">{file.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">{file.description}</p>
                    {file.last_modified && (
                      <p className="text-[11px] text-zinc-400">
                        Last updated: {new Date(file.last_modified).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => handleOpenFileEditor(file.name)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                      {isConfigured ? "Edit Content" : "Create & Edit"}
                    </button>

                    <button
                      onClick={() => triggerUpload(file.name)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
                      title="Upload file from computer to replace"
                    >
                      <Upload className="h-3.5 w-3.5 text-zinc-500" />
                      Replace / Upload
                    </button>

                    {!isConfigured && (
                      <button
                        onClick={() => handleInitTemplate(file.name)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors"
                        title="Initialize structure template with guide placeholders"
                      >
                        <FilePlus className="h-3.5 w-3.5 text-zinc-600" />
                        Init Template
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-zinc-400">Loading source files...</div>
          )}
        </div>
      </div>

      {/* In-Browser Editor / Viewer Modal/Drawer */}
      {activeFile && (
        <div className="rounded-xl border border-zinc-300 bg-white p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-zinc-700" />
              <h3 className="text-sm font-semibold text-zinc-900">
                Editing <span className="font-mono text-zinc-600">data/{activeFile}</span>
              </h3>
            </div>
            <button
              onClick={() => setActiveFile(null)}
              className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {editorFeedback && (
            <div className="rounded-md bg-zinc-50 border border-zinc-200 p-2.5 text-xs text-zinc-700">
              {editorFeedback}
            </div>
          )}

          {editorLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading file content...</div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                rows={16}
                spellCheck={false}
                placeholder="Paste or write your file content here..."
                className="w-full p-4 font-mono text-xs leading-relaxed text-zinc-800 bg-zinc-50/50 rounded-lg border border-zinc-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 resize-y"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {editorContent.split("\n").length} lines &bull; {editorContent.length} characters
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveFile(null)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-lg border border-zinc-200 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditor}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System & LLM Configuration Diagnostics */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">System & AI Diagnostics</h2>
          <p className="text-xs text-zinc-500">
            Current runtime configuration detected from environment variables.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LLM Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-zinc-400" /> AI Provider
              </span>
              <span className="capitalize font-mono text-zinc-700">
                {settings?.llm.active_provider || "simulation"}
              </span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {settings?.llm.is_simulated ? (
                <span className="text-amber-700 font-medium">
                  Running in Simulation mode. Add GEMINI_API_KEY or OPENAI_API_KEY in backend/.env for live LLM tailoring.
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  Active LLM connected and ready for tailoring requests.
                </span>
              )}
            </p>
            <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 space-y-1">
              <div>Gemini: {settings?.llm.providers.gemini.configured ? "Configured" : "Not set"}</div>
              <div>OpenAI: {settings?.llm.providers.openai.configured ? "Configured" : "Not set"}</div>
            </div>
          </div>

          {/* Database Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-zinc-400" /> Database
              </span>
              <span className="font-mono text-zinc-700">{settings?.database.type || "SQLite"}</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              {settings?.database.type === "PostgreSQL"
                ? "Connected to PostgreSQL server via SQLAlchemy."
                : "Using lightweight local SQLite database (restail.db). Set DATABASE_URL in .env to use PostgreSQL."}
            </p>
            <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-400 font-mono truncate">
              {settings?.database.url_masked}
            </div>
          </div>

          {/* LaTeX Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-zinc-400" /> LaTeX Engine
              </span>
              <span className="font-mono text-zinc-700">{settings?.latex.mode || "auto"}</span>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Compiler detected: <span className="font-medium text-zinc-800">{settings?.latex.detected_local_compiler}</span>.
            </p>
            <div className="pt-2 border-t border-zinc-100 text-[11px] text-zinc-400">
              Complete .tex files are always generated and downloadable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
