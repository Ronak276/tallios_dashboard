# Tallio's Coffee Dashboard - Supabase Setup

This directory contains the standard Supabase migrations and seed scripts.

## Directory Structure
- `migrations/`: Contains database schema migrations and RLS policies.
  - `20261119000000_init_auth_profiles.sql`: Creates `profiles` table, RLS security policies, and user creation triggers.
- `seed.sql`: Seeds default Super Admin record (`admin@tallioscoffee.com`).

## Credentials Configured
- **Project URL:** `https://haevevfdyygtrqmsgxht.supabase.co`
- **Default Super Admin:** `admin@tallioscoffee.com`
- **Default Password:** `password123`
