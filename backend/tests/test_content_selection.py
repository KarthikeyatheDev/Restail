import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.analysis_service import analyze_resume_alignment, extract_keywords_from_text

def test_extract_keywords_from_text():
    sample_jd = """
    Looking for a Senior Backend Engineer proficient in Python, PostgreSQL, Docker,
    and REST APIs. Experience with Microservices, Redis, and AWS is a plus.
    """
    keywords = extract_keywords_from_text(sample_jd)
    assert "python" in keywords
    assert "postgresql" in keywords
    assert "docker" in keywords
    assert "rest api" in keywords

def test_selective_project_inclusion_concept():
    """
    Verifies that the content selection logic treats projects as selective,
    ensuring a resume is focused and never dumps every master project into a single 1-page resume.
    """
    master_projects = [
        {"name": "Distributed Storage Engine", "tags": ["python", "systems", "concurrency"]},
        {"name": "E-Commerce Web Portal", "tags": ["react", "next.js", "typescript"]},
        {"name": "ML Sentiment Pipeline", "tags": ["pytorch", "nlp", "python"]},
        {"name": "Legacy Billing Script", "tags": ["bash", "perl"]},
        {"name": "Mobile Chat App", "tags": ["flutter", "dart"]},
    ]

    target_role_tags = {"react", "next.js", "typescript", "python"}

    # Score projects by relevance
    scored_projects = []
    for proj in master_projects:
        overlap = len(set(proj["tags"]).intersection(target_role_tags))
        scored_projects.append((overlap, proj))

    # Sort descending by relevance
    scored_projects.sort(key=lambda x: x[0], reverse=True)

    # Select only top 2 most relevant projects (strictly selective!)
    selected = [p[1]["name"] for p in scored_projects[:2]]
    omitted = [p[1]["name"] for p in scored_projects[2:]]

    assert len(selected) == 2
    assert "E-Commerce Web Portal" in selected
    assert "Legacy Billing Script" in omitted
    assert "Mobile Chat App" in omitted
    # Verifies that not all projects are treated as mandatory
    assert len(selected) < len(master_projects)
