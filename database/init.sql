-- =============================================================================
-- Sales Dashboard Database Schema
-- Matches README.md architecture: sales_historical, sales_stream_raw, sales_fact_view
-- =============================================================================

-- Create tables
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- HISTORICAL DATA TABLE (Immutable - Bulk loaded from CSV)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales_historical (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    sales INTEGER NOT NULL CHECK (sales >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STREAMING DATA TABLE (Append-only with UUID for deduplication)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales_stream_raw (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    sales INTEGER NOT NULL CHECK (sales >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Legacy sales table (for backward compatibility with existing code)
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    sales INTEGER NOT NULL CHECK (sales >= 0),
    is_streaming BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
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

-- =============================================================================
-- INDEXES for Performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_sales_historical_date ON sales_historical(date);
CREATE INDEX IF NOT EXISTS idx_sales_historical_store_item ON sales_historical(store_id, item_id);
CREATE INDEX IF NOT EXISTS idx_sales_stream_timestamp ON sales_stream_raw(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_stream_store_item ON sales_stream_raw(store_id, item_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_store_item ON sales(store_id, item_id);
CREATE INDEX IF NOT EXISTS idx_sales_streaming ON sales(is_streaming);

-- =============================================================================
-- Insert Lulu Hypermarket UAE stores
-- =============================================================================
INSERT INTO stores (id, name, location) VALUES 
    (1, 'Lulu Hypermarket Al Barsha', 'Dubai'),
    (2, 'Lulu Hypermarket Deira City Centre', 'Dubai'),
    (3, 'Lulu Hypermarket Karama', 'Dubai'),
    (4, 'Lulu Hypermarket Mushrif Mall', 'Abu Dhabi'),
    (5, 'Lulu Hypermarket Al Wahda', 'Abu Dhabi'),
    (6, 'Lulu Hypermarket Khalidiyah', 'Abu Dhabi'),
    (7, 'Lulu Hypermarket Sharjah City Centre', 'Sharjah'),
    (8, 'Lulu Hypermarket Al Nahda', 'Sharjah'),
    (9, 'Lulu Hypermarket Ajman', 'Ajman'),
    (10, 'Lulu Hypermarket Ras Al Khaimah', 'Ras Al Khaimah')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Insert grocery items with categories
-- =============================================================================
INSERT INTO items (id, name, category) VALUES
    (1, 'Basmati Rice (5kg)', 'Rice & Grains'),
    (2, 'Arabic Bread (Pack of 6)', 'Bakery'),
    (3, 'Fresh Chicken (1kg)', 'Poultry'),
    (4, 'Almarai Full Cream Milk (1L)', 'Dairy'),
    (5, 'Al Ain Bottled Water (1.5L x 6)', 'Beverages'),
    (6, 'Nescafe Classic (200g)', 'Beverages'),
    (7, 'Lipton Yellow Label Tea (200 bags)', 'Beverages'),
    (8, 'Extra Virgin Olive Oil (1L)', 'Cooking Oils'),
    (9, 'Fresh Tomatoes (1kg)', 'Vegetables'),
    (10, 'Fresh Bananas (1kg)', 'Fruits'),
    (11, 'Lurpak Butter (500g)', 'Dairy'),
    (12, 'Philadelphia Cream Cheese (500g)', 'Dairy'),
    (13, 'Al Rawabi Fresh Juice (1L)', 'Beverages'),
    (14, 'Maggi Noodles (Pack of 10)', 'Instant Food'),
    (15, 'Heinz Tomato Ketchup (500g)', 'Condiments'),
    (16, 'Goody Mayonnaise (500g)', 'Condiments'),
    (17, 'Nutella (750g)', 'Spreads'),
    (18, 'Kelloggs Corn Flakes (500g)', 'Breakfast'),
    (19, 'Fresh Eggs (30 pack)', 'Eggs'),
    (20, 'Sadia Frozen Chicken Nuggets (500g)', 'Frozen Foods'),
    (21, 'McCain French Fries (1kg)', 'Frozen Foods'),
    (22, 'Al Kabeer Beef Burger (8 pcs)', 'Frozen Foods'),
    (23, 'Puck Cheese Slices (24 pcs)', 'Dairy'),
    (24, 'Rainbow Evaporated Milk (410g)', 'Dairy'),
    (25, 'Nido Milk Powder (2.5kg)', 'Dairy'),
    (26, 'Tide Washing Powder (6kg)', 'Household'),
    (27, 'Fairy Dish Soap (1L)', 'Household'),
    (28, 'Dettol Antiseptic (1L)', 'Personal Care'),
    (29, 'Colgate Toothpaste (150g)', 'Personal Care'),
    (30, 'Head & Shoulders Shampoo (400ml)', 'Personal Care'),
    (31, 'Pampers Diapers (64 pcs)', 'Baby Care'),
    (32, 'Huggies Baby Wipes (64 pcs)', 'Baby Care'),
    (33, 'Red Bull Energy Drink (4 pack)', 'Beverages'),
    (34, 'Pepsi (2.25L)', 'Beverages'),
    (35, 'Coca-Cola (2.25L)', 'Beverages'),
    (36, 'Fresh Lamb (1kg)', 'Meat'),
    (37, 'Fresh Salmon Fillet (500g)', 'Seafood'),
    (38, 'Fresh Shrimp (500g)', 'Seafood'),
    (39, 'Saffron (1g)', 'Spices'),
    (40, 'Cardamom (100g)', 'Spices'),
    (41, 'Fresh Dates (1kg)', 'Fruits'),
    (42, 'Arabic Coffee (250g)', 'Beverages'),
    (43, 'Hummus (400g)', 'Deli'),
    (44, 'Labneh (500g)', 'Dairy'),
    (45, 'Tahini (400g)', 'Condiments'),
    (46, 'Baklava Box (500g)', 'Sweets'),
    (47, 'Fresh Mango (1kg)', 'Fruits'),
    (48, 'Cucumber (1kg)', 'Vegetables'),
    (49, 'Onions (2kg)', 'Vegetables'),
    (50, 'Potatoes (2kg)', 'Vegetables')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- Load Historical Data from CSV
-- =============================================================================
CREATE TEMP TABLE temp_sales (
    date DATE,
    store INTEGER,
    item INTEGER,
    sales INTEGER
);

-- Load data from CSV
COPY temp_sales(date, store, item, sales)
FROM '/data/train.csv'
DELIMITER ','
CSV HEADER;

-- Insert into sales_historical table (README architecture)
INSERT INTO sales_historical (date, store_id, item_id, sales)
SELECT date, store, item, sales
FROM temp_sales;

-- Also insert into legacy sales table (for backward compatibility)
INSERT INTO sales (date, store_id, item_id, sales, is_streaming)
SELECT date, store, item, sales, FALSE
FROM temp_sales;

-- Drop temp table
DROP TABLE temp_sales;

-- =============================================================================
-- UNIFIED VIEW: sales_fact_view (Historical UNION Streaming)
-- =============================================================================
CREATE OR REPLACE VIEW sales_fact_view AS
SELECT 
    id,
    date AS timestamp,
    store_id,
    item_id,
    sales,
    'historical' AS source,
    created_at
FROM sales_historical
UNION ALL
SELECT 
    id,
    timestamp::date AS timestamp,
    store_id,
    item_id,
    sales,
    'streaming' AS source,
    created_at
FROM sales_stream_raw;

-- =============================================================================
-- Log Completion
-- =============================================================================
DO $$
DECLARE
    historical_count INTEGER;
    store_count INTEGER;
    item_count INTEGER;
    min_date DATE;
    max_date DATE;
BEGIN
    SELECT COUNT(*) INTO historical_count FROM sales_historical;
    SELECT COUNT(*) INTO store_count FROM stores;
    SELECT COUNT(*) INTO item_count FROM items;
    SELECT MIN(date), MAX(date) INTO min_date, max_date FROM sales_historical;
    
    RAISE NOTICE '✅ Successfully loaded % historical records', historical_count;
    RAISE NOTICE '📊 Data range: % to %', min_date, max_date;
    RAISE NOTICE '📊 Unique stores: %', store_count;
    RAISE NOTICE '📊 Unique items: %', item_count;
END $$;
