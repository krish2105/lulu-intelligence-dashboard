"""
Stream API Routes - SSE Streaming and Latest Data
Matches README: GET /stream/sales, GET /api/latest
"""
from fastapi import APIRouter, Request, Depends, Query
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import List
from pydantic import BaseModel
import asyncio
import json

from app.services.database import get_db
from app.services.redis_client import get_redis, CHANNEL_SALES_STREAM
from app.models.sales import Sale, Store, Item

router = APIRouter()


class LatestSaleResponse(BaseModel):
    id: int
    event_id: str | None = None
    timestamp: datetime
    store_id: int
    store_name: str | None = None
    item_id: int
    item_name: str | None = None
    sales: int
    is_streaming: bool
    
    class Config:
        from_attributes = True


@router.get("/latest", response_model=List[LatestSaleResponse])
async def get_latest(
    limit: int = Query(20, le=100, description="Number of records to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get latest sales records (both historical and streaming).
    
    Example: GET /api/latest?limit=20
    """
    # Get stores and items for name lookup
    stores_result = await db.execute(select(Store))
    stores = {s.id: s.name for s in stores_result.scalars().all()}
    
    items_result = await db.execute(select(Item))
    items = {i.id: i.name for i in items_result.scalars().all()}
    
    # Get latest records
    query = select(Sale).order_by(Sale.created_at.desc()).limit(limit)
    result = await db.execute(query)
    records = result.scalars().all()
    
    return [
        LatestSaleResponse(
            id=r.id,
            event_id=None,
            timestamp=r.created_at,
            store_id=r.store_id,
            store_name=stores.get(r.store_id),
            item_id=r.item_id,
            item_name=items.get(r.item_id),
            sales=r.sales,
            is_streaming=r.is_streaming
        )
        for r in records
    ]


async def event_generator(request: Request):
    """Generate SSE events from Redis pub/sub"""
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(CHANNEL_SALES_STREAM)
    
    # Send initial connection event
    yield {
        "event": "connected",
        "data": json.dumps({"message": "Connected to sales stream"})
    }
    
    try:
        while True:
            if await request.is_disconnected():
                break
            
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=1.0
            )
            
            if message and message['type'] == 'message':
                data = message['data']
                yield {
                    "event": "sales",
                    "data": data
                }
            
            await asyncio.sleep(0.1)
    finally:
        await pubsub.unsubscribe(CHANNEL_SALES_STREAM)
        await pubsub.close()


@router.get("/sales")
async def stream_sales(request: Request):
    """
    SSE endpoint for real-time sales streaming.
    
    Example: GET /stream/sales
    
    Returns events:
    - event: connected - Initial connection confirmation
    - event: sales - New sale data
    """
    return EventSourceResponse(event_generator(request))
