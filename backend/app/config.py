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
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()
    APP_ENV: str = os.getenv("APP_ENV", "development").strip()
    MAX_UPLOAD_MB: int = int(os.getenv("MAX_UPLOAD_MB", "10").strip() or 10)

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.GEMINI_API_KEY)


settings = Settings()
