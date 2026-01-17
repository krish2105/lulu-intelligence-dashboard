from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

from app.config import get_settings
from app.services.database import init_db, close_db
from app.services.redis_client import init_redis, close_redis
from app.services.data_generator import DataGenerator
from app.routes import sales, streaming, history, kpis, stream, analytics


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_redis()
    
    # Start the data generator background task
    generator = DataGenerator()
    task = asyncio.create_task(generator.start())
    
    yield
    
    # Shutdown
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_db()
    await close_redis()


app = FastAPI(
    title="Sales Dashboard API",
    description="Real-time sales streaming and analytics API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Original Routes (backward compatibility)
# =============================================================================
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(streaming.router, prefix="/api/stream", tags=["Streaming-Legacy"])

# =============================================================================
# New Routes (as per README architecture)
# =============================================================================
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(kpis.router, prefix="/api/kpis", tags=["KPIs"])
app.include_router(stream.router, prefix="/stream", tags=["Stream"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

# Also mount /api/latest from stream router
@app.get("/api/latest", tags=["Stream"])
async def get_latest_redirect():
    """Redirect to stream latest endpoint"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/stream/latest")


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns: {"status":"healthy","database":"healthy","timestamp":"...","version":"1.0.0"}
    """
    from app.services.database import engine
    from sqlalchemy import text
    
    try:
        # Test database connection
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
