-- ==============================================================
-- TALLIO'S CAFÉ OPERATIONS PLATFORM - FULL DATABASE SCHEMA
-- Run this complete script in Supabase Dashboard -> SQL Editor
-- ==============================================================

-- 1. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'Roastery Cafe' | 'Mobile Food Truck' | 'Self-Service Kiosk'
  address TEXT NOT NULL,
  active_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Locations
INSERT INTO public.locations (id, name, type, address, active_orders)
VALUES 
  ('loc-main', 'Bayview Café (Roastery HQ)', 'Roastery Cafe', '4732 3rd St, San Francisco, CA', 8),
  ('loc-truck-1', 'Mobile Food Truck #1', 'Mobile Food Truck', 'Financial District - Montgomery St', 5),
  ('loc-truck-2', 'Mobile Food Truck #2', 'Mobile Food Truck', 'Mission Bay Biotech Commons', 3),
  ('loc-kiosk-tech', 'Tech Park Express Kiosk', 'Self-Service Kiosk', 'SOMA Tech Incubator Lobby', 12)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  address = EXCLUDED.address;


-- 2. STAFF PROFILES TABLE (Location-Wise Roles)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Staff', -- 'Super Admin' | 'Staff'
  assigned_location_id TEXT REFERENCES public.locations(id) ON DELETE SET NULL,
  phone TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Staff Profiles
INSERT INTO public.staff_profiles (id, email, full_name, role, assigned_location_id, phone)
VALUES 
  ('usr-admin', 'admin@tallioscoffee.com', 'Tallio''s Super Admin', 'Super Admin', NULL, '+1 (415) 555-0100'),
  ('usr-staff-bayview', 'staff.bayview@tallioscoffee.com', 'Bayview Shift Lead', 'Staff', 'loc-main', '+1 (415) 555-0101'),
  ('usr-staff-truck1', 'truck1@tallioscoffee.com', 'Truck #1 Barista', 'Staff', 'loc-truck-1', '+1 (415) 555-0102'),
  ('usr-staff-truck2', 'truck2@tallioscoffee.com', 'Truck #2 Barista', 'Staff', 'loc-truck-2', '+1 (415) 555-0103'),
  ('usr-staff-kiosk', 'kiosk@tallioscoffee.com', 'Tech Park Kiosk Lead', 'Staff', 'loc-kiosk-tech', '+1 (415) 555-0104')
ON CONFLICT (email) DO NOTHING;


-- 3. CUSTOMERS TABLE (App & Walk-in Customers)
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
  last_order_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Customers
INSERT INTO public.customers (id, name, email, phone, avatar, membership, status, total_orders, total_spend, loyalty_points, favorite_drink, preferred_location)
VALUES
  ('cust-1', 'Nadia James', 'nadia.james@example.com', '+1 (415) 882-9012', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Mug Club Member', 'Active', 48, 462.50, 340, 'Vanilla Oat Flat White', 'Bayview Café'),
  ('cust-2', 'Darius Chen', 'darius.chen@techhub.io', '+1 (415) 743-1189', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'VIP Gold', 'Active', 64, 780.00, 580, 'Cold Brew with Salted Caramel', 'Tech Park Express Kiosk'),
  ('cust-3', 'Marisol Vega', 'marisol.vega@designstudio.co', '+1 (510) 921-4471', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Mug Club Member', 'Active', 32, 315.00, 260, 'Single Origin Cortado', 'Mobile Food Truck #1'),
  ('cust-4', 'Evan Brooks', 'evan.b@harborcorp.org', '+1 (415) 304-8922', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Regular', 'Active', 14, 112.00, 95, 'Batch Brew Drip Coffee', 'Bayview Café'),
  ('cust-5', 'Chloe Kensington', 'chloe.k@bayviewart.com', '+1 (415) 661-3490', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'Mug Club Member', 'Active', 29, 345.50, 285, 'Matcha Latte with Almond Milk', 'Mobile Food Truck #2'),
  ('cust-6', 'Marcus Sterling', 'marcus.s@fintechleads.com', '+1 (415) 552-8819', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150', 'Regular', 'Inactive', 6, 54.00, 40, 'Double Espresso Shot', 'Tech Park Express Kiosk'),
  ('cust-7', 'Aaliyah Patel', 'aaliyah.patel@biolabs.org', '+1 (510) 449-7723', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'VIP Gold', 'Active', 51, 590.00, 470, 'Lavender Honey Cappuccino', 'Bayview Café')
ON CONFLICT (email) DO NOTHING;


-- 4. INVENTORY ITEMS TABLE (Location-Wise Raw Stock)
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  min_threshold NUMERIC(10, 2) NOT NULL,
  cost_per_unit NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(10, 2),
  location_id TEXT REFERENCES public.locations(id) ON DELETE CASCADE,
  batch_number TEXT,
  expiry_date DATE,
  status TEXT DEFAULT 'In Stock',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 5. KIOSK ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.kiosk_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  channel TEXT NOT NULL,
  location_id TEXT REFERENCES public.locations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  stripe_status TEXT DEFAULT 'Paid',
  stripe_charge_id TEXT,
  order_status TEXT DEFAULT 'Incoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_orders ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated users
CREATE POLICY "Allow authenticated access to locations" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to staff_profiles" ON public.staff_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to inventory_items" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated access to kiosk_orders" ON public.kiosk_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read access to locations (needed for kiosk / app discovery)
CREATE POLICY "Allow public read on locations" ON public.locations FOR SELECT TO anon USING (true);
