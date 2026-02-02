# 🛒 Lulu Intelligence Dashboard
## Real-Time Sales Analytics Platform for Lulu Hypermarket UAE

---

# 📋 Presentation Outline

1. **Introduction & Problem Statement**
2. **Solution Overview**
3. **Technology Stack**
4. **System Architecture**
5. **Dataset Description**
6. **Key Features**
7. **How It Works - Step by Step**
8. **Live Demo Walkthrough**
9. **Technical Highlights**
10. **Future Enhancements**
11. **Conclusion**

---

# 1️⃣ Introduction & Problem Statement

## 🏬 About Lulu Hypermarket

Lulu Hypermarket is one of the **largest retail chains** in the Middle East, with stores across:
- **Dubai** (3 stores)
- **Abu Dhabi** (3 stores)
- **Sharjah** (2 stores)
- **Ajman** (1 store)
- **Ras Al Khaimah** (1 store)

**Total: 10 stores across the UAE**

## ❓ The Problem

Managing a large retail operation comes with challenges:

| Challenge | Description |
|-----------|-------------|
| 📊 **Data Overload** | Millions of sales transactions every year |
| ⏱️ **Real-Time Insights** | Need to know what's selling RIGHT NOW |
| 🔮 **Forecasting** | Predict future demand to manage inventory |
| 📈 **Trend Analysis** | Identify patterns across stores and products |
| 🎯 **Decision Making** | Quick, data-driven business decisions |

## 💡 Our Solution

**Lulu Intelligence Dashboard** - A real-time sales analytics platform that:
- ✅ Visualizes historical sales data
- ✅ Streams live sales data every minute
- ✅ Predicts future sales with AI
- ✅ Provides instant insights through beautiful charts

---

# 2️⃣ Solution Overview

## 🎯 What Does Our Dashboard Do?

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LULU INTELLIGENCE DASHBOARD                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   📊 Historical Data    ➜    🔄 Real-Time    ➜    🔮 Predictions   │
│   Visualization              Streaming             AI Forecasting   │
│                                                                     │
│   See past sales        Watch sales as       Know what will        │
│   patterns              they happen          sell tomorrow         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 🌟 Key Capabilities

| Capability | Description |
|------------|-------------|
| 📈 **Interactive Charts** | Beautiful, responsive charts showing sales trends |
| 🔴 **Live Indicator** | See connection status (green = connected, red = disconnected) |
| 📦 **Product Tracking** | Track 50 different grocery products |
| 🏪 **Multi-Store View** | Compare sales across all 10 UAE stores |
| ⏰ **Every 60 Seconds** | New sales data generated and displayed automatically |
| 🔮 **30-Day Forecast** | AI predicts next 30 days of sales |

---

# 3️⃣ Technology Stack

## 🛠️ Technologies Used (Easy to Understand)

### Frontend (What You See)

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **Next.js 14** | Website framework | Fast, modern, easy to build |
| **React** | UI components | Reusable interface pieces |
| **TypeScript** | Programming language | Catches errors early |
| **Tailwind CSS** | Styling | Beautiful, responsive design |
| **Recharts** | Charts library | Beautiful graphs and charts |
| **Framer Motion** | Animations | Smooth, professional animations |

### Backend (Brain of the System)

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **FastAPI** | Python web server | Super fast, async operations |
| **Python 3.11** | Programming language | Data processing power |
| **SQLAlchemy** | Database toolkit | Easy database operations |
| **Pydantic** | Data validation | Ensures data is correct |

### Database & Cache

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **PostgreSQL 15** | Main database | Stores all sales data (913K records!) |
| **Redis 7** | Cache & messaging | Real-time data streaming |

### DevOps (How We Run It)

| Technology | What It Does | Why We Use It |
|------------|--------------|---------------|
| **Docker** | Containers | Run anywhere, same way |
| **Docker Compose** | Multi-container | Start all services together |

