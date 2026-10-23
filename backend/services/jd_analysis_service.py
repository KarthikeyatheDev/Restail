from typing import Dict, Any, List
from services.llm_client import call_structured_llm
from services.analysis_service import extract_keywords_from_text

SYSTEM_PROMPT = """You are an expert ATS Job Description Analyzer.
Your task is to parse a job description and extract a structured breakdown of requirements.
You MUST extract:
1. required_skills: Explicit must-have technical and functional skills.
2. preferred_skills: Nice-to-have, bonus, or secondary skills mentioned.
3. responsibilities: Core duties and responsibilities described.
4. important_keywords: Crucial ATS keywords, technologies, methodologies, and terminology.
5. role_title: The identified job title or best inferred title.
6. company_name: The company name if mentioned, or empty string.

You must respond with ONLY a valid JSON object matching this schema:
{
  "role_title": "string",
  "company_name": "string",
  "required_skills": ["string"],
  "preferred_skills": ["string"],
  "responsibilities": ["string"],
  "important_keywords": ["string"]
}
"""

def analyze_job_description(job_description: str) -> Dict[str, Any]:
    """Pipeline Step 1: Extracts structured skills, responsibilities, and keywords from JD."""
    if not job_description or not job_description.strip():
        raise ValueError("Job description is empty.")

    user_prompt = f"Analyze the following job description:\n\n{job_description}"

    data = call_structured_llm(SYSTEM_PROMPT, user_prompt)

    # Validate and normalize
    required = [str(s).strip() for s in data.get("required_skills", []) if str(s).strip()]
    preferred = [str(s).strip() for s in data.get("preferred_skills", []) if str(s).strip()]
    responsibilities = [str(r).strip() for r in data.get("responsibilities", []) if str(r).strip()]
    keywords = [str(k).strip() for k in data.get("important_keywords", []) if str(k).strip()]

    # If keywords was thin, augment with regex keywords
    if len(keywords) < 3:
        extracted = extract_keywords_from_text(job_description)
        keywords = list(set(keywords + list(extracted)))

    return {
        "role_title": data.get("role_title", "Software Engineer"),
        "company_name": data.get("company_name", ""),
        "required_skills": required,
        "preferred_skills": preferred,
        "responsibilities": responsibilities,
        "important_keywords": keywords,
    }
