import os
from flask import Blueprint, jsonify, request
from config import DATABASE_URL, DATA_DIR, OUTPUT_DIR, LATEX_COMPILER
from services.llm_service import get_llm_config_status
from services.compiler_service import check_local_compiler

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

@settings_bp.route("", methods=["GET"])
def get_settings():
    """Returns application configuration and runtime status."""
    llm_status = get_llm_config_status()
    local_compiler = check_local_compiler()

    db_type = "PostgreSQL" if "postgresql" in DATABASE_URL.lower() else "SQLite"

    return jsonify({
        "database": {
            "type": db_type,
            "url_masked": DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL.split("///")[-1],
        },
        "llm": llm_status,
        "latex": {
            "mode": LATEX_COMPILER,
            "detected_local_compiler": local_compiler or "None (cloud or manual download mode)",
            "output_directory": str(OUTPUT_DIR),
        },
        "data_directory": str(DATA_DIR),
    })
