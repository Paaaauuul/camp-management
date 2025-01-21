/*
  # Fix tenant schema and queries

  1. Changes
    - Fix tenant_sites and tenant_users count queries
    - Add missing site_type enum if not exists
    - Add missing columns to sites table
    - Fix RLS policies
    - Add missing indexes

  2. Security
    - Enable RLS on all tables
    - Add proper policies for tenant access
*/

-- Create site_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE site_type AS ENUM ('tent', 'rv', 'mobile_home');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS site_type site_type NOT NULL DEFAULT 'rv',
ADD COLUMN IF NOT EXISTS has_water boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_electricity boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_sewer boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_length integer,
ADD COLUMN IF NOT EXISTS max_width integer,
ADD COLUMN IF NOT EXISTS amp_service integer CHECK (amp_service IN (30, 50)),
ADD COLUMN IF NOT EXISTS pad_type text,
ADD COLUMN IF NOT EXISTS description text;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sites_tenant_id ON sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_sites_tenant_id ON tenant_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);

-- Fix RLS policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their assigned tenants" ON tenants;
DROP POLICY IF EXISTS "System admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenant sites" ON tenant_sites;
DROP POLICY IF EXISTS "System admins can manage tenant sites" ON tenant_sites;
DROP POLICY IF EXISTS "Users can view their tenant users" ON tenant_users;
DROP POLICY IF EXISTS "System admins can manage tenant users" ON tenant_users;

-- Create new policies
CREATE POLICY "Users can view their assigned tenants"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage tenants"
  ON tenants
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their tenant sites"
  ON tenant_sites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_sites.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage tenant sites"
  ON tenant_sites
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their tenant users"
  ON tenant_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.tenant_id = tenant_users.tenant_id
      AND tu.user_id = auth.uid()
    )
  );

CREATE POLICY "System admins can manage tenant users"
  ON tenant_users
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );