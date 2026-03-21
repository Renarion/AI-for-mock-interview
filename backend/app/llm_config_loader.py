"""Load LLM YAML config (prompts, models, catalog). API keys: yaml inline or .env."""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

from app.config import get_settings

_CONFIG_FILE = Path(__file__).resolve().parent / "llm_config.yaml"


@lru_cache
def load_llm_yaml() -> dict[str, Any]:
    if not _CONFIG_FILE.is_file():
        raise FileNotFoundError(f"LLM config not found: {_CONFIG_FILE}")
    with open(_CONFIG_FILE, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError("llm_config.yaml must be a mapping at the root")
    return data


def effective_llm_provider() -> str:
    """
    Приоритет: непустой LLM_PROVIDER в окружении → непустой llm_provider из Settings (.env)
    → поле provider в llm_config.yaml.
    """
    for candidate in (os.getenv("LLM_PROVIDER"), get_settings().llm_provider):
        if candidate and str(candidate).strip():
            p = str(candidate).strip().lower()
            if p in ("openai", "anthropic"):
                return p
    cfg = load_llm_yaml()
    p = str(cfg.get("provider", "openai")).strip().lower()
    return p if p in ("openai", "anthropic") else "openai"


def resolve_openai_api_key() -> str:
    cfg = load_llm_yaml()
    sec = cfg.get("secrets") or {}
    inline = str(sec.get("openai_api_key", "")).strip()
    if inline:
        return inline
    env_name = str(sec.get("openai_api_key_env", "OPENAI_API_KEY"))
    return os.getenv(env_name, "") or get_settings().openai_api_key


def resolve_anthropic_api_key() -> str:
    cfg = load_llm_yaml()
    sec = cfg.get("secrets") or {}
    inline = str(sec.get("anthropic_api_key", "")).strip()
    if inline:
        return inline
    env_name = str(sec.get("anthropic_api_key_env", "ANTHROPIC_API_KEY"))
    return os.getenv(env_name, "") or get_settings().anthropic_api_key


def get_openai_model() -> str:
    cfg = load_llm_yaml()
    models = cfg.get("models") or {}
    m = str(models.get("openai", "gpt-4o-mini")).strip()
    if m.lower().startswith("openai/"):
        m = m[7:]
    return m


def get_anthropic_model() -> str:
    cfg = load_llm_yaml()
    models = cfg.get("models") or {}
    return str(models.get("anthropic", "claude-3-5-sonnet-20241022"))


def get_full_interview_temperature() -> float:
    cfg = load_llm_yaml()
    t = (cfg.get("temperature") or {}).get("full_interview", 0.7)
    return float(t)


def get_max_tokens_openai_full_interview() -> int:
    cfg = load_llm_yaml()
    mt = (cfg.get("max_tokens") or {}).get("openai_full_interview", 4096)
    return int(mt)


def get_max_tokens_anthropic_full_interview() -> int:
    cfg = load_llm_yaml()
    mt = (cfg.get("max_tokens") or {}).get("anthropic_full_interview", 4096)
    return int(mt)


def get_full_interview_system_prompt() -> str:
    cfg = load_llm_yaml()
    prompts = cfg.get("prompts") or {}
    text = prompts.get("full_interview_system")
    if not text or not str(text).strip():
        raise ValueError("llm_config.yaml: prompts.full_interview_system is required")
    return str(text).strip()


def get_interview_catalog() -> dict[str, Any]:
    cfg = load_llm_yaml()
    cat = cfg.get("interview_catalog")
    if not isinstance(cat, dict):
        return {}
    return cat
