from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ollama_url: str = "http://localhost:11434"
    chat_model: str = "llama3.1:8b"
    embed_model: str = "nomic-embed-text"
    llm_timeout_seconds: float = 120.0
    cors_origins: list[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
