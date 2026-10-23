import os
from typing import Dict, Any
from config import (
    LLM_PROVIDER,
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_MODEL,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
)

def get_llm_config_status() -> Dict[str, Any]:
    """Returns the current configured LLM provider and available status."""
    has_gemini = bool(GEMINI_API_KEY)
    has_openai = bool(OPENAI_API_KEY)
    has_anthropic = bool(ANTHROPIC_API_KEY)

    active_provider = (LLM_PROVIDER or "").lower().strip()
    if active_provider == "gemini" and not has_gemini:
        active_provider = "openai" if has_openai else ("anthropic" if has_anthropic else "none")
    elif active_provider == "openai" and not has_openai:
        active_provider = "gemini" if has_gemini else ("anthropic" if has_anthropic else "none")
    elif not has_gemini and not has_openai and not has_anthropic:
        active_provider = "none"
    elif not active_provider:
        if has_gemini:
            active_provider = "gemini"
        elif has_openai:
            active_provider = "openai"
        elif has_anthropic:
            active_provider = "anthropic"

    return {
        "active_provider": active_provider,
        "is_configured": active_provider != "none",
        "providers": {
            "gemini": {"configured": has_gemini, "model": GEMINI_MODEL},
            "openai": {"configured": has_openai, "model": OPENAI_MODEL, "base_url": OPENAI_BASE_URL},
            "anthropic": {"configured": has_anthropic, "model": ANTHROPIC_MODEL},
        }
    }
