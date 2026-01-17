# Sales Dashboard

A real-time sales streaming and analytics dashboard with predictive capabilities.

## Architecture

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache/Pub-Sub**: Redis
- **Container**: Docker Compose

## Features

- ✅ Historical sales data visualization
- ✅ Real-time streaming sales (SSE)
- ✅ Predictive analytics
- ✅ Live connection indicator
- ✅ Interactive charts (Recharts)
- ✅ Metrics dashboard

## Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Your `train.csv` file in the `data/` directory

### Setup

1. **Navigate to the project:**

```bash
cd sales-dashboard
```

2. **Ensure your training data is in place:**

The `data/train.csv` should already be copied. If not:
```bash
cp /path/to/your/train.csv data/
```

3. **Create environment file (optional - defaults are provided):**

```bash
cp .env.example .env
```

4. **Build and start all services:**

```bash
docker-compose up --build
```

5. **Access the dashboard:**

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js dashboard |
| Backend | 8000 | FastAPI server |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & Pub/Sub |

## API Endpoints

### Sales

- `GET /api/sales` - Get sales data with filters
- `GET /api/sales/aggregated` - Get aggregated sales by date
- `GET /api/sales/metrics` - Get dashboard metrics
- `GET /api/sales/predictions` - Get sales predictions

### Streaming

- `GET /api/stream` - SSE endpoint for real-time sales

### Health

- `GET /health` - Health check endpoint

## Data Format

The `train.csv` should have the following columns:

```csv
date,store,item,sales
2013-01-01,1,1,13
2013-01-02,1,1,11
...
```

## Streaming Data

The backend generates new sales data every 60 seconds that mimics the statistical patterns of your historical data. This includes:

- Mean and standard deviation matching
- Day-of-week seasonality
- Store and item variation

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| POSTGRES_USER | salesuser | Database user |
| POSTGRES_PASSWORD | salespass | Database password |
| POSTGRES_DB | salesdb | Database name |
| STREAMING_INTERVAL_SECONDS | 60 | Data generation interval |
| FORECAST_DAYS | 30 | Prediction horizon |

## Development

### Backend Development

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Stopping the Services

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## License

MIT
