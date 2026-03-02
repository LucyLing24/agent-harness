"""Application configuration."""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "Agent Harness"
    APP_VERSION: str = "0.1.0"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./harness.db")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o")
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    # Intervention settings
    REQUIRE_PLAN_APPROVAL: bool = True
    REQUIRE_TOOL_APPROVAL: bool = True
    SENSITIVE_TOOLS: list[str] = ["execute_code", "file_write", "database_write", "payment"]


settings = Settings()
