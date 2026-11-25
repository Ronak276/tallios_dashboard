-- ==============================================================
-- TALLIO'S CAFÉ - ORDERS TABLE MIGRATION & SEEDING
-- Renaming/creating table as 'public.orders' with modern schema
-- ==============================================================

-- 1. Create or Replace orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'Mobile App' | 'Website' | 'Self-Service Kiosk' | 'Counter'
  location_id TEXT REFERENCES public.locations(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  order_status TEXT NOT NULL DEFAULT 'Incoming', -- 'Incoming' | 'Brewing / Prep' | 'Ready for Pickup' | 'Completed' | 'Cancelled'
  stripe_status TEXT NOT NULL DEFAULT 'Paid',    -- 'Paid' | 'Unpaid' | 'Refunded'
  payment_method TEXT DEFAULT 'Card',           -- 'Apple Pay' | 'Google Pay' | 'Card' | 'Cash'
  stripe_charge_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (Admin & Staff) full access
DROP POLICY IF EXISTS "Allow authenticated access to orders" ON public.orders;
CREATE POLICY "Allow authenticated access to orders" 
ON public.orders FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow public/anon read access (for Kiosk / Mobile App updates)
DROP POLICY IF EXISTS "Allow anon read access on orders" ON public.orders;
CREATE POLICY "Allow anon read access on orders" 
ON public.orders FOR SELECT 
TO anon, authenticated 
USING (true);

-- 2. Seed Initial Orders
INSERT INTO public.orders (
  id, order_number, customer_name, channel, location_id, items, total_amount, order_status, stripe_status, payment_method, stripe_charge_id, created_at
)
VALUES
  (
    'ord-101',
    '#TL-4081',
    'Marcus Vance',
    'Self-Service Kiosk',
    'loc-main',
    '[
      {"name": "Oat Milk Flat White (12oz)", "quantity": 1, "options": "Extra shot, Yirgacheffe beans", "price": 6.25},
      {"name": "Butter Croissant", "quantity": 1, "options": "Warmed", "price": 4.50}
    ]'::jsonb,
    10.75,
    'Brewing / Prep',
    'Paid',
    'Apple Pay',
    'ch_3N8x7fLkd921M',
    '2026-11-25T11:58:00Z'
  ),
  (
    'ord-102',
    '#TL-4082',
    'Elena Rostova (Table 4)',
    'QR Code Table',
    'loc-main',
    '[
      {"name": "Iced Salted Caramel Cold Brew", "quantity": 2, "options": "Less sweet, Splash oat milk", "price": 13.00}
    ]'::jsonb,
    13.00,
    'Incoming',
    'Paid',
    'Card',
    'ch_3N8x8aLkd922K',
    '2026-11-25T12:02:00Z'
  ),
  (
    'ord-103',
    '#TL-4083',
    'David Chen',
    'Mobile Food Truck Counter',
    'loc-truck-1',
    '[
      {"name": "Double Espresso Shot", "quantity": 1, "options": "Colombian Supremo", "price": 3.75}
    ]'::jsonb,
    3.75,
    'Ready for Pickup',
    'Paid',
    'Google Pay',
    'ch_3N8x91Lkd929P',
    '2026-11-25T11:54:00Z'
  ),
  (
    'ord-104',
    '#TL-4084',
    'Aria Montgomery',
    'Self-Service Kiosk',
    'loc-kiosk-tech',
    '[
      {"name": "Ceremonial Matcha Latte", "quantity": 1, "options": "Oat milk, Vanilla syrup", "price": 6.75},
      {"name": "Almond Biscotti", "quantity": 2, "price": 5.00}
    ]'::jsonb,
    11.75,
    'Incoming',
    'Paid',
    'Apple Pay',
    'ch_3N8y10Lkd933Z',
    '2026-11-25T11:56:00Z'
  )
ON CONFLICT (order_number) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  channel = EXCLUDED.channel,
  location_id = EXCLUDED.location_id,
  items = EXCLUDED.items,
  total_amount = EXCLUDED.total_amount,
  order_status = EXCLUDED.order_status,
  stripe_status = EXCLUDED.stripe_status,
  payment_method = EXCLUDED.payment_method,
  updated_at = NOW();
