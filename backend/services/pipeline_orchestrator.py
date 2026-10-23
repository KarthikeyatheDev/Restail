from typing import Dict, Any
from services.file_service import read_source_file, get_all_files_status
from services.llm_client import MissingCredentialsError, LLMExecutionError
from services.jd_analysis_service import analyze_job_description
from services.content_selection_service import select_relevant_content
from services.bullet_rewrite_service import rewrite_bullets_for_alignment
from services.latex_generation_service import generate_standalone_latex
from services.validation_service import generate_validation_report

def execute_tailoring_pipeline(
    job_description: str,
    job_title: str = "",
    company_name: str = ""
) -> Dict[str, Any]:
    """
    Executes Restail's full 6-step resume tailoring pipeline:
    1. Analyze JD (required skills, preferred skills, responsibilities, keywords).
    2. Read master resume & identify relevant skills/experiences.
    3. Follow behavior.md rules to select relevant content (selective project inclusion).
    4. Rewrite resume bullets for alignment while preserving factual accuracy.
    5. Generate standalone LaTeX resume following sample_resume.tex layout.
    6. Produce audit report of supported, partially supported, and unsupported JD requirements.
    """
    # 0. Check source files
    file_status = get_all_files_status()
    missing_files = [f for f, info in file_status["files"].items() if not info["exists"] or not info["has_content"]]
    if missing_files:
        raise ValueError(
            f"Missing required source files: {', '.join(missing_files)}. "
            "Please configure your personal source files in the data/ directory or via Settings."
        )

    behavior = read_source_file("behavior.md")
    master_resume = read_source_file("master_resume.tex")
    sample_resume = read_source_file("sample_resume.tex")

    # Step 1: Analyze Job Description
    jd_analysis = analyze_job_description(job_description)
    if job_title:
        jd_analysis["role_title"] = job_title
    if company_name:
        jd_analysis["company_name"] = company_name

    # Step 2 & 3: Content Selection based on master resume & behavior.md
    selected_content = select_relevant_content(master_resume, behavior, jd_analysis)

    # Step 4: Bullet Rewriting for alignment while preserving factual truth
    tailored_bullets = rewrite_bullets_for_alignment(selected_content, jd_analysis)

    # Step 5: Standalone LaTeX Generation strictly preserving sample_resume.tex
    tailored_latex = generate_standalone_latex(
        sample_resume_template=sample_resume,
        master_resume=master_resume,
        selected_content=selected_content,
        tailored_bullets=tailored_bullets,
        role_title=jd_analysis.get("role_title", "Software Engineer")
    )

    # Step 6: Validation Report (supported, partially supported, unsupported requirements)
    selection_summary = selected_content.get("selection_summary", "")
    validation = generate_validation_report(
        jd_analysis=jd_analysis,
        master_resume=master_resume,
        tailored_latex=tailored_latex,
        selection_rationale=selection_summary
    )

    return {
        "job_title": jd_analysis.get("role_title", job_title or "Untitled Role"),
        "company_name": jd_analysis.get("company_name", company_name or "General Application"),
        "tailored_latex": tailored_latex,
        "summary": validation.get("summary", ""),
        "match_score": validation.get("match_score", 0.0),
        "matched_keywords": validation.get("matched_keywords", []),
        "missing_keywords": validation.get("missing_keywords", []),
        "supported_requirements": validation.get("supported_requirements", []),
        "partially_supported_requirements": validation.get("partially_supported_requirements", []),
        "unsupported_requirements": validation.get("unsupported_requirements", []),
        "jd_analysis": jd_analysis,
    }
