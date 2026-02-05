-- Supabase Database Setup for Lunch Veto Tracker
-- Run this in Supabase SQL Editor

-- 1. Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    picker TEXT NOT NULL,
    phase TEXT DEFAULT 'suggestion' CHECK (phase IN ('suggestion', 'veto', 'winner')),
    suggestions TEXT[] DEFAULT '{}',
    vetos JSONB DEFAULT '{}',
    winner TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create history table
CREATE TABLE IF NOT EXISTS history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    round_id UUID REFERENCES rounds(id),
    date DATE NOT NULL,
    picker TEXT NOT NULL,
    winner TEXT NOT NULL,
    suggestions TEXT,
    vetos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert some sample restaurants
INSERT INTO restaurants (name) VALUES
    ('El Toro'),
    ('Chick-fil-A'),
    ('Panera Bread'),
    ('Texas Roadhouse'),
    ('Olive Garden'),
    ('Outback Steakhouse'),
    ('Applebee''s'),
    ('Buffalo Wild Wings')
ON CONFLICT DO NOTHING;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for public access (anyone with password can read/write)
CREATE POLICY "Allow public access to restaurants" ON restaurants
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to rounds" ON rounds
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public access to history" ON history
    FOR ALL USING (true) WITH CHECK (true);

-- Done! Your database is ready.
