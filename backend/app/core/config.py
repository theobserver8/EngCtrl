import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    """Application settings. Every value can be overridden with an environment variable."""

    app_name: str = "CEMOSA Todo API"
    data_file: Path = APP_DIR / "todos.json"
    cors_origins: tuple[str, ...] = ("*",)


def _parse_origins(raw: str) -> tuple[str, ...]:
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


@lru_cache
def get_settings() -> Settings:
    """Build the settings once, reading overrides from the environment."""
    defaults = Settings()
    return Settings(
        data_file=Path(os.getenv("TODO_DATA_FILE", defaults.data_file)),
        cors_origins=_parse_origins(os.getenv("TODO_CORS_ORIGINS", ""))
        or defaults.cors_origins,
    )
