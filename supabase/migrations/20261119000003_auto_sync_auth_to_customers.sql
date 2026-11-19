-- Migration to automatically sync any new user signed up via Mobile App / Supabase Auth to the customers table
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_customers()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.customers (
    id,
    name,
    email,
    phone,
    avatar,
    membership,
    status,
    total_orders,
    total_spend,
    loyalty_points,
    favorite_drink,
    preferred_location
  )
  VALUES (
    NEW.id::text,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '+1 (415) 555-0199'),
    COALESCE(NEW.raw_user_meta_data->>'avatar', 'https://ui-avatars.com/api/?name=' || COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || '&background=1C2C60&color=fff'),
    COALESCE(NEW.raw_user_meta_data->>'membership', 'Regular'),
    'Active',
    0,
    0.00,
    COALESCE((NEW.raw_user_meta_data->>'loyalty_points')::integer, 0),
    COALESCE(NEW.raw_user_meta_data->>'favorite_drink', null),
    COALESCE(NEW.raw_user_meta_data->>'preferred_location', 'Bayview Café')
  )
  ON CONFLICT (email) DO UPDATE 
  SET 
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_customer_created ON auth.users;
CREATE TRIGGER on_auth_customer_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_auth_user_to_customers();

-- Allow public read access to customers so any client can fetch customer roster
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read on customers" ON public.customers;
CREATE POLICY "Allow anon read on customers"
ON public.customers
FOR SELECT
TO anon, authenticated
USING (true);
