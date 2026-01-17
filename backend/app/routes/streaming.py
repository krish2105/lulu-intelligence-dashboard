from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
import asyncio
import json

from app.services.redis_client import get_redis, CHANNEL_SALES_STREAM

router = APIRouter()


async def event_generator(request: Request):
    """Generate SSE events from Redis pub/sub"""
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(CHANNEL_SALES_STREAM)
    
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
                    "event": "new_sale",
                    "data": data
                }
            
            await asyncio.sleep(0.1)
    finally:
        await pubsub.unsubscribe(CHANNEL_SALES_STREAM)
        await pubsub.close()


@router.get("")
async def stream_sales(request: Request):
    """SSE endpoint for real-time sales streaming"""
    return EventSourceResponse(event_generator(request))
