-- ==============================================================
-- TALLIO'S CAFÉ - ORDERS TABLE MIGRATION & SEEDING (25+ RECORDS)
-- Renaming/creating table as 'public.orders' with modern schema
-- ==============================================================

-- 1. Create or Replace orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  channel TEXT NOT NULL, -- 'Mobile App' | 'Website' | 'Self-Service Kiosk' | 'Counter' | 'QR Code Table' | 'Mobile Food Truck Counter'
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

-- Ensure all columns exist even if the table was created earlier without them
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'Counter';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_status TEXT NOT NULL DEFAULT 'Paid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Card';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

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

-- 2. Seed 25 Comprehensive Coffee Orders for Global 20-per-page Pagination Testing
INSERT INTO public.orders (
  id, order_number, customer_name, customer_phone, channel, location_id, items, total_amount, order_status, stripe_status, payment_method, stripe_charge_id, created_at
)
VALUES
  (
    'ord-101', '#TL-4081', 'Marcus Vance', '+1 (555) 234-5678', 'Self-Service Kiosk', 'loc-main',
    '[{"name": "Oat Milk Flat White (12oz)", "quantity": 1, "options": "Extra shot, Yirgacheffe beans", "price": 6.25}, {"name": "Butter Croissant", "quantity": 1, "options": "Warmed", "price": 4.50}]'::jsonb,
    10.75, 'Brewing / Prep', 'Paid', 'Apple Pay', 'ch_3N8x7fLkd921M', '2026-11-25T11:58:00Z'
  ),
  (
    'ord-102', '#TL-4082', 'Elena Rostova (Table 4)', '+1 (555) 345-6789', 'QR Code Table', 'loc-main',
    '[{"name": "Iced Salted Caramel Cold Brew", "quantity": 2, "options": "Less sweet, Splash oat milk", "price": 13.00}]'::jsonb,
    13.00, 'Incoming', 'Paid', 'Card', 'ch_3N8x8aLkd922K', '2026-11-25T12:02:00Z'
  ),
  (
    'ord-103', '#TL-4083', 'David Chen', '+1 (555) 456-7890', 'Mobile Food Truck Counter', 'loc-truck-1',
    '[{"name": "Double Espresso Shot", "quantity": 1, "options": "Colombian Supremo", "price": 3.75}]'::jsonb,
    3.75, 'Ready for Pickup', 'Paid', 'Google Pay', 'ch_3N8x91Lkd929P', '2026-11-25T11:54:00Z'
  ),
  (
    'ord-104', '#TL-4084', 'Aria Montgomery', '+1 (555) 567-8901', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Ceremonial Matcha Latte", "quantity": 1, "options": "Oat milk, Vanilla syrup", "price": 6.75}, {"name": "Almond Biscotti", "quantity": 2, "price": 5.00}]'::jsonb,
    11.75, 'Incoming', 'Paid', 'Apple Pay', 'ch_3N8y10Lkd933Z', '2026-11-25T11:56:00Z'
  ),
  (
    'ord-105', '#TL-4085', 'James Wilson', '+1 (555) 678-9012', 'Walk-in / Counter', 'loc-main',
    '[{"name": "Nitro Cold Brew (16oz)", "quantity": 1, "price": 6.00}, {"name": "Blueberry Muffin", "quantity": 1, "price": 4.25}]'::jsonb,
    10.25, 'Brewing / Prep', 'Paid', 'Card', 'ch_3N8y22Lkd934A', '2026-11-25T11:50:00Z'
  ),
  (
    'ord-106', '#TL-4086', 'Sophia Taylor', '+1 (555) 789-0123', 'Mobile App', 'loc-truck-1',
    '[{"name": "Vanilla Latte (12oz)", "quantity": 1, "options": "Almond milk", "price": 5.75}]'::jsonb,
    5.75, 'Ready for Pickup', 'Paid', 'Apple Pay', 'ch_3N8y33Lkd935B', '2026-11-25T11:45:00Z'
  ),
  (
    'ord-107', '#TL-4087', 'Liam O Connor', '+1 (555) 890-1234', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Americano (16oz)", "quantity": 2, "price": 8.00}, {"name": "Chocolate Croissant", "quantity": 1, "price": 4.75}]'::jsonb,
    12.75, 'Completed', 'Paid', 'Card', 'ch_3N8y44Lkd936C', '2026-11-25T11:40:00Z'
  ),
  (
    'ord-108', '#TL-4088', 'Olivia Brown', '+1 (555) 901-2345', 'Website', 'loc-main',
    '[{"name": "Spanish Latte (Condensed Milk)", "quantity": 1, "price": 6.50}, {"name": "Avocado Toast with Egg", "quantity": 1, "price": 9.50}]'::jsonb,
    16.00, 'Brewing / Prep', 'Paid', 'Card', 'ch_3N8y55Lkd937D', '2026-11-25T11:35:00Z'
  ),
  (
    'ord-109', '#TL-4089', 'Lucas Scott', '+1 (555) 012-3456', 'Walk-in / Counter', 'loc-main',
    '[{"name": "Pour Over - Geisha Reserve", "quantity": 1, "price": 8.50}]'::jsonb,
    8.50, 'Incoming', 'Paid', 'Cash', 'ch_3N8y66Lkd938E', '2026-11-25T11:30:00Z'
  ),
  (
    'ord-110', '#TL-4090', 'Emma Watson', '+1 (555) 123-4567', 'Mobile App', 'loc-truck-2',
    '[{"name": "Iced Chai Tea Latte", "quantity": 1, "options": "Oat milk, Extra spice", "price": 6.25}, {"name": "Cinnamon Roll", "quantity": 1, "price": 5.00}]'::jsonb,
    11.25, 'Ready for Pickup', 'Paid', 'Apple Pay', 'ch_3N8y77Lkd939F', '2026-11-25T11:25:00Z'
  ),
  (
    'ord-111', '#TL-4091', 'Benjamin Miller', '+1 (555) 234-5679', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Mocha Latte (Dark Chocolate)", "quantity": 1, "price": 6.25}]'::jsonb,
    6.25, 'Completed', 'Paid', 'Google Pay', 'ch_3N8y88Lkd940G', '2026-11-25T11:20:00Z'
  ),
  (
    'ord-112', '#TL-4092', 'Charlotte Davis', '+1 (555) 345-6780', 'QR Code Table', 'loc-main',
    '[{"name": "Caramel Macchiato (Iced)", "quantity": 2, "price": 13.00}, {"name": "Butter Croissant", "quantity": 2, "price": 9.00}]'::jsonb,
    22.00, 'Brewing / Prep', 'Paid', 'Card', 'ch_3N8y99Lkd941H', '2026-11-25T11:15:00Z'
  ),
  (
    'ord-113', '#TL-4093', 'Zoe Kravitz', '+1 (555) 456-7892', 'Walk-in / Counter', 'loc-main',
    '[{"name": "Cortado (4oz)", "quantity": 1, "options": "Whole milk", "price": 4.50}]'::jsonb,
    4.50, 'Incoming', 'Paid', 'Cash', 'ch_3N8z09Lkd942I', '2026-11-25T11:10:00Z'
  ),
  (
    'ord-114', '#TL-4094', 'Noah Sterling', '+1 (555) 567-8903', 'Mobile Food Truck Counter', 'loc-truck-2',
    '[{"name": "Iced Caramel Macchiato", "quantity": 2, "options": "Extra drizzle", "price": 13.50}]'::jsonb,
    13.50, 'Ready for Pickup', 'Paid', 'Card', 'ch_3N8z10Lkd943J', '2026-11-25T11:05:00Z'
  ),
  (
    'ord-115', '#TL-4095', 'Maya Lin', '+1 (555) 678-9014', 'Website', 'loc-main',
    '[{"name": "Hot Chocolate (Dark Cocoa)", "quantity": 2, "options": "Oat milk, Marshmallows", "price": 11.00}, {"name": "Almond Biscotti", "quantity": 2, "price": 5.00}]'::jsonb,
    16.00, 'Completed', 'Paid', 'Card', 'ch_3N8z21Lkd944K', '2026-11-25T11:00:00Z'
  ),
  (
    'ord-116', '#TL-4096', 'Daniel Craig', '+1 (555) 789-0125', 'Walk-in / Counter', 'loc-truck-1',
    '[{"name": "Red Eye Coffee (Dark Roast)", "quantity": 1, "price": 4.75}]'::jsonb,
    4.75, 'Incoming', 'Paid', 'Cash', 'ch_3N8z32Lkd945L', '2026-11-25T10:55:00Z'
  ),
  (
    'ord-117', '#TL-4097', 'Isabella Garcia', '+1 (555) 890-1236', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Lavender Honey Latte", "quantity": 1, "options": "Oat milk", "price": 6.50}, {"name": "Blueberry Muffin", "quantity": 1, "price": 4.25}]'::jsonb,
    10.75, 'Brewing / Prep', 'Paid', 'Apple Pay', 'ch_3N8z43Lkd946M', '2026-11-25T10:50:00Z'
  ),
  (
    'ord-118', '#TL-4098', 'Henry Cavill', '+1 (555) 901-2347', 'QR Code Table', 'loc-main',
    '[{"name": "Nitro Cold Brew with Sweet Cream", "quantity": 2, "price": 14.00}]'::jsonb,
    14.00, 'Ready for Pickup', 'Paid', 'Card', 'ch_3N8z54Lkd947N', '2026-11-25T10:45:00Z'
  ),
  (
    'ord-119', '#TL-4099', 'Mia Thermopolis', '+1 (555) 012-3458', 'Mobile App', 'loc-truck-1',
    '[{"name": "Vanilla Bean Frappe", "quantity": 1, "options": "Whipped cream", "price": 6.75}]'::jsonb,
    6.75, 'Completed', 'Paid', 'Apple Pay', 'ch_3N8z65Lkd948O', '2026-11-25T10:40:00Z'
  ),
  (
    'ord-120', '#TL-4100', 'Alexander Hamilton', '+1 (555) 123-4569', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Drip Coffee (Dark Roast)", "quantity": 2, "price": 7.00}, {"name": "Butter Croissant", "quantity": 2, "price": 9.00}]'::jsonb,
    16.00, 'Incoming', 'Paid', 'Google Pay', 'ch_3N8z76Lkd949P', '2026-11-25T10:35:00Z'
  ),
  (
    'ord-121', '#TL-4101', 'Grace Hopper', '+1 (555) 234-5671', 'Walk-in / Counter', 'loc-main',
    '[{"name": "Cappuccino (12oz)", "quantity": 1, "options": "Dry foam", "price": 5.50}]'::jsonb,
    5.50, 'Brewing / Prep', 'Paid', 'Card', 'ch_3N8z87Lkd950Q', '2026-11-25T10:30:00Z'
  ),
  (
    'ord-122', '#TL-4102', 'Alan Turing', '+1 (555) 345-6782', 'Mobile Food Truck Counter', 'loc-truck-2',
    '[{"name": "Cold Brew Float with Gelato", "quantity": 1, "price": 7.50}]'::jsonb,
    7.50, 'Ready for Pickup', 'Paid', 'Apple Pay', 'ch_3N8z98Lkd951R', '2026-11-25T10:25:00Z'
  ),
  (
    'ord-123', '#TL-4103', 'Ada Lovelace', '+1 (555) 456-7893', 'Website', 'loc-main',
    '[{"name": "Caramel Macchiato (16oz)", "quantity": 1, "price": 6.25}, {"name": "Almond Biscotti", "quantity": 2, "price": 5.00}]'::jsonb,
    11.25, 'Completed', 'Paid', 'Card', 'ch_3N9a09Lkd952S', '2026-11-25T10:20:00Z'
  ),
  (
    'ord-124', '#TL-4104', 'Nikola Tesla', '+1 (555) 567-8904', 'Self-Service Kiosk', 'loc-kiosk-tech',
    '[{"name": "Quad Espresso Over Ice", "quantity": 1, "options": "Splash almond milk", "price": 5.50}]'::jsonb,
    5.50, 'Incoming', 'Paid', 'Apple Pay', 'ch_3N9a10Lkd953T', '2026-11-25T10:15:00Z'
  ),
  (
    'ord-125', '#TL-4105', 'Marie Curie', '+1 (555) 678-9015', 'QR Code Table', 'loc-main',
    '[{"name": "Matcha Cloud Latte", "quantity": 1, "price": 6.75}, {"name": "Avocado Toast", "quantity": 1, "price": 9.50}]'::jsonb,
    16.25, 'Brewing / Prep', 'Paid', 'Google Pay', 'ch_3N9a21Lkd954U', '2026-11-25T10:10:00Z'
  )
ON CONFLICT (order_number) DO UPDATE SET
  customer_name = EXCLUDED.customer_name,
  customer_phone = EXCLUDED.customer_phone,
  channel = EXCLUDED.channel,
  location_id = EXCLUDED.location_id,
  items = EXCLUDED.items,
  total_amount = EXCLUDED.total_amount,
  order_status = EXCLUDED.order_status,
  stripe_status = EXCLUDED.stripe_status,
  payment_method = EXCLUDED.payment_method,
  updated_at = NOW();
