from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://salesuser:salespass@localhost:5432/salesdb"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Application
    environment: str = "development"
    debug: bool = True
    
    # Streaming - 10 seconds for fast real-time updates
    streaming_interval_seconds: int = 10
    
    # Predictions
    forecast_days: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
