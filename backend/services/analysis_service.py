import re
from typing import Dict, List, Set, Any

COMMON_TECH_KEYWORDS = {
    # Languages
    "python", "javascript", "typescript", "c++", "c#", "java", "golang", "go", "rust", "ruby", "php", "sql", "bash", "shell",
    # Frontend
    "react", "next.js", "vue", "angular", "tailwind", "css", "html", "redux", "zustand", "graphql", "webpack", "vite", "sass",
    # Backend & Frameworks
    "flask", "fastapi", "django", "node.js", "express", "spring boot", "rails", "asp.net", "grpc", "rest api", "restful", "soap",
    # Databases & Storage
    "postgresql", "postgres", "mysql", "mongodb", "redis", "elasticsearch", "sqlite", "cassandra", "dynamodb", "neo4j", "supabase", "firebase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "docker", "kubernetes", "k8s", "terraform", "ansible", "ci/cd", "github actions", "gitlab", "jenkins", "linux", "nginx",
    # AI / ML & Data
    "machine learning", "deep learning", "nlp", "llm", "rag", "pytorch", "tensorflow", "scikit-learn", "pandas", "numpy", "opencv", "airflow",
    # Architecture & Practices
    "microservices", "system design", "agile", "scrum", "unit testing", "integration testing", "tdd", "distributed systems", "kafka", "rabbitmq"
}

def clean_text(text: str) -> str:
    return re.sub(r"[^\w\s\+\#\.\-]", " ", text.lower())

def extract_keywords_from_text(text: str) -> Set[str]:
    cleaned = clean_text(text)
    words = set(re.findall(r"\b[a-z0-9\+\#\.\-]{2,}\b", cleaned))
    
    found = set()
    # Check known multi-word & single-word tech keywords
    text_lower = text.lower()
    for kw in COMMON_TECH_KEYWORDS:
        # Check phrase or word boundary
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, text_lower):
            found.add(kw)

    # Also capture capitalized tech patterns or strong nouns from JD
    tokens = re.findall(r"\b[A-Z][a-zA-Z0-9\+\#\.\-]{1,15}\b", text)
    for token in tokens:
        t_low = token.lower()
        if len(t_low) > 2 and t_low not in {"the", "and", "for", "with", "from", "this", "that", "your", "will", "have", "been", "must", "work", "role", "team"}:
            found.add(t_low)

    return found

def analyze_resume_alignment(job_description: str, latex_content: str, master_resume_content: str = "") -> Dict[str, Any]:
    jd_keywords = extract_keywords_from_text(job_description)
    resume_cleaned = clean_text(latex_content)
    
    # Strip LaTeX commands from latex_content for accurate text matching
    latex_plain = re.sub(r"\\[a-zA-Z]+(\[[^\]]*\])?(\{([^}]*)\})?", r" \3 ", latex_content)
    latex_plain_lower = latex_plain.lower()

    matched = []
    missing = []

    for kw in sorted(jd_keywords):
        pattern = r"\b" + re.escape(kw) + r"\b"
        if re.search(pattern, latex_plain_lower):
            matched.append(kw)
        else:
            missing.append(kw)

    total_jd_keywords = len(jd_keywords)
    if total_jd_keywords > 0:
        base_score = round((len(matched) / total_jd_keywords) * 100, 1)
        # Scale score to realistic ATS curve (typically 65% to 95% for good resumes)
        score = min(98.0, max(45.0, round(50 + (base_score * 0.48), 1)))
    else:
        score = 80.0

    return {
        "match_score": score,
        "matched_keywords": matched,
        "missing_keywords": missing,
        "total_jd_keywords": total_jd_keywords,
    }
