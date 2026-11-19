-- Seed Initial Super Admin Profile Data
-- Target Super Admin: admin@tallioscoffee.com

DO $$
DECLARE
  super_admin_id UUID;
BEGIN
  -- Check if user exists in auth.users
  SELECT id INTO super_admin_id FROM auth.users WHERE email = 'admin@tallioscoffee.com';

  IF super_admin_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
      super_admin_id,
      'admin@tallioscoffee.com',
      'Tallio''s Super Admin',
      'Super Admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW();
  END IF;
END $$;
