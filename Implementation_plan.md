# Lulu Hypermarket UAE - Sales Dashboard Implementation Plan

## Executive Summary

This document serves as the complete blueprint for the Lulu Hypermarket UAE Sales Dashboard - a real-time streaming analytics platform that combines historical sales data with live streaming updates and predictive analytics.

---

## 1. Project Overview

### 1.1 Objective
Build a production-ready sales dashboard for Lulu Hypermarket UAE that:
- Displays historical sales data from multiple UAE store locations
- Generates and displays real-time streaming sales data every minute
- Provides predictive analytics for future sales forecasting
- Offers an intuitive, responsive web interface

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 14.1.0 |
| Styling | Tailwind CSS | 3.4.1 |
| Charts | Recharts | 2.10.4 |
| Backend | FastAPI | 0.109.0 |
| Database | PostgreSQL | 15 |
| Cache/Pub-Sub | Redis | 7 |
| Container | Docker Compose | 3.8 |
| Language (Backend) | Python | 3.11 |
| Language (Frontend) | TypeScript | 5.3.3 |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER NETWORK                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  PostgreSQL │◄───│   Redis     │◄───│  FastAPI    │◄───│   Next.js   │  │
│  │  (Primary)  │    │  (Pub/Sub)  │    │  Backend    │    │  Frontend   │  │
│  │  Port: 5432 │    │  Port: 6379 │    │  Port: 8000 │    │  Port: 3000 │  │
│  └──────┬──────┘    └─────────────┘    └──────┬──────┘    └─────────────┘  │
│         │                                      │                            │
│         │           ┌─────────────┐           │                            │
│         └──────────►│  Data Gen   │◄──────────┘                            │
│                     │  (Cron Job) │                                        │
│                     └─────────────┘                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Model

### 2.1 Store Locations (Lulu Hypermarket UAE)

| Store ID | Store Name | Location |
|----------|------------|----------|
| 1 | Lulu Hypermarket Al Barsha | Dubai |
| 2 | Lulu Hypermarket Deira City Centre | Dubai |
| 3 | Lulu Hypermarket Karama | Dubai |
| 4 | Lulu Hypermarket Mushrif Mall | Abu Dhabi |
| 5 | Lulu Hypermarket Al Wahda | Abu Dhabi |
| 6 | Lulu Hypermarket Khalidiyah | Abu Dhabi |
| 7 | Lulu Hypermarket Sharjah City Centre | Sharjah |
| 8 | Lulu Hypermarket Al Nahda | Sharjah |
| 9 | Lulu Hypermarket Ajman | Ajman |
| 10 | Lulu Hypermarket Ras Al Khaimah | Ras Al Khaimah |

### 2.2 Product Categories (Grocery Items)

| Item ID | Product Name | Category |
|---------|--------------|----------|
| 1 | Basmati Rice (5kg) | Rice & Grains |
| 2 | Arabic Bread (Pack of 6) | Bakery |
| 3 | Fresh Chicken (1kg) | Poultry |
| 4 | Almarai Full Cream Milk (1L) | Dairy |
| 5 | Al Ain Bottled Water (1.5L x 6) | Beverages |
| 6 | Nescafe Classic (200g) | Beverages |
| 7 | Lipton Yellow Label Tea (200 bags) | Beverages |
| 8 | Extra Virgin Olive Oil (1L) | Cooking Oils |
| 9 | Fresh Tomatoes (1kg) | Vegetables |
| 10 | Fresh Bananas (1kg) | Fruits |
| 11 | Lurpak Butter (500g) | Dairy |
| 12 | Philadelphia Cream Cheese (500g) | Dairy |
| 13 | Al Rawabi Fresh Juice (1L) | Beverages |
| 14 | Maggi Noodles (Pack of 10) | Instant Food |
| 15 | Heinz Tomato Ketchup (500g) | Condiments |
| 16 | Goody Mayonnaise (500g) | Condiments |
| 17 | Nutella (750g) | Spreads |
| 18 | Kellogg's Corn Flakes (500g) | Breakfast |
| 19 | Fresh Eggs (30 pack) | Eggs |
| 20 | Sadia Frozen Chicken Nuggets (500g) | Frozen Foods |
| 21 | McCain French Fries (1kg) | Frozen Foods |
| 22 | Al Kabeer Beef Burger (8 pcs) | Frozen Foods |
| 23 | Puck Cheese Slices (24 pcs) | Dairy |
| 24 | Rainbow Evaporated Milk (410g) | Dairy |
| 25 | Nido Milk Powder (2.5kg) | Dairy |
| 26 | Tide Washing Powder (6kg) | Household |
| 27 | Fairy Dish Soap (1L) | Household |
| 28 | Dettol Antiseptic (1L) | Personal Care |
| 29 | Colgate Toothpaste (150g) | Personal Care |
| 30 | Head & Shoulders Shampoo (400ml) | Personal Care |
| 31 | Pampers Diapers (64 pcs) | Baby Care |
| 32 | Huggies Baby Wipes (64 pcs) | Baby Care |
| 33 | Red Bull Energy Drink (4 pack) | Beverages |
| 34 | Pepsi (2.25L) | Beverages |
| 35 | Coca-Cola (2.25L) | Beverages |
| 36 | Fresh Lamb (1kg) | Meat |
| 37 | Fresh Salmon Fillet (500g) | Seafood |
| 38 | Fresh Shrimp (500g) | Seafood |
| 39 | Saffron (1g) | Spices |
| 40 | Cardamom (100g) | Spices |
| 41 | Fresh Dates (1kg) | Fruits |
| 42 | Arabic Coffee (250g) | Beverages |
| 43 | Hummus (400g) | Deli |
| 44 | Labneh (500g) | Dairy |
| 45 | Tahini (400g) | Condiments |
| 46 | Baklava Box (500g) | Sweets |
| 47 | Fresh Mango (1kg) | Fruits |
| 48 | Cucumber (1kg) | Vegetables |
| 49 | Onions (2kg) | Vegetables |
| 50 | Potatoes (2kg) | Vegetables |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   stores    │       │    sales    │       │    items    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │──────►│ store_id(FK)│       │ id (PK)     │
│ name        │       │ item_id (FK)│◄──────│ name        │
│ location    │       │ date        │       │ category    │
│ created_at  │       │ sales       │       │ created_at  │
└─────────────┘       │ is_streaming│       └─────────────┘
                      │ created_at  │
                      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │ predictions │
                      ├─────────────┤
                      │ id (PK)     │
                      │ store_id(FK)│
                      │ item_id (FK)│
                      │ pred_date   │
                      │ pred_sales  │
                      │ conf_lower  │
                      │ conf_upper  │
                      │ model_ver   │
                      └─────────────┘
