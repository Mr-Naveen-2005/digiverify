"""Configuration loader. Reads backend/.env for API keys and limits."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env if present
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)


class Settings:
    # OpenAI-compatible provider (works with OpenAI, OpenRouter, Azure, etc.)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "").strip()
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip()

    APP_ENV: str = os.getenv("APP_ENV", "development").strip()
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10").strip() or 10)

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024

    @property
    def openai_enabled(self) -> bool:
        return bool(self.OPENAI_API_KEY)


settings = Settings()
