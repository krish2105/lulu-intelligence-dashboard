import asyncio
import random
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy import select, func
from app.services.database import async_session
from app.services.redis_client import publish_sale
from app.models.sales import Sale
from app.config import get_settings

settings = get_settings()


class DataGenerator:
    """
    Generates realistic streaming sales data based on historical patterns.
    Uses statistical properties from train.csv to mimic realistic sales.
    """
    
    def __init__(self):
        self.historical_stats = {}
        self.is_running = False
    
    async def _load_historical_stats(self):
        """Load statistical properties from historical data"""
        async with async_session() as session:
            # Get historical sales statistics
            result = await session.execute(
                select(
                    Sale.store_id,
                    Sale.item_id,
                    func.avg(Sale.sales).label('mean_sales'),
                    func.stddev(Sale.sales).label('std_sales'),
                    func.min(Sale.sales).label('min_sales'),
                    func.max(Sale.sales).label('max_sales')
                )
                .where(Sale.is_streaming == False)
                .group_by(Sale.store_id, Sale.item_id)
            )
            
            for row in result.fetchall():
                key = (row.store_id, row.item_id)
                self.historical_stats[key] = {
                    'mean': float(row.mean_sales) if row.mean_sales else 15,
                    'std': float(row.std_sales) if row.std_sales else 5,
                    'min': int(row.min_sales) if row.min_sales else 0,
                    'max': int(row.max_sales) if row.max_sales else 100
                }
    
    def _generate_sale_value(self, store_id: int, item_id: int) -> int:
        """Generate a realistic sale value based on historical patterns"""
        key = (store_id, item_id)
        stats = self.historical_stats.get(key, {'mean': 15, 'std': 5, 'min': 0, 'max': 100})
        
        # Add day-of-week seasonality
        day_of_week = datetime.now().weekday()
        seasonality_factor = 1.0 + 0.1 * np.sin(2 * np.pi * day_of_week / 7)
        
        # Generate value with normal distribution
        value = np.random.normal(stats['mean'] * seasonality_factor, stats['std'])
        
        # Clip to realistic bounds
        value = max(stats['min'], min(stats['max'], int(value)))
        
        return value
    
    async def _generate_and_store_sale(self):
        """Generate a new sale and store it in the database"""
        async with async_session() as session:
            # Randomly select store and item for variety
            store_id = random.randint(1, 10)
            item_id = random.randint(1, 50)
            
            sale = Sale(
                date=datetime.now().date(),
                store_id=store_id,
                item_id=item_id,
                sales=self._generate_sale_value(store_id, item_id),
                is_streaming=True
            )
            
            session.add(sale)
            await session.commit()
            await session.refresh(sale)
            
            # Publish to Redis for real-time streaming
            sale_data = {
                'id': sale.id,
                'date': sale.date.isoformat(),
                'store_id': sale.store_id,
                'item_id': sale.item_id,
                'sales': sale.sales,
                'is_streaming': sale.is_streaming,
                'created_at': sale.created_at.isoformat()
            }
            await publish_sale(sale_data)
            
            return sale_data
    
    async def start(self):
        """Start the data generation loop"""
        self.is_running = True
        await self._load_historical_stats()
        
        while self.is_running:
            try:
                sale_data = await self._generate_and_store_sale()
                print(f"Generated streaming sale: {sale_data}")
            except Exception as e:
                print(f"Error generating sale: {e}")
            
            await asyncio.sleep(settings.streaming_interval_seconds)
    
    def stop(self):
        """Stop the data generation loop"""
        self.is_running = False
