import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from services.compiler_service import validate_latex_structure, compile_latex_to_pdf
from services.file_service import get_all_files_status, read_source_file
from config import DATA_DIR

def test_latex_structure_validation():
    valid_latex = """
    \\documentclass[letterpaper,10pt]{article}
    \\begin{document}
    \\section{Experience}
    Software Engineer at Acme Corp.
    \\end{document}
    """
    is_valid, msg = validate_latex_structure(valid_latex)
    assert is_valid is True

    # Missing \end{document}
    invalid_latex = """
    \\documentclass[letterpaper,10pt]{article}
    \\begin{document}
    Missing end document
    """
    is_valid, msg = validate_latex_structure(invalid_latex)
    assert is_valid is False
    assert "missing \\end{document}" in msg.lower()

    # Empty string
    is_valid, msg = validate_latex_structure("")
    assert is_valid is False

def test_source_files_never_overwritten_by_compilation():
    """
    Verifies that compiling a resume or generating outputs NEVER overwrites
    or touches the three personal source files in data/.
    """
    # Record initial contents of source files if they exist
    files_to_check = ["behavior.md", "master_resume.tex", "sample_resume.tex"]
    initial_contents = {}
    for fname in files_to_check:
        fpath = DATA_DIR / fname
        if fpath.exists():
            initial_contents[fname] = fpath.read_text(encoding="utf-8")

    # Run compile on a test snippet
    test_latex = "\\documentclass{article}\\begin{document}Test Non-Overwrite\\end{document}"
    compile_res = compile_latex_to_pdf(test_latex, file_prefix="test_non_overwrite")
    
    assert "tex_filename" in compile_res

    # Verify that data/ source files remain 100% untouched
    for fname, initial_text in initial_contents.items():
        current_text = (DATA_DIR / fname).read_text(encoding="utf-8")
        assert current_text == initial_text, f"Source file {fname} was mutated during compilation!"
