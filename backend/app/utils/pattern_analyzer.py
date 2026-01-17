"""
Pattern Analyzer - Statistical analysis for realistic data generation
Matches README: utils/pattern_analyzer.py
"""
from dataclasses import dataclass
from typing import Dict, List, Tuple, Optional
import numpy as np
from collections import defaultdict


@dataclass
class StoreItemStats:
    """Statistics for a store-item combination"""
    store_id: int
    item_id: int
    mean_sales: float
    std_sales: float
    min_sales: int
    max_sales: int
    frequency: int  # How often this combination appears


@dataclass
class WeekdayPattern:
    """Sales pattern by day of week"""
    weekday: int  # 0=Monday, 6=Sunday
    avg_multiplier: float  # Relative to overall average


class PatternAnalyzer:
    """
    Analyzes historical sales data to extract patterns for realistic data generation.
    
    Features:
    - Frequency distribution of store-item combinations
    - Mean, stddev, min, max for each pair
    - Weekday effects (Mon-Sun patterns)
    """
    
    def __init__(self):
        self.store_item_stats: Dict[Tuple[int, int], StoreItemStats] = {}
        self.weekday_patterns: Dict[int, WeekdayPattern] = {}
        self.overall_mean: float = 0.0
        self.overall_std: float = 0.0
        self.total_records: int = 0
        self._weights: Optional[np.ndarray] = None
        self._pairs: Optional[List[Tuple[int, int]]] = None
    
    def analyze(self, data: List[Dict]) -> None:
        """
        Analyze historical data to extract patterns.
        
        Args:
            data: List of dicts with keys: store_id, item_id, sales, date (or weekday)
        """
        if not data:
            return
        
        # Group by store-item
        grouped = defaultdict(list)
        weekday_sales = defaultdict(list)
        all_sales = []
        
        for record in data:
            store_id = record['store_id']
            item_id = record['item_id']
            sales = record['sales']
            
            grouped[(store_id, item_id)].append(sales)
            all_sales.append(sales)
            
            # Extract weekday if available
            if 'weekday' in record:
                weekday = record['weekday']
            elif 'date' in record:
                # Assume date is a datetime or date object
                weekday = record['date'].weekday()
            else:
                weekday = None
            
            if weekday is not None:
                weekday_sales[weekday].append(sales)
        
        # Calculate overall stats
        self.overall_mean = np.mean(all_sales) if all_sales else 0.0
        self.overall_std = np.std(all_sales) if all_sales else 0.0
        self.total_records = len(data)
        
        # Calculate store-item stats
        for (store_id, item_id), sales_list in grouped.items():
            sales_arr = np.array(sales_list)
            self.store_item_stats[(store_id, item_id)] = StoreItemStats(
                store_id=store_id,
                item_id=item_id,
                mean_sales=float(np.mean(sales_arr)),
                std_sales=float(np.std(sales_arr)),
                min_sales=int(np.min(sales_arr)),
                max_sales=int(np.max(sales_arr)),
                frequency=len(sales_list)
            )
        
        # Calculate weekday patterns
        if self.overall_mean > 0:
            for weekday, sales_list in weekday_sales.items():
                weekday_avg = np.mean(sales_list)
                self.weekday_patterns[weekday] = WeekdayPattern(
                    weekday=weekday,
                    avg_multiplier=weekday_avg / self.overall_mean
                )
        
        # Prepare weighted sampling
        self._prepare_weighted_sampling()
    
    def _prepare_weighted_sampling(self) -> None:
        """Prepare arrays for weighted random sampling"""
        pairs = list(self.store_item_stats.keys())
        frequencies = [self.store_item_stats[p].frequency for p in pairs]
        total_freq = sum(frequencies)
        
        if total_freq > 0:
            self._pairs = pairs
            self._weights = np.array(frequencies) / total_freq
    
    def sample_store_item(self) -> Tuple[int, int]:
        """
        Sample a store-item pair based on historical frequency.
        More frequent combinations appear more often.
        """
        if self._pairs is None or self._weights is None:
            # Fallback to random if not analyzed
            return (np.random.randint(1, 11), np.random.randint(1, 51))
        
        idx = np.random.choice(len(self._pairs), p=self._weights)
        return self._pairs[idx]
    
    def generate_sales_value(self, store_id: int, item_id: int, weekday: int = None) -> int:
        """
        Generate a realistic sales value for a store-item combination.
        
        Args:
            store_id: Store ID
            item_id: Item ID
            weekday: Day of week (0=Monday, 6=Sunday), optional
        
        Returns:
            Generated sales value
        """
        stats = self.store_item_stats.get((store_id, item_id))
        
        if stats is None:
            # Fallback to overall stats
            base = self.overall_mean
            std = self.overall_std
        else:
            base = stats.mean_sales
            std = stats.std_sales
        
        # Apply weekday multiplier
        if weekday is not None and weekday in self.weekday_patterns:
            multiplier = self.weekday_patterns[weekday].avg_multiplier
            base *= multiplier
        
        # Add noise using normal distribution
        noise = np.random.normal(0, std) if std > 0 else 0
        value = base + noise
        
        # Ensure non-negative and round
        return max(0, round(value))
    
    def get_stats_summary(self) -> Dict:
        """Get a summary of analyzed patterns"""
        return {
            "total_records": self.total_records,
            "unique_store_item_pairs": len(self.store_item_stats),
            "overall_mean": round(self.overall_mean, 2),
            "overall_std": round(self.overall_std, 2),
            "weekday_patterns": {
                wd: round(pattern.avg_multiplier, 3)
                for wd, pattern in self.weekday_patterns.items()
            }
        }
