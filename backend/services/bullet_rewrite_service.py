import json
from typing import Dict, Any, List
from services.llm_client import call_structured_llm

SYSTEM_PROMPT = """You are Restail's Bullet Point Tailoring Specialist.
Your task is to rewrite bullet points for selected work experiences and projects to maximize ATS keyword alignment with the job description while strictly preserving factual accuracy.

CRITICAL RULES:
1. FACTUAL ACCURACY & ZERO INVENTIONS:
   - Absolutely NEVER invent any new metric, number, technology, or accomplishment that does not exist in the source bullet!
   - Do NOT turn an unquantified project into a fake quantified claim (e.g., do not invent "increased revenue by 40%" or "scaled to 10M users" if not in original bullet).
   - If numbers/metrics exist in the original bullet, preserve and highlight them accurately.
2. ATS ALIGNMENT:
   - Emphasize relevant action verbs and authentic technologies mentioned in the JD.
   - Improve clarity, conciseness, and impact without altering the underlying truth.

You must respond with ONLY a valid JSON object matching this schema:
{
  "tailored_experiences": [
    {
      "company": "string",
      "role": "string",
      "location": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ],
  "tailored_projects": [
    {
      "name": "string",
      "technologies": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ]
}
"""

def rewrite_bullets_for_alignment(
    selected_content: Dict[str, Any],
    jd_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """Pipeline Step 4: Rewrites bullets to align with JD while preserving factual truth."""
    user_prompt = f"""Target Role: {jd_analysis.get('role_title', 'Target Role')}
Core Responsibilities: {json.dumps(jd_analysis.get('responsibilities', []))}
Required Skills: {json.dumps(jd_analysis.get('required_skills', []))}
Key ATS Keywords: {json.dumps(jd_analysis.get('important_keywords', []))}

================ SELECTED EXPERIENCES TO REWRITE ================
{json.dumps(selected_content.get('selected_experiences', []), indent=2)}

================ SELECTED PROJECTS TO REWRITE ================
{json.dumps(selected_content.get('selected_projects', []), indent=2)}

Rewrite the bullets to highlight alignment with the job description. Do not invent any metrics or technologies.
"""

    return call_structured_llm(SYSTEM_PROMPT, user_prompt)
