from flask import Blueprint, request, jsonify
from services.file_service import (
    ALLOWED_FILES,
    get_all_files_status,
    read_source_file,
    write_source_file,
    init_starter_template,
)

files_bp = Blueprint("files", __name__, url_prefix="/api/files")

@files_bp.route("/status", methods=["GET"])
def files_status():
    """Returns the current readiness and metadata for all source files."""
    try:
        status = get_all_files_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/<filename>", methods=["GET"])
def get_file(filename: str):
    """Returns content of a specific source file."""
    if filename not in ALLOWED_FILES:
        return jsonify({"error": f"Invalid file name. Allowed: {list(ALLOWED_FILES.keys())}"}), 400
    try:
        content = read_source_file(filename)
        return jsonify({
            "name": filename,
            "content": content,
            "meta": ALLOWED_FILES[filename]
        })
    except FileNotFoundError:
        return jsonify({
            "name": filename,
            "content": "",
            "exists": False,
            "meta": ALLOWED_FILES[filename]
        }), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/<filename>", methods=["POST"])
def update_file(filename: str):
    """Updates content of a specific source file from JSON or multipart form file upload."""
    if filename not in ALLOWED_FILES:
        return jsonify({"error": f"Invalid file name. Allowed: {list(ALLOWED_FILES.keys())}"}), 400

    content = None
    # 1. Check if uploaded via multipart/form-data
    if "file" in request.files:
        uploaded_file = request.files["file"]
        content = uploaded_file.read().decode("utf-8")
    else:
        # 2. Check JSON payload
        data = request.get_json(silent=True) or {}
        content = data.get("content")

    if content is None:
        return jsonify({"error": "No content or file provided."}), 400

    try:
        result = write_source_file(filename, content)
        return jsonify({"success": True, "file": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/<filename>/init", methods=["POST"])
def init_file(filename: str):
    """Initializes starter template for a source file."""
    if filename not in ALLOWED_FILES:
        return jsonify({"error": f"Invalid file name. Allowed: {list(ALLOWED_FILES.keys())}"}), 400
    try:
        content = init_starter_template(filename)
        return jsonify({"success": True, "name": filename, "content": content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
