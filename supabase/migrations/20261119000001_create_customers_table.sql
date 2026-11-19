-- Tallio's Café Operations Platform
-- Customer Users Table Migration

CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar TEXT,
  membership TEXT DEFAULT 'Regular', -- 'Regular' | 'Mug Club Member' | 'VIP Gold'
  status TEXT DEFAULT 'Active',      -- 'Active' | 'Inactive'
  total_orders INTEGER DEFAULT 0,
  total_spend NUMERIC(10, 2) DEFAULT 0.00,
  loyalty_points INTEGER DEFAULT 0,
  favorite_drink TEXT,
  preferred_location TEXT DEFAULT 'Bayview Café',
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Allow Super Admin (authenticated) full access
CREATE POLICY "Allow authenticated admin full access on customers"
ON public.customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
