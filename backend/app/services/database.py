from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
from app.config import get_settings
from app.models.sales import Base

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    poolclass=NullPool if settings.environment == "testing" else None,
    echo=settings.debug
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


async def init_db():
    """Initialize database connection"""
    async with engine.begin() as conn:
        # Tables are created via init.sql, but this ensures connection works
        pass


async def close_db():
    """Close database connection"""
    await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database session"""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
