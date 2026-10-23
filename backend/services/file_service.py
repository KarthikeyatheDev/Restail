import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from config import DATA_DIR

ALLOWED_FILES = {
    "behavior.md": {
        "title": "Behavior & Rules",
        "description": "Background, preferences, project priorities, and tailoring rules for the AI.",
        "type": "markdown",
    },
    "master_resume.tex": {
        "title": "Master Resume",
        "description": "Comprehensive resume data: all projects, skills, experiences, and bullet points.",
        "type": "latex",
    },
    "sample_resume.tex": {
        "title": "LaTeX Template",
        "description": "Target LaTeX template whose styling, layout, and commands are strictly preserved.",
        "type": "latex",
    },
}

STARTER_TEMPLATES = {
    "behavior.md": """# Restail - Behavior & Tailoring Instructions

## 1. Professional Identity & Background
<!-- Summarize your target roles, years of experience, core domains (e.g. Full-Stack, ML, DevOps) -->
- Target Roles: Software Engineer, Full Stack Developer, Systems Engineer
- Core Focus: High-performance web applications, scalable backends, clean UI

## 2. Project Priorities
<!-- List which projects from your master resume should be prioritized for different roles -->
- For Web/Full-Stack roles: Emphasize end-to-end full stack projects with React/Next.js and Python.
- For Backend/Systems roles: Prioritize distributed architecture, APIs, databases, and performance optimization.

## 3. Tailoring Rules
- Rule 1: Never fabricate any job, degree, company, or metric not present in master_resume.tex.
- Rule 2: Keep the resume strictly to 1 page unless master_resume indicates otherwise.
- Rule 3: Reorder and highlight bullet points that directly match keywords in the job description.
- Rule 4: Match ATS keywords naturally in the Skills and Experience sections.
""",
    "master_resume.tex": """% Master Resume Repository
% Add all your experiences, projects, skills, and bullet point variations here.
% The AI will select the most relevant items according to the target job description.

\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

% --- Contact Information ---
% [YOUR CONTACT INFO]

\\begin{document}

% --- Education Section ---
% [YOUR EDUCATION ENTRIES]

% --- Skills Section ---
% [YOUR TECHNICAL SKILLS: Languages, Frameworks, Developer Tools, Libraries]

% --- Experience Section ---
% [ALL WORK EXPERIENCES AND ALTERNATIVE BULLET POINTS]

% --- Projects Section ---
% [ALL PROJECTS WITH REVERSIBLE BULLET POINTS]

% --- Certifications / Leadership ---
% [OPTIONAL ADDITIONAL SECTIONS]

\\end{document}
""",
    "sample_resume.tex": """% LaTeX Template - Formatting & Layout Source
% This file defines the exact styling, geometry, and macros to preserve.

\\documentclass[letterpaper,10pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\begin{document}

% Header Template
\\begin{center}
    \\textbf{\\Huge \\scshape [NAME]} \\\\ \\vspace{1pt}
    \\small [PHONE] $|$ \\href{mailto:[EMAIL]}{[EMAIL]} $|$ 
    \\href{[LINKEDIN_URL]}{[LINKEDIN]} $|$
    \\href{[GITHUB_URL]}{[GITHUB]}
\\end{center}

% Sections layout will be filled by Restail while keeping these exact styling macros
\\end{document}
"""
}


def get_file_path(filename: str) -> Path:
    if filename not in ALLOWED_FILES:
        raise ValueError(f"File '{filename}' is not an authorized Restail source file.")
    return DATA_DIR / filename


def get_all_files_status() -> Dict[str, Any]:
    """Returns the status and metadata for all 3 source files."""
    result = {}
    all_ready = True

    for filename, meta in ALLOWED_FILES.items():
        file_path = get_file_path(filename)
        exists = file_path.exists()
        size_bytes = 0
        line_count = 0
        last_modified = None
        has_content = False

        if exists:
            stat = file_path.stat()
            size_bytes = stat.st_size
            last_modified = datetime.fromtimestamp(stat.st_mtime).isoformat()
            try:
                content = file_path.read_text(encoding="utf-8")
                line_count = len(content.splitlines())
                # Check if it has non-whitespace content
                has_content = len(content.strip()) > 0
            except Exception:
                has_content = False
        
        if not exists or not has_content:
            all_ready = False

        result[filename] = {
            "name": filename,
            "title": meta["title"],
            "description": meta["description"],
            "type": meta["type"],
            "exists": exists,
            "has_content": has_content,
            "size_bytes": size_bytes,
            "line_count": line_count,
            "last_modified": last_modified,
            "path": str(file_path),
        }

    return {
        "files": result,
        "all_ready": all_ready,
        "data_dir": str(DATA_DIR),
    }


def read_source_file(filename: str) -> str:
    """Reads content of a source file."""
    path = get_file_path(filename)
    if not path.exists():
        raise FileNotFoundError(f"Source file '{filename}' does not exist in {DATA_DIR}.")
    return path.read_text(encoding="utf-8")


def write_source_file(filename: str, content: str) -> Dict[str, Any]:
    """Writes content to a source file."""
    path = get_file_path(filename)
    path.write_text(content, encoding="utf-8")
    return {
        "name": filename,
        "size_bytes": len(content.encode("utf-8")),
        "line_count": len(content.splitlines()),
        "last_modified": datetime.utcnow().isoformat(),
    }


def init_starter_template(filename: str) -> str:
    """Initializes starter template for a file if missing or requested."""
    if filename not in STARTER_TEMPLATES:
        raise ValueError(f"No starter template available for '{filename}'.")
    content = STARTER_TEMPLATES[filename]
    write_source_file(filename, content)
    return content
