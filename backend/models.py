from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class ResumeGeneration(db.Model):
    __tablename__ = "resume_generations"

    id = db.Column(db.Integer, primary_key=True)
    job_title = db.Column(db.String(255), nullable=False, default="Untitled Role")
    company_name = db.Column(db.String(255), nullable=False, default="General Application")
    job_description = db.Column(db.Text, nullable=False)
    tailored_latex = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=True)
    match_score = db.Column(db.Float, default=0.0)
    matched_keywords = db.Column(db.JSON, default=list)
    missing_keywords = db.Column(db.JSON, default=list)
    
    # Requirement Coverage Breakdown
    supported_requirements = db.Column(db.JSON, default=list)
    partially_supported_requirements = db.Column(db.JSON, default=list)
    unsupported_requirements = db.Column(db.JSON, default=list)
    jd_analysis = db.Column(db.JSON, default=dict)

    pdf_filename = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "job_title": self.job_title,
            "company_name": self.company_name,
            "job_description": self.job_description,
            "tailored_latex": self.tailored_latex,
            "summary": self.summary,
            "match_score": self.match_score,
            "matched_keywords": self.matched_keywords or [],
            "missing_keywords": self.missing_keywords or [],
            "supported_requirements": self.supported_requirements or [],
            "partially_supported_requirements": self.partially_supported_requirements or [],
            "unsupported_requirements": self.unsupported_requirements or [],
            "jd_analysis": self.jd_analysis or {},
            "pdf_filename": self.pdf_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
