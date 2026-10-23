import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory or project root
load_dotenv(Path(__file__).parent / ".env")
load_dotenv(Path(__file__).parent.parent / ".env")

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = Path(os.getenv("DATA_DIR", str(PROJECT_ROOT / "data"))).resolve()

# Ensure DATA_DIR exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Database Configuration
# Default to SQLite for easy zero-setup testing, seamlessly switch to PostgreSQL via DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'restail.db'}")
# SQLAlchemy expects postgresql:// instead of postgres:// if using modern driver
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# LLM Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "").lower()
# Auto-detect provider if not explicitly set
if not LLM_PROVIDER:
    if os.getenv("GEMINI_API_KEY"):
        LLM_PROVIDER = "gemini"
    elif os.getenv("OPENAI_API_KEY"):
        LLM_PROVIDER = "openai"
    elif os.getenv("ANTHROPIC_API_KEY"):
        LLM_PROVIDER = "anthropic"
    else:
        LLM_PROVIDER = "openai"  # fallback default

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

# Compiler configuration
LATEX_COMPILER = os.getenv("LATEX_COMPILER", "auto")  # 'auto', 'pdflatex', 'tectonic', 'online', 'none'
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
