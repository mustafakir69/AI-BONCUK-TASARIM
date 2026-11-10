from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str | None = Field(default=None, repr=False)
    ai_model: str | None = None
    ai_provider: Literal["openai", "9router"] = "openai"
    ninerouter_base_url: str = "http://127.0.0.1:20128/v1"
    ninerouter_api_key: str | None = Field(default=None, repr=False)
    ninerouter_model: str | None = None
    ninerouter_model_compatibility_verified: bool = False
    ninerouter_vision_verified: bool = False
    ninerouter_json_mode: Literal["prompt_json", "json_object"] = "prompt_json"
    ai_calls_enabled: bool = False
    ai_request_timeout_seconds: float = Field(default=45, ge=5, le=120)
    ai_max_output_tokens: int = Field(default=6000, ge=500, le=12000)
    ai_max_retries: int = Field(default=1, ge=0, le=2)
    ai_rate_limit_requests: int = Field(default=5, ge=1, le=60)
    ai_rate_limit_window_seconds: int = Field(default=60, ge=10, le=3600)
    ai_max_concurrent_requests: int = Field(default=2, ge=1, le=8)
    ai_allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"

    @field_validator("ai_allowed_origins")
    @classmethod
    def validate_origins(cls, value: str) -> str:
        origins = [part.strip() for part in value.split(",") if part.strip()]
        if not origins or any(
            origin == "*" or not origin.startswith(("http://", "https://")) for origin in origins
        ):
            raise ValueError("CORS kaynakları açık http(s) adresleri olmalı; joker kaynak kabul edilmez.")
        return value

    @field_validator("ninerouter_base_url")
    @classmethod
    def validate_ninerouter_base_url(cls, value: str) -> str:
        parsed = urlparse(value.rstrip("/"))
        if (
            parsed.scheme != "http"
            or parsed.hostname != "127.0.0.1"
            or parsed.port != 20128
            or parsed.path != "/v1"
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError("9Router adresi yalnız http://127.0.0.1:20128/v1 olabilir.")
        return value.rstrip("/")

    @property
    def allowed_origins(self) -> list[str]:
        return [part.strip() for part in self.ai_allowed_origins.split(",") if part.strip()]

    @property
    def provider_ready(self) -> bool:
        return self.provider_configured(self.ai_provider)

    def provider_configured(self, provider_id: Literal["openai", "9router"]) -> bool:
        if not self.ai_calls_enabled:
            return False
        if provider_id == "openai":
            return bool(self.openai_api_key and self.ai_model)
        return bool(self.ninerouter_model and self.ninerouter_model_compatibility_verified)


@lru_cache
def get_settings() -> Settings:
    return Settings()
