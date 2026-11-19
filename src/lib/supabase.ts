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
};

/**
 * Ensures the super admin user exists in Supabase.
 * If user does not exist, attempts to create it via signUp.
 */
export async function ensureSuperAdminExists() {
  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: SUPER_ADMIN_CREDENTIALS.email,
      password: SUPER_ADMIN_CREDENTIALS.password,
    });

    if (signInError && (signInError.message.includes('Invalid login') || signInError.message.includes('User not found'))) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: SUPER_ADMIN_CREDENTIALS.email,
        password: SUPER_ADMIN_CREDENTIALS.password,
        options: {
          data: {
            name: SUPER_ADMIN_CREDENTIALS.name,
            role: SUPER_ADMIN_CREDENTIALS.role,
          },
        },
      });

      if (signUpError) {
        console.warn('Super Admin auto-seed note:', signUpError.message);
      }
    }
  } catch (err) {
    console.error('Error verifying super admin account:', err);
  }
}
