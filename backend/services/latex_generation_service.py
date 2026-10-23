import json
import re
from typing import Dict, Any
from services.llm_client import call_structured_llm, LLMExecutionError

SYSTEM_PROMPT = """You are Restail's LaTeX Document Generation Specialist.
Your task is to take the user's validated tailored resume content and generate a complete, standalone LaTeX resume that strictly preserves the formatting, layout, packages, geometry, and custom macros from sample_resume.tex.

CRITICAL RULES:
1. STRICT FORMAT & TEMPLATE PRESERVATION:
   - You MUST preserve the exact preamble, documentclass, packages, margins, fonts, and custom macro definitions (e.g., \\resumeSubheading, \\resumeProjectHeading, \\resumeItem, etc.) from sample_resume.tex.
   - Do NOT alter margins, line spacing, or add conflicting packages.
   - The resulting document must be a complete, standalone, compile-ready LaTeX document starting with \\documentclass and ending with \\end{document}.
2. CONTENT ACCURACY:
   - Use the provided tailored skills, experiences, and projects.
   - Properly escape LaTeX special characters (such as %, &, $, _, #, ~) in descriptive text.
   - Ensure every \\begin{...} has a matching \\end{...}.

You must respond with ONLY a valid JSON object matching this schema:
{
  "tailored_latex": "The full complete compile-ready LaTeX string starting with \\documentclass and ending with \\end{document}"
}
"""

def generate_standalone_latex(
    sample_resume_template: str,
    master_resume: str,
    selected_content: Dict[str, Any],
    tailored_bullets: Dict[str, Any],
    role_title: str = ""
) -> str:
    """Pipeline Step 5: Generates a complete standalone LaTeX resume preserving template layout."""
    user_prompt = f"""Target Role: {role_title or "Target Role"}

================ TARGET LATEX TEMPLATE TO PRESERVE (sample_resume.tex) ================
{sample_resume_template}

================ MASTER RESUME SOURCE (FOR CONTACT & EDUCATION) ================
{master_resume}

================ VALIDATED TAILORED SKILLS ================
{json.dumps(selected_content.get('selected_skills', {}), indent=2)}

================ TAILORED WORK EXPERIENCES ================
{json.dumps(tailored_bullets.get('tailored_experiences', []), indent=2)}

================ TAILORED PROJECTS (SELECTIVE INCLUSION) ================
{json.dumps(tailored_bullets.get('tailored_projects', []), indent=2)}

Generate the complete compile-ready LaTeX resume preserving the exact template layout, macros, and styling from sample_resume.tex.
"""

    result = call_structured_llm(SYSTEM_PROMPT, user_prompt)
    latex_code = result.get("tailored_latex", "").strip()

    # Fallback cleanup if LLM wrapped in markdown fences
    if latex_code.startswith("```"):
        latex_code = re.sub(r"^```(?:latex|tex)?\n", "", latex_code)
        latex_code = re.sub(r"\n```$", "", latex_code)
        latex_code = latex_code.strip()

    # Validation: must contain \documentclass and \end{document}
    if "\\documentclass" not in latex_code or "\\end{document}" not in latex_code:
        raise LLMExecutionError("Generated LaTeX was incomplete or missing \\documentclass / \\end{document}.")

    return latex_code
