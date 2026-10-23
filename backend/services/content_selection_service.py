import json
from typing import Dict, Any, List
from services.llm_client import call_structured_llm

SYSTEM_PROMPT = """You are Restail's Content Selection Engine.
Your responsibility is to read the user's master resume and select ONLY the most relevant skills, experience, achievements, and projects based on the target job requirements and the rules in behavior.md.

CRITICAL RULES:
1. STRICT FIDELITY - NO FABRICATION:
   - Absolutely NEVER invent or hallucinate any experience, skills, technologies, achievements, or metrics.
   - Every single item you select MUST exist in the provided master_resume.tex.
2. SELECTIVE PROJECT INCLUSION:
   - NEVER treat every project in the master resume as mandatory!
   - You must select ONLY the 2 to 3 most relevant projects that directly demonstrate skills for the target role.
   - Leave less relevant projects out to maintain a focused, high-impact resume.
3. BEHAVIOR RULES ENFORCEMENT:
   - Strictly prioritize projects and domains as instructed in behavior.md.

You must respond with ONLY a valid JSON object matching this schema:
{
  "selected_skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools_and_databases": ["string"]
  },
  "selected_experiences": [
    {
      "company": "string",
      "role": "string",
      "location": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ],
  "selected_projects": [
    {
      "name": "string",
      "technologies": "string",
      "dates": "string",
      "bullets": ["string"],
      "selection_rationale": "string"
    }
  ],
  "omitted_projects": ["string"],
  "selection_summary": "string"
}
"""

def select_relevant_content(
    master_resume: str,
    behavior: str,
    jd_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Pipeline Steps 2 & 3: Selects the most relevant content from master resume according to behavior.md and JD."""
    user_prompt = f"""Target Role: {jd_analysis.get('role_title', 'Target Role')}
Required Skills: {json.dumps(jd_analysis.get('required_skills', []))}
Preferred Skills: {json.dumps(jd_analysis.get('preferred_skills', []))}
Core Responsibilities: {json.dumps(jd_analysis.get('responsibilities', []))}
Key ATS Keywords: {json.dumps(jd_analysis.get('important_keywords', []))}

================ BEHAVIOR & TAILORING RULES (behavior.md) ================
{behavior}

================ MASTER RESUME REPOSITORY (master_resume.tex) ================
{master_resume}

Select the most relevant content. Remember: do not invent anything, and do not include every project—pick only the best 2-3 projects that align with the role.
"""

    return call_structured_llm(SYSTEM_PROMPT, user_prompt)
