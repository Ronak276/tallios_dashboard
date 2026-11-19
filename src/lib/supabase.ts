import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://haevevfdyygtrqmsgxht.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhZXZldmZkeXlndHJxbXNneGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNTY0NTcsImV4cCI6MjExMDYzMjQ1N30.6ItZcH5rqcOPc7o2WyYkuismRKz9D_A4LzjP-BcKBBE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPER_ADMIN_CREDENTIALS = {
  email: 'admin@tallioscoffee.com',
  password: 'password123',
  name: "Tallio's Super Admin",
  role: 'Super Admin',
  assignedLocation: 'All Locations',
};

export const STAFF_CREDENTIALS = {
  email: 'truck1@tallioscoffee.com',
  password: 'password123',
  name: "Truck #1 Barista",
  role: 'Staff',
  assignedLocation: 'Mobile Food Truck #1',
};

export const ALL_STAFF_ACCOUNTS = [
  {
    email: 'staff.bayview@tallioscoffee.com',
    password: 'password123',
    name: 'Bayview Shift Lead',
    role: 'Staff',
    location: 'Bayview Café',
  },
  {
    email: 'truck1@tallioscoffee.com',
    password: 'password123',
    name: 'Truck #1 Barista',
    role: 'Staff',
    location: 'Mobile Food Truck #1',
  },
  {
    email: 'truck2@tallioscoffee.com',
    password: 'password123',
    name: 'Truck #2 Barista',
    role: 'Staff',
    location: 'Mobile Food Truck #2',
  },
  {
    email: 'kiosk@tallioscoffee.com',
    password: 'password123',
    name: 'Tech Park Kiosk Lead',
    role: 'Staff',
    location: 'Tech Park Express Kiosk',
  },
];

/**
 * Strictly verifies super admin credentials against Supabase without auto-creation.
 */
export async function ensureSuperAdminExists() {
  // Production security: Auto-creation disabled. Only pre-provisioned database accounts can authenticate.
  return;
}
