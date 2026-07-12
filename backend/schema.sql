-- Create parsed_intents table in Supabase
CREATE TABLE parsed_intents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    raw_input TEXT NOT NULL,
    parsed_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE parsed_intents ENABLE ROW LEVEL SECURITY;

-- Create price_snapshots table
CREATE TABLE price_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product TEXT NOT NULL,
    country TEXT NOT NULL,
    seller TEXT,
    price NUMERIC,
    currency TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE price_snapshots ENABLE ROW LEVEL SECURITY;

-- Create country_rules table
CREATE TABLE country_rules (
    country_code TEXT PRIMARY KEY,
    customs_duty_pct NUMERIC NOT NULL DEFAULT 0,
    duty_free_allowance_value NUMERIC NOT NULL DEFAULT 0,
    vat_rate_pct NUMERIC NOT NULL DEFAULT 0,
    vat_refund_available BOOLEAN NOT NULL DEFAULT FALSE,
    vat_refund_deduction_pct NUMERIC NOT NULL DEFAULT 0
);

-- Seed country rules with real rates
INSERT INTO country_rules (country_code, customs_duty_pct, duty_free_allowance_value, vat_rate_pct, vat_refund_available, vat_refund_deduction_pct) VALUES
('IN', 20.0, 50000, 18.0, FALSE, 0.0),
('US', 0.0, 800, 0.0, FALSE, 0.0),
('AE', 5.0, 3000, 5.0, TRUE, 4.6),
('UK', 0.0, 390, 20.0, TRUE, 4.0),
('AU', 5.0, 900, 10.0, TRUE, 4.0),
('DE', 0.0, 430, 19.0, TRUE, 4.0),
('CA', 0.0, 200, 5.0, FALSE, 0.0)
ON CONFLICT (country_code) DO UPDATE SET
    customs_duty_pct = EXCLUDED.customs_duty_pct,
    duty_free_allowance_value = EXCLUDED.duty_free_allowance_value,
    vat_rate_pct = EXCLUDED.vat_rate_pct,
    vat_refund_available = EXCLUDED.vat_refund_available,
    vat_refund_deduction_pct = EXCLUDED.vat_refund_deduction_pct;

-- Enable Row Level Security (optional, recommended)
ALTER TABLE country_rules ENABLE ROW LEVEL SECURITY;

-- Create card_offers table
CREATE TABLE card_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name TEXT NOT NULL,
    card_type TEXT NOT NULL,
    merchant TEXT NOT NULL,
    offer_type TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    value_type TEXT NOT NULL DEFAULT 'percent',
    min_spend NUMERIC,
    valid_until TEXT,
    source_url TEXT,
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE card_offers ENABLE ROW LEVEL SECURITY;

-- Create sale_calendar table
CREATE TABLE sale_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    country_code TEXT NOT NULL,
    event_name TEXT NOT NULL,
    date_range TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'all',
    historical_discount_pct NUMERIC NOT NULL DEFAULT 0
);

-- Seed sale calendar
INSERT INTO sale_calendar (country_code, event_name, date_range, category, historical_discount_pct) VALUES
('IN', 'Republic Day Sale', 'Jan 20-26', 'all', 15),
('IN', 'Amazon Prime Day', 'Jul 15-16', 'electronics', 20),
('IN', 'Big Billion Days / Diwali Sale', 'Oct-Nov', 'all', 25),
('US', 'Amazon Prime Day', 'Jul 15-16', 'electronics', 25),
('US', 'Black Friday / Cyber Monday', 'Nov 28-Dec 1', 'all', 30),
('AE', 'Dubai Shopping Festival', 'Dec 15 - Jan 31', 'all', 25),
('AE', 'White Friday', 'Nov 28-30', 'all', 30),
('UK', 'Black Friday', 'Nov 28-30', 'all', 25),
('UK', 'Boxing Day Sale', 'Dec 26', 'all', 30),
('AU', 'EOFY Sale', 'Jun', 'all', 25),
('AU', 'Black Friday', 'Nov 28-30', 'all', 25),
('DE', 'Black Friday', 'Nov 28-30', 'all', 25),
('DE', 'Winter Sale', 'Jan', 'all', 20),
('CA', 'Black Friday', 'Nov 28-30', 'all', 25),
('CA', 'Boxing Day Sale', 'Dec 26', 'all', 25);

-- Enable Row Level Security (optional, recommended)
ALTER TABLE sale_calendar ENABLE ROW LEVEL SECURITY;
