from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


# reads from env vars or the .env file, falls back to the defaults below
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Persona Bot API"
    app_version: str = "0.1.0"
    environment: str = "local"
    debug: bool = False
    api_prefix: str = "/api"
    cors_origins: list[str] = ["http://localhost:5173"]


# cached so .env only gets read once
@lru_cache
def get_settings() -> Settings:
    return Settings()
