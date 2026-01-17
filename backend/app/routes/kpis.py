"""
KPIs API Routes - Key Performance Indicators
Matches README: GET /api/kpis
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, case, text
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from typing import Optional

from app.services.database import get_db
from app.models.sales import Sale, SalesStreamRaw

router = APIRouter()


class KPIResponse(BaseModel):
    total_historical_records: int
    total_streaming_records: int
    total_sales_today: int
    total_sales_week: int
    total_sales_month: int
    average_daily_sales: float
    unique_stores: int
    unique_items: int
    data_range_start: Optional[date]
    data_range_end: Optional[date]
    last_stream_timestamp: Optional[datetime]
    sales_trend: str  # "up", "down", "stable"


@router.get("", response_model=KPIResponse)
async def get_kpis(db: AsyncSession = Depends(get_db)):
    """
    Get key performance indicators for the dashboard.
    
    Example: GET /api/kpis
    """
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    two_weeks_ago = today - timedelta(days=14)
    
    # Count historical records
    hist_count_result = await db.execute(
        select(func.count(Sale.id)).where(Sale.is_streaming == False)
    )
    total_historical = hist_count_result.scalar() or 0
    
    # Count streaming records
    stream_count_result = await db.execute(
        select(func.count(Sale.id)).where(Sale.is_streaming == True)
    )
    total_streaming = stream_count_result.scalar() or 0
    
    # Today's sales
    today_result = await db.execute(
        select(func.coalesce(func.sum(Sale.sales), 0))
        .where(Sale.date == today)
    )
    total_sales_today = today_result.scalar() or 0
    
    # Week's sales
    week_result = await db.execute(
        select(func.coalesce(func.sum(Sale.sales), 0))
        .where(Sale.date >= week_ago)
    )
    total_sales_week = week_result.scalar() or 0
    
    # Month's sales  
    month_result = await db.execute(
        select(func.coalesce(func.sum(Sale.sales), 0))
        .where(Sale.date >= month_ago)
    )
    total_sales_month = month_result.scalar() or 0
    
    # Average daily sales
    avg_result = await db.execute(
        select(func.avg(Sale.sales))
    )
    average_daily_sales = round(float(avg_result.scalar() or 0), 2)
    
    # Unique stores and items
    stores_result = await db.execute(
        select(func.count(func.distinct(Sale.store_id)))
    )
    unique_stores = stores_result.scalar() or 0
    
    items_result = await db.execute(
        select(func.count(func.distinct(Sale.item_id)))
    )
    unique_items = items_result.scalar() or 0
    
    # Date range
    range_result = await db.execute(
        select(func.min(Sale.date), func.max(Sale.date))
        .where(Sale.is_streaming == False)
    )
    date_range = range_result.one()
    
    # Last streaming timestamp
    last_stream_result = await db.execute(
        select(Sale.created_at)
        .where(Sale.is_streaming == True)
        .order_by(Sale.created_at.desc())
        .limit(1)
    )
    last_stream = last_stream_result.scalar()
    
    # Calculate sales trend (compare last week vs previous week)
    last_week_result = await db.execute(
        select(func.coalesce(func.sum(Sale.sales), 0))
        .where(and_(Sale.date >= week_ago, Sale.date < today))
    )
    last_week_sales = last_week_result.scalar() or 0
    
    prev_week_result = await db.execute(
        select(func.coalesce(func.sum(Sale.sales), 0))
        .where(and_(Sale.date >= two_weeks_ago, Sale.date < week_ago))
    )
    prev_week_sales = prev_week_result.scalar() or 0
    
    if prev_week_sales > 0:
        change = (last_week_sales - prev_week_sales) / prev_week_sales
        if change > 0.05:
            sales_trend = "up"
        elif change < -0.05:
            sales_trend = "down"
        else:
            sales_trend = "stable"
    else:
        sales_trend = "stable"
    
    return KPIResponse(
        total_historical_records=total_historical,
        total_streaming_records=total_streaming,
        total_sales_today=total_sales_today,
        total_sales_week=total_sales_week,
        total_sales_month=total_sales_month,
        average_daily_sales=average_daily_sales,
        unique_stores=unique_stores,
        unique_items=unique_items,
        data_range_start=date_range[0],
        data_range_end=date_range[1],
        last_stream_timestamp=last_stream,
        sales_trend=sales_trend
    )
