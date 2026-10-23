import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Tuple
import requests
from config import OUTPUT_DIR, LATEX_COMPILER

def check_local_compiler() -> str:
    """Detect available local LaTeX compilers installed on system PATH."""
    for compiler in ["pdflatex", "tectonic", "xelatex", "lualatex"]:
        if shutil.which(compiler):
            return compiler
    return ""

def validate_latex_structure(latex_code: str) -> Tuple[bool, str]:
    """Validates basic syntax and structure of LaTeX code before compilation."""
    if not latex_code or not latex_code.strip():
        return False, "LaTeX code is empty."
    
    if "\\documentclass" not in latex_code:
        return False, "LaTeX code is missing \\documentclass declaration."
    
    if "\\begin{document}" not in latex_code:
        return False, "LaTeX code is missing \\begin{document}."
    
    if "\\end{document}" not in latex_code:
        return False, "LaTeX code is missing \\end{document}."

    # Verify matching begin and end document count
    begin_doc_count = latex_code.count("\\begin{document}")
    end_doc_count = latex_code.count("\\end{document}")
    if begin_doc_count != end_doc_count:
        return False, f"Mismatched document environment: {begin_doc_count} \\begin vs {end_doc_count} \\end."

    return True, "LaTeX structure valid."

def compile_latex_to_pdf(latex_code: str, file_prefix: str = "tailored_resume") -> Dict[str, Any]:
    """
    Compiles LaTeX code to PDF using an isolated temporary directory, safe subprocess arguments,
    and a strict timeout. Never touches or overwrites source files in data/.
    """
    tex_path = OUTPUT_DIR / f"{file_prefix}.tex"
    pdf_path = OUTPUT_DIR / f"{file_prefix}.pdf"

    # Always write the source .tex file to output directory (never to data/)
    tex_path.write_text(latex_code, encoding="utf-8")

    # 1. Validate structure first
    is_valid, validation_msg = validate_latex_structure(latex_code)
    if not is_valid:
        return {
            "success": False,
            "compiler_used": None,
            "pdf_filename": None,
            "tex_filename": tex_path.name,
            "message": f"LaTeX validation failed: {validation_msg}",
        }

    local_compiler = check_local_compiler()
    
    # 2. Compile locally in an isolated temporary directory with safe subprocess arguments
    if local_compiler and LATEX_COMPILER != "online":
        try:
            with tempfile.TemporaryDirectory() as tmp_dir:
                tmp_tex = Path(tmp_dir) / "document.tex"
                tmp_tex.write_text(latex_code, encoding="utf-8")
                
                # Safe subprocess arguments with -no-shell-escape to prevent arbitrary command execution
                if local_compiler in ["pdflatex", "xelatex", "lualatex"]:
                    cmd = [
                        local_compiler,
                        "-interaction=nonstopmode",
                        "-halt-on-error",
                        "-no-shell-escape",
                        "document.tex"
                    ]
                elif local_compiler == "tectonic":
                    cmd = ["tectonic", "document.tex"]
                else:
                    cmd = [local_compiler, "-interaction=nonstopmode", "document.tex"]

                proc = subprocess.run(
                    cmd,
                    cwd=tmp_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30,  # 30-second strict timeout
                    text=True,
                )

                tmp_pdf = Path(tmp_dir) / "document.pdf"
                if tmp_pdf.exists() and tmp_pdf.stat().st_size > 0:
                    shutil.copyfile(tmp_pdf, pdf_path)
                    return {
                        "success": True,
                        "compiler_used": local_compiler,
                        "pdf_filename": pdf_path.name,
                        "tex_filename": tex_path.name,
                        "message": f"Compiled successfully using local {local_compiler}.",
                    }
                else:
                    error_tail = (proc.stdout + "\n" + proc.stderr)[-500:]
                    return {
                        "success": False,
                        "compiler_used": local_compiler,
                        "pdf_filename": None,
                        "tex_filename": tex_path.name,
                        "message": f"Compilation failed with {local_compiler}: {error_tail.strip() or 'Unknown error'}",
                    }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "compiler_used": local_compiler,
                "pdf_filename": None,
                "tex_filename": tex_path.name,
                "message": f"Compilation timed out after 30 seconds with {local_compiler}.",
            }
        except Exception as e:
            return {
                "success": False,
                "compiler_used": local_compiler,
                "pdf_filename": None,
                "tex_filename": tex_path.name,
                "message": f"Compilation error: {str(e)}",
            }

    # 3. Optional Cloud Compilation fallback if explicitly allowed and local compiler not installed
    if LATEX_COMPILER == "online" or (LATEX_COMPILER == "auto" and not local_compiler):
        try:
            resp = requests.post(
                "https://latexonline.cc/compile",
                data={"text": latex_code},
                timeout=25
            )
            if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("application/pdf"):
                pdf_path.write_bytes(resp.content)
                return {
                    "success": True,
                    "compiler_used": "latexonline-cloud",
                    "pdf_filename": pdf_path.name,
                    "tex_filename": tex_path.name,
                    "message": "Compiled successfully via cloud LaTeX compiler.",
                }
        except Exception:
            pass

    # 4. Graceful handling if no compiler is installed
    return {
        "success": False,
        "compiler_used": None,
        "pdf_filename": None,
        "tex_filename": tex_path.name,
        "message": "No local LaTeX compiler (pdflatex/tectonic) installed. Download the compile-ready .tex file to compile in Overleaf or install MiKTeX/TeX Live.",
    }
