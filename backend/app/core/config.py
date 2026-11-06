from dataclasses import dataclass

from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from environs import Env

BASE_DIR = Path(__file__).resolve().parents[2]

@dataclass
class LogSettings:
    level: str
    format: str

class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int
    POSTGRES_DB: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    LOG: LogSettings

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env", extra="ignore")

    @property
    def database_url_asyncpg(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    @property
    def database_url_psycopg(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

env: Env = Env()
env.read_env(BASE_DIR / ".env")

settings = Settings(
    LOG=LogSettings(
        level=env("LOG_LEVEL", "INFO"),
        format=env("LOG_FORMAT", "%(levelname)s: %(message)s"),
    )
)