## 📊 Technology Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR BROWSER                                 │
│                    (http://localhost:3000)                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│                     Next.js + React                                 │
│              Beautiful Charts & Dashboard UI                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    HTTP Requests & SSE Stream
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND                                     │
│                    FastAPI + Python                                 │
│         APIs, Data Processing, Predictions                         │
└────────────┬─────────────────────────────────────┬──────────────────┘
             │                                     │
             ▼                                     ▼
┌────────────────────────┐            ┌────────────────────────┐
│      PostgreSQL        │            │        Redis           │
│    Main Database       │            │   Real-time Cache      │
│    913,000 Records     │            │   Pub/Sub Messaging    │
└────────────────────────┘            └────────────────────────┘
```

---

# 4️⃣ System Architecture

## 🏗️ How Everything Connects

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DOCKER NETWORK                                     │
│                    (All services talk to each other)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  PostgreSQL │◄───│   Redis     │◄───│  FastAPI    │◄───│   Next.js   │  │
│  │  Database   │    │   Cache     │    │  Backend    │    │  Frontend   │  │
│  │             │    │             │    │             │    │             │  │
│  │  Port 5432  │    │  Port 6379  │    │  Port 8000  │    │  Port 3000  │  │
│  │             │    │             │    │             │    │             │  │
│  │  Stores     │    │  Caches     │    │  Processes  │    │  Displays   │  │
│  │  913K sales │    │  fast data  │    │  requests   │    │  charts     │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📡 Real-Time Streaming Architecture

```
Step 1: Data Generator (Every 60 seconds)
        ↓
Step 2: New Sale Created (based on historical patterns)
        ↓
Step 3: Saved to PostgreSQL
        ↓
Step 4: Published to Redis
        ↓
Step 5: Sent via SSE (Server-Sent Events)
        ↓
Step 6: Frontend receives & displays
```

### What is SSE (Server-Sent Events)?

SSE is a technology that allows the **server to push data to the browser** automatically.

```
Traditional Request:
Browser ────────→ "Give me data" ────────→ Server
Browser ←──────── "Here's data" ←──────── Server
Browser ────────→ "Give me more" ────────→ Server
Browser ←──────── "Here's more" ←──────── Server

SSE (What we use):
Browser ────────→ "Connect me" ────────→ Server
Browser ←──────── "Here's data" ←──────── Server
Browser ←──────── "More data..." ←──────── Server
Browser ←──────── "Even more..." ←──────── Server
(Connection stays open, server sends data whenever ready)
```

---

# 5️⃣ Dataset Description

## 📁 About Our Dataset

| Property | Value |
|----------|-------|
| **File Name** | train.csv |
| **Total Records** | 913,000 sales transactions |
| **Date Range** | January 2013 to December 2017 (5 years) |
| **Stores** | 10 Lulu Hypermarket locations |
| **Products** | 50 grocery items |

## 📊 Dataset Structure

```csv
date,store,item,sales
2013-01-01,1,1,13
2013-01-02,1,1,11
2013-01-03,1,1,14
```

| Column | Description | Example |
|--------|-------------|---------|
| **date** | When the sale happened | 2013-01-01 |
| **store** | Store ID (1-10) | 1 |
| **item** | Product ID (1-50) | 1 |
| **sales** | Number of units sold | 13 |

## 🏪 Store Mapping

| Store ID | Store Name | City |
|----------|------------|------|
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

## 🛒 Product Categories (50 Items)

| Category | Sample Products |
|----------|-----------------|
| **Rice & Grains** | Basmati Rice (5kg) |
| **Bakery** | Arabic Bread (Pack of 6) |
| **Poultry** | Fresh Chicken (1kg) |
| **Dairy** | Almarai Milk, Lurpak Butter, Philadelphia Cheese |
| **Beverages** | Al Ain Water, Nescafe, Pepsi, Coca-Cola, Red Bull |
| **Vegetables** | Tomatoes, Cucumbers, Onions, Potatoes |
| **Fruits** | Bananas, Mangoes, Dates |
| **Frozen Foods** | Chicken Nuggets, French Fries, Beef Burgers |
| **Household** | Tide Detergent, Fairy Dish Soap |
| **Personal Care** | Dettol, Colgate, Head & Shoulders |
| **Baby Care** | Pampers Diapers, Huggies Wipes |
| **Middle Eastern** | Hummus, Labneh, Tahini, Baklava |
| **Spices** | Saffron, Cardamom |

---

# 6️⃣ Key Features

## 🌟 Feature 1: Real-Time Sales Streaming

```
Every 60 seconds, you see:
┌─────────────────────────────────────────────────────────────────┐
│  🔔 New Sale Alert!                                             │
│                                                                 │
│  📦 Product: Fresh Chicken (1kg)                                │
│  🏪 Store: Lulu Hypermarket Al Barsha, Dubai                    │
│  📊 Units Sold: 28                                               │
│  ⏰ Time: Just now                                               │
└─────────────────────────────────────────────────────────────────┘
```

**How it works:**
1. Backend generates realistic sales data
2. Matches historical patterns (same mean, standard deviation)
3. Considers day-of-week seasonality
4. Pushes to your browser via SSE

## 🌟 Feature 2: Interactive Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DASHBOARD LAYOUT                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  TODAY'S SALES   │  │   WEEKLY SALES   │  │  MONTHLY SALES   │         │
│  │     💰 1,250     │  │    💰 8,750      │  │    💰 37,500     │         │
│  │    ↑ +12%        │  │    ↑ +8%         │  │    ↑ +15%        │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      SALES TREND CHART                               │   │
│  │  📈                                        ___                       │   │
│  │      ____     ___                    _____/   \___                  │   │
│  │     /    \___/   \___     ___   ___/               \                │   │
│  │    /                  \__/   \_/                                    │   │
│  │   Jan    Feb    Mar    Apr    May    Jun    Jul    Aug              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PREDICTION CHART (30 Days)                        │   │
│  │                                                                      │   │
│  │   Historical        |        Predicted Future                       │   │
│  │   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓|░░░░░░░░░░░░░░░░░░░░░░░░                       │   │
│  │                     |   (with confidence bands)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🌟 Feature 3: Live Connection Indicator

```
When Connected:
┌────────────────────────┐
│  🟢 Live  (pulsing)    │  ← Green pulsing dot
│  Connected to stream   │
└────────────────────────┘

When Disconnected:
┌────────────────────────┐
│  🔴 Disconnected       │  ← Red static dot
│  Reconnecting...       │
└────────────────────────┘
```

## 🌟 Feature 4: Sales Predictions

Our system uses **time-series analysis** to predict future sales:

```
How Predictions Work:

Step 1: Analyze historical data (913,000 records)
        ↓
Step 2: Calculate moving averages
        ↓
Step 3: Identify trends (up/down/stable)
        ↓
Step 4: Apply seasonality patterns
        ↓
Step 5: Generate 30-day forecast
        ↓
Step 6: Calculate confidence intervals (95%)
```

**Output:**
| Date | Predicted Sales | Lower Bound | Upper Bound |
|------|-----------------|-------------|-------------|
| Tomorrow | 25 units | 18 units | 32 units |
| Next Week | 175 units | 150 units | 200 units |
| Next Month | 750 units | 680 units | 820 units |

## 🌟 Feature 5: Multi-Store & Multi-Product Filtering

Filter by:
- 📍 **Store Location** - See sales for any specific store
- 📦 **Product** - Track any of the 50 products
- 📅 **Date Range** - View historical periods
- 🔄 **Streaming Only** - See only live data

---

# 7️⃣ How It Works - Step by Step

## 🚀 Step 1: Starting the Application

```bash
# Navigate to project folder
cd sales-dashboard

# Start all services with Docker
docker-compose up --build
```

**What happens behind the scenes:**

```
1. Docker reads docker-compose.yml
2. Creates 4 containers:
   ├── sales_db (PostgreSQL)
   ├── sales_redis (Redis)
   ├── sales_backend (FastAPI)
   └── sales_frontend (Next.js)
3. Sets up network between containers
4. Mounts volumes for data persistence
```

## 🗄️ Step 2: Database Initialization

```
1. PostgreSQL starts
2. init.sql runs automatically:
   ├── Creates 'stores' table (10 Lulu stores)
   ├── Creates 'items' table (50 products)
   ├── Creates 'sales' table
   ├── Creates 'predictions' table
   └── Loads 913,000 records from train.csv
3. Database ready!
```

## 🔄 Step 3: Backend Starts

```
1. FastAPI application starts
2. Connects to PostgreSQL (with retry logic)
3. Connects to Redis (with retry logic)
4. Starts background data generator
5. Opens API endpoints:
   ├── GET /health          → Health check
   ├── GET /api/sales       → Get sales data
   ├── GET /api/stream      → SSE stream
   └── GET /api/predictions → Get forecasts
```

## 🌐 Step 4: Frontend Starts

```
1. Next.js application builds
2. Opens http://localhost:3000
3. Connects to backend API
4. Establishes SSE connection
5. Renders dashboard
```

## 📊 Step 5: Data Flow (Real-Time)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REAL-TIME DATA FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   Backend   │                                                            │
│  │  Generator  │ ── Every 60 seconds creates new sale ──┐                  │
│  └─────────────┘                                         │                  │
│                                                          ▼                  │
│                                              ┌─────────────────────┐        │
│                                              │    New Sale Data    │        │
│                                              │  Store: Dubai       │        │
│                                              │  Product: Chicken   │        │
│                                              │  Sales: 28 units    │        │
│                                              └─────────────────────┘        │
│                                                          │                  │
│                            ┌─────────────────────────────┼─────────────┐    │
│                            ▼                             ▼             │    │
│                  ┌─────────────────┐         ┌─────────────────┐      │    │
│                  │   PostgreSQL    │         │     Redis       │      │    │
│                  │  (Permanent     │         │   (Publish to   │      │    │
│                  │   Storage)      │         │    channel)     │      │    │
│                  └─────────────────┘         └─────────────────┘      │    │
│                                                          │             │    │
│                                                          ▼             │    │
│                                              ┌─────────────────────┐  │    │
│                                              │    SSE Stream       │  │    │
│                                              │   /api/stream       │  │    │
│                                              └─────────────────────┘  │    │
│                                                          │             │    │
│                                                          ▼             │    │
│                                              ┌─────────────────────┐  │    │
│                                              │   Your Browser      │  │    │
│                                              │   (Dashboard)       │  │    │
│                                              │   📊 Shows new      │  │    │
│                                              │      sale!          │  │    │
│                                              └─────────────────────┘  │    │
│                                                                        │    │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# 8️⃣ Live Demo Walkthrough

## 🖥️ Opening the Dashboard

**URL:** http://localhost:3000

### What You'll See:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🛒 Lulu Intelligence Dashboard                          🟢 Live Connected  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ 📊 Today    │ │ 📈 Week     │ │ 📉 Month    │ │ 🔄 Trend    │          │
│  │    1,250    │ │    8,750    │ │   37,500    │ │    ↑ +12%   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     📈 Sales Trend Over Time                          │  │
│  │  ▲                                                                    │  │
│  │  │     ╭──╮                                      ╭──╮                │  │
│  │  │    ╱    ╲    ╭──╮                  ╭──╮     ╱    ╲              │  │
│  │  │   ╱      ╲  ╱    ╲    ╭──╮        ╱    ╲   ╱      ╲             │  │
│  │  │  ╱        ╲╱      ╲  ╱    ╲      ╱      ╲ ╱                     │  │
│  │  │ ╱                  ╲╱      ╲    ╱        ╲                       │  │
│  │  ├──────────────────────────────────────────────────────────────────│  │
│  │  │ Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                  🔮 30-Day Sales Prediction                           │  │
│  │                                                                       │  │
│  │   [Historical Data]    │    [Predicted Future]                       │  │
│  │   ████████████████████ │ ░░░░░░░░░░░░░░░░░░░░░                       │  │
│  │                        │     (with 95% confidence band)               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  🔔 Latest Sales:                                                          │
│  ├── Basmati Rice at Al Barsha: 15 units (2 min ago)                       │
│  ├── Fresh Chicken at Deira: 28 units (1 min ago)                          │
│  └── Coca-Cola at Sharjah: 42 units (just now)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📡 API Endpoints Demo

### Health Check
```
GET http://localhost:8000/health

Response:
{
    "status": "healthy",
    "database": "healthy",
    "redis": "healthy",
    "timestamp": "2026-02-02T10:30:00Z",
    "version": "1.0.0"
}
```

### Get Sales Data
```
GET http://localhost:8000/api/sales?store_id=1&limit=10

Response: Array of sales records for Store 1
```

### Get Predictions
```
GET http://localhost:8000/api/sales/predictions?store_id=1&item_id=1&days=30

Response: 30-day forecast with confidence intervals
```

---

# 9️⃣ Technical Highlights

## 🔧 Retry Logic for Database Connection

**Problem:** When Docker containers start, the database might not be ready immediately.

**Solution:** We implemented retry logic:

```python
async def init_db(max_retries: int = 10, retry_delay: float = 2.0):
    """Initialize database with retry logic"""
    for attempt in range(max_retries):
        try:
            # Try to connect
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            print("✅ Database connected!")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"⏳ Waiting for database... (attempt {attempt + 1})")
                await asyncio.sleep(retry_delay)
            else:
                raise e
