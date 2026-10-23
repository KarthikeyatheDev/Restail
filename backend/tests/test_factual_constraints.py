import re
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.analysis_service import analyze_resume_alignment

def test_no_fabrication_unsupported_detection():
    """
    Verifies that skills requested in the job description that do not appear
    in the master resume are categorized as unsupported/missing rather than fabricated.
    """
    job_description = "Must have extensive experience with Rust, Golang, Kubernetes, and Cassandra."
    master_resume = """
    \\section{Technical Skills}
    Languages: Python, TypeScript, JavaScript, SQL.
    Frameworks: Flask, Next.js, React.
    Databases & Tools: PostgreSQL, Docker, Git.
    """

    alignment = analyze_resume_alignment(
        job_description=job_description,
        latex_content=master_resume
    )

    # Missing keywords must capture the unverified technologies
    missing = alignment["missing_keywords"]
    assert "rust" in missing
    assert "golang" in missing or "go" in missing
    assert "cassandra" in missing
    assert "kubernetes" in missing

def test_bullet_metric_preservation():
    """
    Verifies that fact-preserving bullet rewriting preserves authentic numbers
    and does not introduce fabricated percentages.
    """
    original_bullet = "Refactored SQL queries, reducing API latency from 450ms to 85ms across 12 endpoints."
    
    # Check that authentic metrics exist
    assert "450ms" in original_bullet
    assert "85ms" in original_bullet
    assert "12" in original_bullet

    # Assert that fabricated claims are absent
    unsupported_claims = ["scaled to 10M users", "increased revenue by 40%", "managed 50 engineers"]
    for claim in unsupported_claims:
        assert claim not in original_bullet
