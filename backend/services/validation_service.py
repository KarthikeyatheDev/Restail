import json
from typing import Dict, Any, List
from services.llm_client import call_structured_llm
from services.analysis_service import analyze_resume_alignment

SYSTEM_PROMPT = """You are Restail's Verification and ATS Audit Engine.
Your task is to produce an honest, transparent report of how well the user's master resume and tailored resume support the target job description requirements.

Analyze each requirement from the job description and categorize it into:
1. supported_requirements: Requirements fully backed by verified experience, projects, or skills in the master resume.
2. partially_supported_requirements: Requirements where related or transferable skills exist (e.g. general SQL for PostgreSQL, or React for Next.js), but not an exact 1:1 match.
3. unsupported_requirements: Requirements requested by the employer that the candidate simply does not have in their master resume (never fabricated).

You must respond with ONLY a valid JSON object matching this schema:
{
  "supported_requirements": ["string"],
  "partially_supported_requirements": ["string"],
  "unsupported_requirements": ["string"],
  "match_score": 85.5,
  "summary": "Concise summary of candidate alignment and which projects were prioritized"
}
"""

def generate_validation_report(
    jd_analysis: Dict[str, Any],
    master_resume: str,
    tailored_latex: str,
    selection_rationale: str = ""
) -> Dict[str, Any]:
    """Pipeline Step 6: Produces a structured report of supported, partially supported, and unsupported JD requirements."""
    user_prompt = f"""Target Role: {jd_analysis.get('role_title', 'Target Role')}
Extracted Requirements & Skills:
- Required Skills: {json.dumps(jd_analysis.get('required_skills', []))}
- Preferred Skills: {json.dumps(jd_analysis.get('preferred_skills', []))}
- Responsibilities: {json.dumps(jd_analysis.get('responsibilities', []))}

================ MASTER RESUME REPOSITORY ================
{master_resume}

================ TAILORED LATEX RESUME ================
{tailored_latex}

Generate the audit report. Categorize all JD requirements truthfully into supported, partially supported, and unsupported.
"""

    report = call_structured_llm(SYSTEM_PROMPT, user_prompt)

    # Cross-reference with programmatic keyword analysis
    alignment = analyze_resume_alignment(
        job_description=" ".join(jd_analysis.get("required_skills", []) + jd_analysis.get("responsibilities", []) + jd_analysis.get("important_keywords", [])),
        latex_content=tailored_latex,
        master_resume_content=master_resume
    )

    # Ensure match_score is valid float
    match_score = report.get("match_score")
    if not isinstance(match_score, (int, float)) or match_score <= 0:
        match_score = alignment["match_score"]

    return {
        "supported_requirements": report.get("supported_requirements", []),
        "partially_supported_requirements": report.get("partially_supported_requirements", []),
        "unsupported_requirements": report.get("unsupported_requirements", []),
        "match_score": round(float(match_score), 1),
        "matched_keywords": alignment["matched_keywords"],
        "missing_keywords": alignment["missing_keywords"],
        "summary": report.get("summary", selection_rationale or "Resume tailored for target role."),
    }
