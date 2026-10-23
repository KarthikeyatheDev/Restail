import os
from flask import Blueprint, request, jsonify, send_file
from models import db, ResumeGeneration
from services.pipeline_orchestrator import execute_tailoring_pipeline
from services.llm_client import MissingCredentialsError, LLMExecutionError
from services.compiler_service import compile_latex_to_pdf
from config import OUTPUT_DIR

resumes_bp = Blueprint("resumes", __name__, url_prefix="/api/resumes")

@resumes_bp.route("", methods=["GET"])
def get_resumes():
    """Returns all generated resumes ordered by created_at desc."""
    try:
        limit = request.args.get("limit", default=None, type=int)
        query = ResumeGeneration.query.order_by(ResumeGeneration.created_at.desc())
        if limit:
            query = query.limit(limit)
        resumes = query.all()
        return jsonify([r.to_dict() for r in resumes])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@resumes_bp.route("/<int:resume_id>", methods=["GET"])
def get_resume(resume_id: int):
    """Returns a specific resume."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    return jsonify(resume.to_dict())


@resumes_bp.route("/<int:resume_id>", methods=["DELETE"])
def delete_resume(resume_id: int):
    """Deletes a specific resume."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    try:
        tex_path = OUTPUT_DIR / f"resume_{resume.id}.tex"
        pdf_path = OUTPUT_DIR / f"resume_{resume.id}.pdf"
        if tex_path.exists():
            tex_path.unlink()
        if pdf_path.exists():
            pdf_path.unlink()

        db.session.delete(resume)
        db.session.commit()
        return jsonify({"success": True, "message": f"Resume {resume_id} deleted."})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@resumes_bp.route("/tailor", methods=["POST"])
def tailor():
    """
    Executes the 6-step resume tailoring pipeline using real API calls:
    1. JD analysis
    2. Master resume reading & skill identification
    3. Behavior.md rule adherence & selective project inclusion
    4. Fact-preserving bullet point rewriting
    5. Complete standalone LaTeX generation preserving template layout
    6. Audit report with supported, partially supported, and unsupported requirements
    """
    data = request.get_json() or {}
    job_description = data.get("job_description", "").strip()
    job_title = data.get("job_title", "").strip()
    company_name = data.get("company_name", "").strip()

    if not job_description:
        return jsonify({"error": "Job description is required."}), 400

    try:
        # Execute the 6-step pipeline
        result = execute_tailoring_pipeline(
            job_description=job_description,
            job_title=job_title,
            company_name=company_name
        )

        # Save record in database
        resume = ResumeGeneration(
            job_title=result.get("job_title", job_title or "Untitled Role"),
            company_name=result.get("company_name", company_name or "General Application"),
            job_description=job_description,
            tailored_latex=result["tailored_latex"],
            summary=result.get("summary", ""),
            match_score=result.get("match_score", 0.0),
            matched_keywords=result.get("matched_keywords", []),
            missing_keywords=result.get("missing_keywords", []),
            supported_requirements=result.get("supported_requirements", []),
            partially_supported_requirements=result.get("partially_supported_requirements", []),
            unsupported_requirements=result.get("unsupported_requirements", []),
            jd_analysis=result.get("jd_analysis", {}),
        )
        db.session.add(resume)
        db.session.commit()

        # Attempt compilation to PDF
        compile_res = compile_latex_to_pdf(result["tailored_latex"], file_prefix=f"resume_{resume.id}")
        if compile_res.get("success") and compile_res.get("pdf_filename"):
            resume.pdf_filename = compile_res["pdf_filename"]
            db.session.commit()

        response_data = resume.to_dict()
        response_data["compilation"] = compile_res
        return jsonify(response_data), 201

    except MissingCredentialsError as mce:
        return jsonify({
            "error": str(mce),
            "code": "MISSING_CREDENTIALS",
            "message": "Please configure GEMINI_API_KEY or OPENAI_API_KEY in backend/.env to run live tailoring."
        }), 401
    except ValueError as ve:
        return jsonify({
            "error": str(ve),
            "code": "SOURCE_FILES_INCOMPLETE"
        }), 400
    except LLMExecutionError as lee:
        return jsonify({
            "error": str(lee),
            "code": "LLM_EXECUTION_FAILED"
        }), 502
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to tailor resume: {str(e)}"}), 500


@resumes_bp.route("/<int:resume_id>/compile", methods=["POST"])
def recompile(resume_id: int):
    """Recompiles the LaTeX of an existing resume."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404

    data = request.get_json() or {}
    latex_code = data.get("latex", resume.tailored_latex)

    if latex_code != resume.tailored_latex:
        resume.tailored_latex = latex_code

    compile_res = compile_latex_to_pdf(latex_code, file_prefix=f"resume_{resume.id}")
    if compile_res.get("success") and compile_res.get("pdf_filename"):
        resume.pdf_filename = compile_res["pdf_filename"]
    
    db.session.commit()
    res_dict = resume.to_dict()
    res_dict["compilation"] = compile_res
    return jsonify(res_dict)


@resumes_bp.route("/<int:resume_id>/download/tex", methods=["GET"])
def download_tex(resume_id: int):
    """Downloads the .tex file."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    
    tex_path = OUTPUT_DIR / f"resume_{resume.id}.tex"
    if not tex_path.exists():
        tex_path.write_text(resume.tailored_latex, encoding="utf-8")
    
    sanitized_company = "".join(
        c for c in (resume.company_name or "tailored").lower().replace(" ", "_") if c.isalnum() or c in ("-", "_")
    ).strip("-_")
    filename = f"resume_{sanitized_company or 'tailored'}.tex"
    return send_file(tex_path, as_attachment=True, download_name=filename, mimetype="text/x-tex")


@resumes_bp.route("/<int:resume_id>/download/pdf", methods=["GET"])
def download_pdf(resume_id: int):
    """Downloads the compiled PDF file with filename format resume_[company_name].pdf."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    
    pdf_path = OUTPUT_DIR / f"resume_{resume.id}.pdf"
    if not pdf_path.exists():
        return jsonify({"error": "PDF not compiled yet. Please compile LaTeX first."}), 404

    sanitized_company = "".join(
        c for c in (resume.company_name or "tailored").lower().replace(" ", "_") if c.isalnum() or c in ("-", "_")
    ).strip("-_")
    filename = f"resume_{sanitized_company or 'tailored'}.pdf"
    return send_file(pdf_path, as_attachment=True, download_name=filename, mimetype="application/pdf")


@resumes_bp.route("/<int:resume_id>/pdf", methods=["GET"])
def view_pdf(resume_id: int):
    """Serves the PDF inline for browser viewing / iframe."""
    resume = ResumeGeneration.query.get(resume_id)
    if not resume:
        return jsonify({"error": "Resume not found"}), 404
    
    pdf_path = OUTPUT_DIR / f"resume_{resume.id}.pdf"
    if not pdf_path.exists():
        return jsonify({"error": "PDF not available"}), 404

    return send_file(pdf_path, mimetype="application/pdf")
