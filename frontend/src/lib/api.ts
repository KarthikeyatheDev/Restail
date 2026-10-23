const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SourceFileInfo {
  name: string;
  title: string;
  description: string;
  type: "markdown" | "latex";
  exists: boolean;
  has_content: boolean;
  size_bytes: number;
  line_count: number;
  last_modified: string | null;
  path: string;
}

export interface SourceFilesStatusResponse {
  files: Record<string, SourceFileInfo>;
  all_ready: boolean;
  data_dir: string;
}

export interface ResumeRecord {
  id: number;
  job_title: string;
  company_name: string;
  job_description: string;
  tailored_latex: string;
  summary: string | null;
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  supported_requirements?: string[];
  partially_supported_requirements?: string[];
  unsupported_requirements?: string[];
  jd_analysis?: {
    role_title?: string;
    company_name?: string;
    required_skills?: string[];
    preferred_skills?: string[];
    responsibilities?: string[];
    important_keywords?: string[];
  };
  pdf_filename: string | null;
  created_at: string;
  compilation?: {
    success: boolean;
    compiler_used?: string | null;
    message?: string;
  };
}

export interface SettingsResponse {
  database: {
    type: string;
    url_masked: string;
  };
  llm: {
    active_provider: string;
    is_simulated: boolean;
    providers: {
      gemini: { configured: boolean; model: string };
      openai: { configured: boolean; model: string; base_url: string };
      anthropic: { configured: boolean; model: string };
    };
  };
  latex: {
    mode: string;
    detected_local_compiler: string;
    output_directory: string;
  };
  data_directory: string;
}

export async function fetchFilesStatus(): Promise<SourceFilesStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/api/files/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch source files status");
  return res.json();
}

export async function fetchFileContent(filename: string): Promise<{ name: string; content: string }> {
  const res = await fetch(`${API_BASE_URL}/api/files/${filename}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch file: ${filename}`);
  return res.json();
}

export async function saveFileContent(filename: string, content: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/files/${filename}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update source file");
  }
  return res.json();
}

export async function uploadSourceFile(filename: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/files/${filename}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to upload file");
  }
  return res.json();
}

export async function initFileTemplate(filename: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/files/${filename}/init`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to initialize template");
  return res.json();
}

export async function generateTailoredResume(data: {
  job_description: string;
  job_title?: string;
  company_name?: string;
}): Promise<ResumeRecord> {
  const res = await fetch(`${API_BASE_URL}/api/resumes/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Generation failed" }));
    throw new Error(err.message || err.error || "Failed to tailor resume");
  }
  return res.json();
}

export async function fetchResumes(limit?: number): Promise<ResumeRecord[]> {
  const url = limit ? `${API_BASE_URL}/api/resumes?limit=${limit}` : `${API_BASE_URL}/api/resumes`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch resumes");
  return res.json();
}

export async function fetchResumeById(id: number | string): Promise<ResumeRecord> {
  const res = await fetch(`${API_BASE_URL}/api/resumes/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Resume not found");
  return res.json();
}

export async function deleteResume(id: number | string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/resumes/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete resume");
  return res.json();
}

export async function recompileResume(id: number | string, latex?: string): Promise<ResumeRecord> {
  const res = await fetch(`${API_BASE_URL}/api/resumes/${id}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex }),
  });
  if (!res.ok) throw new Error("Failed to recompile resume");
  return res.json();
}

export async function fetchSettings(): Promise<SettingsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export function getDownloadTexUrl(id: number | string): string {
  return `${API_BASE_URL}/api/resumes/${id}/download/tex`;
}

export function getDownloadPdfUrl(id: number | string): string {
  return `${API_BASE_URL}/api/resumes/${id}/download/pdf`;
}

export function getPdfPreviewUrl(id: number | string): string {
  return `${API_BASE_URL}/api/resumes/${id}/pdf`;
}
