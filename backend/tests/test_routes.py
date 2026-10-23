import pytest
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from models import db, ResumeGeneration

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert "service" in data

def test_system_settings(client):
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.get_json()
    assert "database" in data
    assert "llm" in data
    assert "latex" in data
    assert "data_directory" in data

def test_source_files_status(client):
    response = client.get("/api/files/status")
    assert response.status_code == 200
    data = response.get_json()
    assert "files" in data
    assert "behavior.md" in data["files"]
    assert "master_resume.tex" in data["files"]
    assert "sample_resume.tex" in data["files"]

def test_get_and_update_source_file(client):
    # Test reading existing file
    resp = client.get("/api/files/behavior.md")
    assert resp.status_code in (200, 404)

    # Test invalid file name protection
    invalid_resp = client.get("/api/files/passwords.txt")
    assert invalid_resp.status_code == 400

def test_resumes_crud_and_downloads(client):
    # Create test resume record in database
    with client.application.app_context():
        res = ResumeGeneration(
            job_title="Full Stack Engineer",
            company_name="Cloud Corp",
            job_description="Seeking a Full Stack Engineer with Python and React.",
            tailored_latex="\\documentclass{article}\\begin{document}Test Resume\\end{document}",
            summary="Tailored based on full stack preferences.",
            match_score=85.0,
            matched_keywords=["python", "react"],
            missing_keywords=["aws"],
            supported_requirements=["Python backend"],
            partially_supported_requirements=["React"],
            unsupported_requirements=["Kubernetes cluster operations"],
        )
        db.session.add(res)
        db.session.commit()
        res_id = res.id

    # Test listing resumes
    list_resp = client.get("/api/resumes")
    assert list_resp.status_code == 200
    resumes = list_resp.get_json()
    assert len(resumes) == 1
    assert resumes[0]["company_name"] == "Cloud Corp"

    # Test single resume retrieval
    get_resp = client.get(f"/api/resumes/{res_id}")
    assert get_resp.status_code == 200
    assert get_resp.get_json()["job_title"] == "Full Stack Engineer"

    # Test download tex formatting resume_[company_name].tex
    download_tex = client.get(f"/api/resumes/{res_id}/download/tex")
    assert download_tex.status_code == 200
    assert "resume_cloud_corp.tex" in download_tex.headers.get("Content-Disposition", "")

    # Test delete resume
    del_resp = client.delete(f"/api/resumes/{res_id}")
    assert del_resp.status_code == 200

    # Ensure deleted
    assert client.get(f"/api/resumes/{res_id}").status_code == 404

def test_tailor_validation_errors(client):
    # Test missing job description
    bad_req = client.post("/api/resumes/tailor", json={"job_description": "   "})
    assert bad_req.status_code == 400
    assert "required" in bad_req.get_json()["error"].lower()