```

### 3.2 Table Definitions

#### stores
```sql
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### items
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### sales
```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    sales INTEGER NOT NULL CHECK (sales >= 0),
    is_streaming BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### predictions
```sql
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    prediction_date DATE NOT NULL,
    predicted_sales FLOAT NOT NULL,
    confidence_lower FLOAT,
    confidence_upper FLOAT,
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prediction_date, store_id, item_id)
);
```

### 3.3 Indexes

```sql
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_sales_store_item ON sales(store_id, item_id);
CREATE INDEX idx_sales_streaming ON sales(is_streaming);
```

---

## 4. API Endpoints

### 4.1 Sales Endpoints

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| GET | `/api/sales` | Get sales data | `start_date`, `end_date`, `store_id`, `item_id`, `streaming_only`, `limit`, `offset` |
| GET | `/api/sales/aggregated` | Get aggregated daily sales | `start_date`, `end_date`, `store_id`, `item_id` |
| GET | `/api/sales/metrics` | Get dashboard metrics | `store_id`, `item_id` |
| GET | `/api/sales/predictions` | Get sales predictions | `store_id`, `item_id`, `days` |

### 4.2 Streaming Endpoints

| Method | Endpoint | Description | Protocol |
|--------|----------|-------------|----------|
| GET | `/api/stream` | Real-time sales stream | SSE (Server-Sent Events) |

### 4.3 Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

### 4.4 Response Schemas

#### Sale Response
```json
{
  "id": 1,
  "date": "2026-01-17",
  "store_id": 1,
  "item_id": 1,
  "sales": 25,
  "is_streaming": false,
  "created_at": "2026-01-17T10:30:00Z"
}
```

#### Dashboard Metrics
```json
{
  "total_sales_today": 150,
  "total_sales_week": 1050,
  "total_sales_month": 4500,
  "average_daily_sales": 21.5,
  "sales_trend": "up",
  "streaming_records_count": 45
}
```

#### Prediction Response
```json
{
  "prediction_date": "2026-01-25",
  "predicted_sales": 23.5,
  "confidence_lower": 18.2,
  "confidence_upper": 28.8
}
```

---

## 5. Backend Implementation

### 5.1 Project Structure

```
backend/
├── Dockerfile
├── requirements.txt
├── alembic/
│   ├── alembic.ini
│   └── versions/
└── app/
    ├── __init__.py
    ├── config.py          # Configuration management
    ├── main.py            # FastAPI application entry
    ├── models/
    │   ├── __init__.py
    │   └── sales.py       # SQLAlchemy models
    ├── routes/
    │   ├── __init__.py
    │   ├── sales.py       # Sales API routes
    │   └── streaming.py   # SSE streaming route
    ├── services/
    │   ├── __init__.py
    │   ├── database.py    # Database connection
    │   ├── redis_client.py # Redis pub/sub
    │   ├── data_generator.py # Streaming data generator
    │   └── predictor.py   # Sales prediction service
    └── utils/
        └── __init__.py