```

## 🎨 Responsive UI with Tailwind CSS

```jsx
// Example: Metrics Card
<div className="
    bg-white dark:bg-gray-800       // Light/dark mode
    rounded-xl shadow-lg            // Rounded corners, shadow
    p-6                             // Padding
    hover:shadow-xl                 // Shadow on hover
    transition-all duration-300     // Smooth animation
">
    <h3 className="text-xl font-bold text-gray-800">
        Today's Sales
    </h3>
    <p className="text-3xl font-extrabold text-blue-600">
        1,250
    </p>
</div>
```

## 📊 Interactive Charts with Recharts

```jsx
<AreaChart data={salesData}>
    <Area
        type="monotone"
        dataKey="sales"
        stroke="#3B82F6"       // Blue line
        fill="#93C5FD"         // Light blue fill
        strokeWidth={2}
    />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
</AreaChart>
```

## 🔄 State Management with Zustand

```typescript
// Simple, lightweight state management
const useDashboardStore = create((set) => ({
    sales: [],
    theme: 'dark',
    
    setSales: (sales: Sale[]) => set({ sales }),
    toggleTheme: () => set((state) => ({
        theme: state.theme === 'dark' ? 'light' : 'dark'
    }))
}))
```

---

# 🔟 Future Enhancements

## 🚀 What We Can Add Next

| Enhancement | Description | Benefit |
|-------------|-------------|---------|
| **AI Chatbot** | Ask questions in natural language | "What sold best last week?" |
| **Voice Commands** | Control dashboard with voice | Hands-free operation |
| **Mobile App** | React Native version | Check sales on-the-go |
| **Email Alerts** | Automatic notifications | Know when sales spike/drop |
| **PDF Reports** | Export dashboard as report | Share with management |
| **Multi-Language** | Arabic, English, Hindi | Serve diverse workforce |

## 📈 Scalability Roadmap

```
Current:                    Future:
┌─────────────┐            ┌─────────────────────────────────────┐
│ 10 Stores   │    ──→     │ 100+ Stores (Regional expansion)    │
│ 50 Products │    ──→     │ 500+ Products (Full inventory)      │
│ 913K Records│    ──→     │ 10M+ Records (5+ years history)     │
│ 1 Region    │    ──→     │ Multiple Countries (GCC expansion)  │
└─────────────┘            └─────────────────────────────────────┘
```

---

# 1️⃣1️⃣ Conclusion

## ✅ What We Built

| Aspect | Achievement |
|--------|-------------|
| **Real-Time Analytics** | Live sales every 60 seconds |
| **Historical Analysis** | 913,000 records visualized |
| **Predictive AI** | 30-day forecasts with confidence |
| **Modern Tech Stack** | Next.js, FastAPI, PostgreSQL, Redis |
| **Containerized** | One command to start everything |
| **Production Ready** | Retry logic, error handling, caching |

## 🎯 Business Value

```
For Lulu Hypermarket:

