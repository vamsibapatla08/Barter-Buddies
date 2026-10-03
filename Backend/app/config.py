"""Environment-backed application settings."""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings():
    return Settings(
        database_url=os.getenv("DATABASE_URL", ""),
        supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET", ""),
        allowed_origins=[origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if origin.strip()],
    )


class Settings:
    def __init__(self, database_url: str, supabase_jwt_secret: str, allowed_origins: list[str]):
        self.database_url = database_url
        self.supabase_jwt_secret = supabase_jwt_secret
        self.allowed_origins = allowed_origins