```

### 5.2 Key Components

#### Configuration (config.py)
- Pydantic Settings for environment variable management
- Database URL, Redis URL configuration
- Streaming interval settings (default: 60 seconds)
- Forecast days configuration (default: 30 days)

#### Data Generator (data_generator.py)
- Loads historical statistics (mean, std, min, max) per store-item combination
- Generates realistic sales data mimicking historical patterns
- Applies day-of-week seasonality
- Publishes to Redis for real-time streaming
- Runs as background task every 60 seconds

#### Predictor (predictor.py)
- Time-series forecasting using moving averages
- Trend analysis for future predictions
- 95% confidence intervals
- Redis caching for performance

### 5.3 Dependencies

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
redis==5.0.1
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
alembic==1.13.1
pandas==2.1.4
numpy==1.26.3
apscheduler==3.10.4
httpx==0.26.0
sse-starlette==2.0.0
```

---

## 6. Frontend Implementation

### 6.1 Project Structure

```
frontend/
├── Dockerfile
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── src/
    ├── app/
    │   ├── globals.css    # Global styles
    │   ├── layout.tsx     # Root layout
    │   └── page.tsx       # Main page
    ├── components/
    │   ├── Dashboard.tsx      # Main dashboard container
    │   ├── MetricsCard.tsx    # Metrics display cards
    │   ├── SalesChart.tsx     # Historical sales chart
    │   ├── SalesTable.tsx     # Sales data table
    │   ├── LiveIndicator.tsx  # Connection status
    │   └── PredictionCard.tsx # Predictions chart
    ├── hooks/
    │   ├── useSSE.ts          # SSE connection hook
    │   ├── useSalesData.ts    # Data fetching hook
    │   └── useStreamingData.ts
    ├── lib/
    │   └── api.ts             # API client functions
    └── types/
        └── index.ts           # TypeScript interfaces
```

### 6.2 Components

| Component | Purpose |
|-----------|---------|
| Dashboard | Main container, orchestrates all components |
| MetricsCard | Displays KPIs (today's sales, weekly, monthly) |
| SalesChart | Interactive area chart for historical trends |
| SalesTable | Tabular view of recent sales |
| LiveIndicator | Shows SSE connection status |
| PredictionCard | Displays sales forecasts with confidence bands |

### 6.3 Hooks

| Hook | Purpose |
|------|---------|
| useSSE | Manages SSE connection, reconnection, and message parsing |
| useSalesData | Fetches historical data, metrics, and predictions |

### 6.4 Dependencies

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "recharts": "2.10.4",
    "lucide-react": "0.312.0",
    "date-fns": "3.2.0"
  }
}
```

---

## 7. Docker Configuration

### 7.1 Services

| Service | Image | Port | Dependencies |
|---------|-------|------|--------------|
| postgres | postgres:15-alpine | 5432 | - |
| redis | redis:7-alpine | 6379 | - |
| backend | Custom (Python) | 8000 | postgres, redis |
| frontend | Custom (Node) | 3000 | backend |

### 7.2 Volumes

| Volume | Purpose |
|--------|---------|
| postgres_data | Persistent database storage |
| redis_data | Redis persistence |

### 7.3 Networks

- `sales_network`: Bridge network connecting all services

### 7.4 Health Checks

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **Backend**: `/health` endpoint

---

## 8. Data Flow

### 8.1 Historical Data Loading

```
1. Docker Compose starts PostgreSQL container
2. init.sql script executes:
   a. Creates tables (stores, items, sales, predictions)
   b. Inserts Lulu Hypermarket store data
   c. Inserts grocery item data
   d. Loads train.csv into sales table
3. Data is marked as is_streaming=FALSE
```

### 8.2 Real-time Streaming Flow

```
1. Backend starts DataGenerator background task
2. Every 60 seconds:
   a. Generator creates new sale based on historical patterns
   b. Sale is inserted into PostgreSQL (is_streaming=TRUE)
   c. Sale is published to Redis channel
3. Frontend SSE connection:
   a. Subscribes to /api/stream endpoint
   b. Receives real-time sale events
   c. Updates UI with new data
```

### 8.3 Prediction Flow

```
1. User requests predictions via /api/sales/predictions
2. Backend checks Redis cache
3. If not cached:
   a. Fetches historical data for store/item
   b. Calculates moving averages and trends
   c. Generates predictions with confidence intervals
   d. Caches results in Redis