📊 Data-Driven Decisions     → Know what sells, where, and when
📈 Trend Identification      → Spot opportunities early
🔮 Demand Forecasting        → Better inventory management
⚡ Real-Time Monitoring      → React to changes immediately
💰 Cost Reduction            → Reduce overstock and stockouts
```

## 🙏 Thank You!

### Questions?

---

## 📚 Quick Reference

### How to Run the Dashboard

```bash
# Step 1: Navigate to project
cd sales-dashboard

# Step 2: Start all services
docker-compose up --build

# Step 3: Open in browser
open http://localhost:3000
```

### Checking System Health

```bash
# Check all containers are running
docker ps

# Check API health
curl http://localhost:8000/health

# View backend logs
docker logs sales_backend
```

### Stopping the Dashboard

```bash
# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## 📂 Project Structure Summary

```
sales-dashboard/
├── 📁 backend/           # Python FastAPI server
│   ├── app/
│   │   ├── main.py       # Application entry point
│   │   ├── models/       # Database models
│   │   ├── routes/       # API endpoints
│   │   └── services/     # Business logic
│   └── Dockerfile
│
├── 📁 frontend/          # Next.js React application
│   ├── src/
│   │   ├── app/          # Pages
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   └── store/        # State management
│   └── Dockerfile
│
├── 📁 data/              # Dataset
│   └── train.csv         # 913,000 sales records
│
├── 📁 database/          # Database initialization
│   ├── init.sql          # Schema & seed data
│   └── seed_data.sql
│
├── 📁 docs/              # Documentation
│   ├── API.md
│   └── ARCHITECTURE.md
│
└── docker-compose.yml    # Container orchestration
```

---

## 🏆 Key Takeaways for Professor

1. **Full-Stack Application** - Frontend, Backend, Database, Cache
2. **Modern Architecture** - Microservices with Docker
3. **Real-Time Streaming** - Server-Sent Events (SSE)
4. **Big Data** - 913,000 records processed efficiently
5. **Machine Learning Ready** - Prediction algorithms built-in
6. **Production Quality** - Error handling, retry logic, health checks
7. **Clean Code** - TypeScript, Pydantic validation, proper structure

---

*Presentation by: [Your Team Name]*
*Date: February 2026*
*Course: [Your Course Name]*
