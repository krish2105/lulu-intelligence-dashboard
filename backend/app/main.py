from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime

from app.config import get_settings, logger
from sqlalchemy import text
from app.services.database import init_db, close_db, async_session, engine
from app.services.redis_client import init_redis, close_redis
from app.services.data_generator import DataGenerator
from app.services.metrics import get_metrics
from app.services.employee_seeder import initialize_employee_system
from app.routes import sales, streaming, history, kpis, stream, analytics, auth
from app.routes import ai as ai_routes
from app.routes import inventory, promotions, alerts, admin, reports, monitoring, employees, logistics
from app.middleware import (
    RequestIDMiddleware, RateLimitMiddleware, SecurityHeadersMiddleware,
    BodySizeLimitMiddleware, CSRFMiddleware, SessionInvalidationMiddleware
)


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Sales Dashboard API...")
    logger.info(f"Environment: {settings.environment}")
    
    await init_db()
    logger.info("Database initialized")
    
    # Ensure promotions tables exist
    try:
        async with engine.begin() as conn:
            await conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE promotion_type AS ENUM (
                        'percentage_discount', 'fixed_discount', 'buy_one_get_one',
                        'buy_x_get_y', 'bundle_deal', 'clearance', 'loyalty_exclusive'
                    );
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """))
            await conn.execute(text("""
                DO $$ BEGIN
                    CREATE TYPE promotion_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled');
                EXCEPTION WHEN duplicate_object THEN null;
                END $$;
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS promotions (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    promotion_code VARCHAR(50) UNIQUE,
                    promotion_type promotion_type NOT NULL,
                    discount_value DECIMAL(10,2) NOT NULL,
                    discount_cap DECIMAL(10,2),
                    applies_to_all_stores BOOLEAN DEFAULT TRUE,
                    applies_to_all_items BOOLEAN DEFAULT FALSE,
                    minimum_purchase DECIMAL(10,2),
                    minimum_quantity INTEGER,
                    max_uses_total INTEGER,
                    max_uses_per_customer INTEGER,
                    current_uses INTEGER DEFAULT 0,
                    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                    status promotion_status DEFAULT 'draft',
                    total_revenue DECIMAL(14,2) DEFAULT 0,
                    total_discount_given DECIMAL(12,2) DEFAULT 0,
                    total_transactions INTEGER DEFAULT 0,
                    created_by INTEGER REFERENCES users(id),
                    approved_by INTEGER REFERENCES users(id),
                    approved_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS promotion_items (
                    id SERIAL PRIMARY KEY,
                    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
                    item_id INTEGER NOT NULL REFERENCES items(id),
                    custom_discount_value DECIMAL(10,2),
                    required_quantity INTEGER DEFAULT 1,
                    free_quantity INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_promotion_item UNIQUE (promotion_id, item_id)
                );
            """))
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS promotion_stores (
                    id SERIAL PRIMARY KEY,
                    promotion_id INTEGER NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
                    store_id INTEGER NOT NULL REFERENCES stores(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT unique_promotion_store UNIQUE (promotion_id, store_id)
                );
            """))
        logger.info("Promotions tables ensured")
    except Exception as e:
        logger.warning(f"Promotions table setup: {e}")
    
    await init_redis()
    logger.info("Redis initialized")
    
    # Initialize employee system (migration + seeding)
    try:
        await initialize_employee_system()
        logger.info("Employee system initialized")
    except Exception as e:
        logger.warning(f"Employee system initialization skipped: {e}")
    
    # Start the data generator background task
    generator = DataGenerator()
    task = asyncio.create_task(generator.start())
    logger.info("Data generator started")
    
    logger.info("Sales Dashboard API is ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Sales Dashboard API...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    await close_db()
    await close_redis()
    logger.info("Shutdown complete")


app = FastAPI(
    title="Sales Dashboard API",
    description="Real-time sales streaming and analytics API",
    version="1.0.0",
    lifespan=lifespan
)

# =============================================================================
# Middleware (order matters - first added = last executed)
# =============================================================================

# Security headers (outermost - always applied)
app.add_middleware(SecurityHeadersMiddleware)

# CSRF protection
app.add_middleware(CSRFMiddleware)

# Request body size limit
app.add_middleware(BodySizeLimitMiddleware)

# Session invalidation check (token blacklist)
app.add_middleware(SessionInvalidationMiddleware)

# Rate limiting (Redis-backed)
app.add_middleware(RateLimitMiddleware)

# Request ID tracking and logging
app.add_middleware(RequestIDMiddleware)

# CORS middleware (innermost - runs first)
cors_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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
app.include_router(ai_routes.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Inventory Management"])
app.include_router(promotions.router, prefix="/api/promotions", tags=["Promotions & Pricing"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts & Notifications"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(employees.router, prefix="/api/employees", tags=["Employees"])
app.include_router(logistics.router, prefix="/api/logistics", tags=["Logistics & Procurement"])

# Also mount /api/latest from stream router
@app.get("/api/latest", tags=["Stream"])
async def get_latest_redirect():
    """Redirect to stream latest endpoint"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/stream/latest")


# Handle legacy /api/stream/sales requests - redirect to /stream/sales
@app.get("/api/stream/sales", tags=["Stream"])
async def stream_sales_redirect(request: Request):
    """SSE endpoint for real-time sales streaming (legacy URL support)"""
    from app.routes.stream import event_generator
    return EventSourceResponse(event_generator(request))


@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    Returns: {"status":"healthy","database":"healthy","redis":"healthy","timestamp":"...","version":"1.0.0"}
    """
    from app.services.database import engine
    from app.services.redis_client import get_redis
    from sqlalchemy import text
    
    # Check database
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "unhealthy"
    
    # Check Redis
    try:
        redis = await get_redis()
        await redis.ping()
        redis_status = "healthy"
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        redis_status = "unhealthy"
    
    # Overall status
    if db_status == "healthy" and redis_status == "healthy":
        overall_status = "healthy"
    elif db_status == "unhealthy" and redis_status == "unhealthy":
        overall_status = "unhealthy"
    else:
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "database": db_status,
        "redis": redis_status,
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "environment": settings.environment
    }
