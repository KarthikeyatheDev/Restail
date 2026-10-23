import os
import json
import re
from typing import Dict, Any, Optional
import requests
from openai import OpenAI
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

class MissingCredentialsError(Exception):
    """Raised when required API credentials are missing from environment."""
    pass

class LLMExecutionError(Exception):
    """Raised when LLM call or response parsing fails."""
    pass

def get_active_llm_provider() -> str:
    """Detects which LLM provider has credentials set in environment variables."""
    provider = (LLM_PROVIDER or "").lower().strip()
    if provider == "gemini" and GEMINI_API_KEY:
        return "gemini"
    if provider == "openai" and OPENAI_API_KEY:
        return "openai"
    if provider == "anthropic" and ANTHROPIC_API_KEY:
        return "anthropic"

    # Auto-detection fallback
    if GEMINI_API_KEY:
        return "gemini"
    if OPENAI_API_KEY:
        return "openai"
    if ANTHROPIC_API_KEY:
        return "anthropic"

    return "none"

def parse_llm_json(raw_text: str) -> Dict[str, Any]:
    """Extracts and parses JSON object from LLM response text."""
    text = raw_text.strip()
    # Strip markdown code blocks
    if "```json" in text:
        match = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", text)
        if match:
            text = match.group(1).strip()
    elif "```" in text:
        match = re.search(r"```\s*(\{[\s\S]*?\})\s*```", text)
        if match:
            text = match.group(1).strip()
    
    # Fallback to finding outermost JSON braces
    if not (text.startswith("{") and text.endswith("}")):
        start_idx = text.find("{")
        end_idx = text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            text = text[start_idx:end_idx + 1]

    try:
        return json.loads(text)
    except Exception as e:
        raise LLMExecutionError(f"Failed to parse structured JSON from LLM: {str(e)}\nRaw Response: {raw_text[:300]}")

def call_gemini_api(system_instruction: str, user_prompt: str) -> Dict[str, Any]:
    if not GEMINI_API_KEY:
        raise MissingCredentialsError("GEMINI_API_KEY is not configured in environment variables.")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "parts": [{"text": user_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=90)
    except requests.exceptions.RequestException as re_err:
        raise LLMExecutionError(f"Network error connecting to Gemini API: {str(re_err)}")

    if resp.status_code == 429:
        raise LLMExecutionError("Gemini API rate limit or quota exceeded (HTTP 429). Please check your Google AI Studio plan/quota or supply another API key.")
    elif resp.status_code in (401, 403):
        raise LLMExecutionError(f"Gemini API authentication failed (HTTP {resp.status_code}). Please verify your GEMINI_API_KEY in backend/.env.")
    elif resp.status_code == 404:
        raise LLMExecutionError(f"Gemini model '{GEMINI_MODEL}' is not found or unsupported for generateContent (HTTP 404). Please set a supported model such as gemini-1.5-flash or gemini-2.0-flash.")
    elif resp.status_code != 200:
        raise LLMExecutionError(f"Gemini API returned HTTP {resp.status_code}: {resp.text[:300]}")

    data = resp.json()
    try:
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return parse_llm_json(raw_text)
    except (KeyError, IndexError) as err:
        raise LLMExecutionError(f"Unexpected response structure from Gemini API: {resp.text[:300]}")

def call_openai_api(system_instruction: str, user_prompt: str) -> Dict[str, Any]:
    if not OPENAI_API_KEY:
        raise MissingCredentialsError("OPENAI_API_KEY is not configured in environment variables.")

    client = OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_text = response.choices[0].message.content or "{}"
        return parse_llm_json(raw_text)
    except Exception as e:
        raise LLMExecutionError(f"OpenAI API call failed: {str(e)}")

def call_anthropic_api(system_instruction: str, user_prompt: str) -> Dict[str, Any]:
    if not ANTHROPIC_API_KEY:
        raise MissingCredentialsError("ANTHROPIC_API_KEY is not configured in environment variables.")

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    payload = {
        "model": ANTHROPIC_MODEL,
        "system": system_instruction,
        "max_tokens": 4096,
        "temperature": 0.2,
        "messages": [
            {"role": "user", "content": user_prompt + "\n\nRespond strictly with a valid JSON object."}
        ]
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=90)
        if resp.status_code != 200:
            raise LLMExecutionError(f"Anthropic API returned HTTP {resp.status_code}: {resp.text}")
        data = resp.json()
        raw_text = data["content"][0]["text"]
        return parse_llm_json(raw_text)
    except Exception as e:
        raise LLMExecutionError(f"Anthropic API call failed: {str(e)}")

def call_structured_llm(system_instruction: str, user_prompt: str) -> Dict[str, Any]:
    """Executes structured LLM generation with real API calls using active provider."""
    provider = get_active_llm_provider()
    if provider == "gemini":
        return call_gemini_api(system_instruction, user_prompt)
    elif provider == "openai":
        return call_openai_api(system_instruction, user_prompt)
    elif provider == "anthropic":
        return call_anthropic_api(system_instruction, user_prompt)
    else:
        raise MissingCredentialsError(
            "Missing LLM API credentials. Please set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env "
            "or as an environment variable to enable resume tailoring."
        )