4. Returns predictions to frontend
```

---

## 9. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_USER | salesuser | Database username |
| POSTGRES_PASSWORD | salespass | Database password |
| POSTGRES_DB | salesdb | Database name |
| DATABASE_URL | (composed) | Full database connection string |
| REDIS_URL | redis://redis:6379 | Redis connection string |
| ENVIRONMENT | development | Environment mode |
| STREAMING_INTERVAL_SECONDS | 60 | Data generation interval |
| FORECAST_DAYS | 30 | Prediction horizon |
| NEXT_PUBLIC_API_URL | http://localhost:8000 | Backend API URL |
| NEXT_PUBLIC_SSE_URL | http://localhost:8000/api/stream | SSE endpoint |

---

## 10. Development Phases

### Phase 1: Infrastructure Setup ✅
- [x] Create project directory structure
- [x] Set up Docker Compose configuration
- [x] Configure PostgreSQL and Redis services
- [x] Create environment files

### Phase 2: Database Setup ✅
- [x] Design database schema
- [x] Create init.sql with Lulu store data
- [x] Create grocery items data
- [x] Configure CSV data loading

### Phase 3: Backend Development ✅
- [x] Create FastAPI application structure
- [x] Implement database models (SQLAlchemy)
- [x] Create API routes for sales data
- [x] Implement SSE streaming endpoint
- [x] Build data generator service
- [x] Implement prediction service

### Phase 4: Frontend Development ✅
- [x] Create Next.js application structure
- [x] Configure Tailwind CSS
- [x] Build Dashboard component
- [x] Create MetricsCard component
- [x] Build SalesChart with Recharts
- [x] Create SalesTable component
- [x] Implement LiveIndicator
- [x] Build PredictionCard
- [x] Create SSE hook for real-time updates

### Phase 5: Integration & Testing ✅
- [x] Build Docker images
- [x] Start all services
- [x] Verify database initialization
- [x] Test API endpoints
- [x] Verify SSE streaming
- [x] Test frontend functionality
- [x] Fix any bugs

### Phase 6: Deployment ✅
- [x] Production configuration (docker-compose.production.yml)
- [x] Security hardening (nginx with SSL, rate limiting, security headers)
- [x] Performance optimization (gzip compression, caching headers)
- [x] Monitoring setup (Prometheus metrics, health endpoints, monitoring dashboard)

---

## 11. Testing Checklist

### 11.1 API Testing

| Endpoint | Test | Expected Result |
|----------|------|-----------------|
| GET /health | Health check | `{"status": "healthy"}` |
| GET /api/sales | Fetch sales | Array of sale objects |
| GET /api/sales/aggregated | Daily aggregation | Array of daily totals |
| GET /api/sales/metrics | Dashboard metrics | Metrics object |
| GET /api/sales/predictions | Predictions | Array of predictions |
| GET /api/stream | SSE connection | Event stream |

### 11.2 Frontend Testing

| Component | Test | Expected Behavior |
|-----------|------|-------------------|
| Dashboard | Initial load | Shows loading, then data |
| MetricsCard | Display | Shows formatted numbers |
| SalesChart | Render | Displays area chart |
| SalesTable | Render | Shows sales rows |
| LiveIndicator | Connected | Green pulsing indicator |
| LiveIndicator | Disconnected | Red indicator |
| PredictionCard | Render | Shows prediction chart |

---

## 12. Security Considerations

### 12.1 Current Implementation

- CORS configured for localhost:3000
- Database credentials in environment variables
- No sensitive data in frontend code

### 12.2 Production Recommendations

- [ ] Add JWT authentication
- [ ] Enable HTTPS
- [ ] Use secrets management
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Add SQL injection protection (via ORM)
- [ ] Configure proper CORS for production domains

---

## 13. Performance Optimizations

### 13.1 Implemented

- Database connection pooling
- Redis caching for predictions
- Indexed database queries
- Efficient SSE streaming

### 13.2 Future Improvements

- [ ] Add database read replicas
- [ ] Implement query result caching
- [ ] Add CDN for static assets
- [ ] Optimize bundle size
- [ ] Add service workers

---

## 14. Monitoring & Logging

### 14.1 Current

- Console logging for data generation
- Error logging for failed operations

### 14.2 Recommended

- [ ] Add structured logging (JSON)
- [ ] Integrate Prometheus metrics
- [ ] Set up Grafana dashboards
- [ ] Configure alerting rules

---

## 15. Quick Start Commands

```bash
# Navigate to project
cd sales-dashboard

# Start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild specific service
docker-compose up --build backend
```

---

## 16. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check PostgreSQL health, verify credentials |
| Redis connection refused | Ensure Redis container is running |
| Frontend can't reach backend | Check CORS settings, verify API URL |
| SSE not connecting | Check network, verify SSE URL |
| CSV not loading | Verify file format, check column names |

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | AI Solutions Architect | Initial implementation plan |

---

*This document serves as the complete blueprint for the Lulu Hypermarket UAE Sales Dashboard. All development should follow this specification.*
