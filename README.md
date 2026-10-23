# Restail — Personal AI-Powered LaTeX Resume Tailoring

**Restail** is an AI-powered resume tailoring web application built with Next.js, TypeScript, Tailwind CSS, and a Python Flask REST API with SQLAlchemy.

Unlike generic resume generators that invent experiences or distort job histories, Restail is designed with **strict fidelity**: it tailors your resume strictly from your verified personal knowledge repository, preserving your preferred LaTeX formatting template with zero fabrication.

---

## Core Concept & Source Files

Restail reads directly from three personal files located in `data/`:

| File | Purpose |
| :--- | :--- |
| `data/behavior.md` | Your background, target roles, project prioritization rules, and custom instructions for how the AI should tailor your resume. |
| `data/master_resume.tex` | Your comprehensive resume repository: all experiences, projects, skills, achievements, and alternative bullet point variations. |
| `data/sample_resume.tex` | The target LaTeX template whose packages, margins, macros, and layout formatting must be strictly preserved. |

> **Strict Non-Overwriting & Anti-Fabrication Guarantee**: 
> 1. Source files in `data/` are strictly read-only during resume tailoring and compilation. They are **never** modified or overwritten by generation runs.
> 2. Restail will **never** invent companies, dates, degrees, technologies, or metrics not present in your `master_resume.tex` or `behavior.md`.

---

## 6-Step Tailoring Pipeline Architecture

```text
Job Description ──► [Step 1: JD Analysis] ──► Extracted Skills & Requirements
                                                    │
[data/master_resume.tex] + [data/behavior.md] ─────┼──► [Step 2 & 3: Content Selection] (Selective 2-3 projects)
                                                    │
                                                    ▼
                                           [Step 4: Bullet Rewriting] (Factual preservation)
                                                    │
[data/sample_resume.tex] ──────────────────────────┼──► [Step 5: Standalone LaTeX Assembly]
                                                    │
                                                    ▼
                                           [Step 6: Validation & 3-Tier Audit Report]
                                                    │
                                                    ▼
                                           [Isolated Subprocess Compile] ──► resume_[company].tex & .pdf
```

---

## Project Structure

```text
Restail/
├── backend/
│   ├── app.py                              # Flask application entrypoint & CORS setup
│   ├── config.py                           # Environment configuration
│   ├── models.py                           # SQLAlchemy models with requirement audit schema
│   ├── requirements.txt                    # Python dependencies
│   ├── .env.example                        # Backend environment variables template
│   ├── routes/
│   │   ├── resumes.py                      # /api/resumes (tailor, compile, download)
│   │   ├── files.py                        # /api/files (status, read, write, init)
│   │   └── settings.py                     # /api/settings (system diagnostics)
│   ├── services/
│   │   ├── llm_client.py                   # Direct LLM API client (Gemini, OpenAI, Anthropic)
│   │   ├── jd_analysis_service.py          # Step 1: Extract required/preferred skills & keywords
│   │   ├── content_selection_service.py    # Steps 2 & 3: Master resume parsing & selective inclusion
│   │   ├── bullet_rewrite_service.py       # Step 4: Fact-preserving bullet point rewriting
│   │   ├── latex_generation_service.py     # Step 5: Complete LaTeX assembly matching sample_resume.tex
│   │   ├── validation_service.py           # Step 6: 3-tier requirement coverage audit report
│   │   ├── pipeline_orchestrator.py        # End-to-end 6-step pipeline coordinator
│   │   ├── file_service.py                 # Source file status & management
│   │   └── compiler_service.py             # LaTeX to PDF compiler (isolated temp dir, safe args)
│   ├── tests/
│   │   ├── test_routes.py                  # API route, CRUD, and download tests
│   │   ├── test_content_selection.py       # Selective project inclusion & behavior rule tests
│   │   ├── test_factual_constraints.py     # Anti-fabrication & metric preservation tests
│   │   └── test_file_generation.py         # LaTeX structure & isolated compilation safety tests
│   └── output/                             # Generated resume_[company].tex & .pdf files
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout & light theme styling
│   │   │   ├── page.tsx                    # 1. Dashboard (source file status & recent resumes)
│   │   │   ├── tailor/page.tsx             # 2. Tailor Resume (JD input & multi-step animation)
│   │   │   ├── results/[id]/page.tsx       # 3. Results Studio (LaTeX editor, PDF preview, audit)
│   │   │   ├── history/page.tsx            # 4. History (archive, search, filters, delete)
│   │   │   └── settings/page.tsx           # 5. Settings (source file editor, upload, diagnostics)
│   │   ├── components/
│   │   │   └── Navbar.tsx                  # Minimalist top navigation & readiness pill
│   │   └── lib/
│   │       └── api.ts                      # Type-safe API client
│   ├── package.json
│   └── tsconfig.json
├── data/                                   # Your 3 personal source files
│   ├── behavior.md
│   ├── master_resume.tex
│   └── sample_resume.tex
└── README.md
```

---

## Installation & Setup

### 1. Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

5. Configure credentials in `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL=sqlite:///restail.db

   # LLM Provider: 'gemini', 'openai', or 'anthropic'
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash

   # Compiler Mode: 'auto', 'pdflatex', 'tectonic', 'online', 'none'
   LATEX_COMPILER=auto
   ```

6. Start the Flask server:
   ```bash
   python app.py
   ```
   *The API will be live at `http://localhost:5000`.*

---

### 2. Frontend Setup

1. In a separate terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

## Database Configuration

Restail uses **SQLAlchemy**, supporting both SQLite and PostgreSQL out-of-the-box.

- **SQLite (Default):** Runs immediately with zero installation. Database file is stored locally at `backend/restail.db`.
- **PostgreSQL (Production):** Set `DATABASE_URL` in `backend/.env`:
  ```env
  DATABASE_URL=postgresql://username:password@localhost:5432/restail_db
  ```
  Tables (`resume_generations`) are automatically initialized via `db.create_all()` on server startup.

---

## LaTeX Distribution Installation

Restail compiles your LaTeX into a downloadable PDF locally using standard compilers (`pdflatex`, `tectonic`, `xelatex`, or `lualatex`).

### Windows
Install **MiKTeX** or **TeX Live**:
```powershell
# Via winget (Windows Package Manager)
winget install MiKTeX.MiKTeX

# Or via Chocolatey
choco install miktex
```
*After installation, ensure `pdflatex` is available in your PATH.*

### macOS
Install **MacTeX** via Homebrew:
```bash
brew install --cask mactex-no-gui
```

### Ubuntu / Debian
Install TeX Live packages:
```bash
sudo apt-get update
sudo apt-get install texlive-latex-base texlive-latex-extra texlive-fonts-recommended
```

### Compiler Security & Isolation
- **Isolated Directory:** Compilation executes within a temporary directory created by `tempfile.TemporaryDirectory()`.
- **Safe Subprocess Arguments:** Compiles with `-no-shell-escape`, `-interaction=nonstopmode`, and `-halt-on-error` to prevent arbitrary code execution from malicious macros.
- **Timeout Protection:** Hard 30-second timeout prevents runaway processes.
- **Graceful Fallback:** If no compiler is installed or compilation fails, Restail preserves the complete compile-ready `.tex` file so you can download it with one click and render in [Overleaf](https://www.overleaf.com).

---

## Downloads & File Naming

- **LaTeX Source Download:** Generated with the exact filename format:
  `resume_[company_name].tex`
- **PDF Download:** Generated with the exact filename format:
  `resume_[company_name].pdf`

---

## License
MIT License. Built for personal, high-fidelity resume tailoring.
