from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Persona Bot API"
    app_version: str = "0.1.0"
    environment: str = "local"
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")
    api_prefix: str = "/api"

    ollama_url: str = "http://localhost:11434"
    chat_model: str = "llama3.1:8b"
    embed_model: str = "nomic-embed-text"
    llm_timeout_seconds: float = 120.0
    cors_origins: list[str] = ["http://localhost:5173"]
    database_url: str = "postgresql://langan:langan_local_only@localhost:5432/langan_test"
    storage_root: str = "data"


@lru_cache
def get_settings() -> Settings:
    return Settings()
