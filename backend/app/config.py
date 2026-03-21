"""Application configuration."""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore",  # ignore unknown env vars (e.g. old CLERK_*)
    }
    
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/mock_interview"
    
    # LLM: только OpenAI; модель и промпт — в app/llm_config.yaml
    openai_api_key: str = ""
    # Опционально: OpenAI-compatible API (прокси), если 403 unsupported_country с api.openai.com
    openai_base_url: str = ""
    
    # YooKassa Payment
    yookassa_shop_id: str = ""
    yookassa_secret_key: str = ""
    
    # App Settings
    secret_key: str = "change-me-in-production"
    debug: bool = True
    frontend_url: str = "http://localhost:3000"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
