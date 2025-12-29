"""Application configuration."""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    app_name: str = "GPE User Study API"
    debug: bool = False
    
    # Database
    database_url: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./user_study.db"
    )
    
    # CORS
    cors_origins: list = [
        "http://localhost:3000",
        "https://gpe-user-study.onrender.com",
        "https://*.onrender.com",
    ]
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

