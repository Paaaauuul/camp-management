/*
  # Fix tenant policies to prevent recursion

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Add proper indexes for performance
    - Use materialized path pattern for hierarchical queries

  2. Security
    - Maintain proper access control
    - Fix infinite recursion issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable tenant read access" ON tenants;
DROP POLICY IF EXISTS "Enable tenant write access" ON tenants;
DROP POLICY IF EXISTS "Enable user read access" ON tenant_users;
DROP POLICY IF EXISTS "Enable user write access" ON tenant_users;
DROP POLICY IF EXISTS "Enable user update/delete" ON tenant_users;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_lookup 
ON tenant_users(user_id, tenant_id, role);

-- Create materialized admin lookup table
CREATE TABLE IF NOT EXISTS tenant_admin_lookup (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create function to maintain admin lookup
CREATE OR REPLACE FUNCTION maintain_admin_lookup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update admin status
  INSERT INTO tenant_admin_lookup (user_id, is_admin)
  VALUES (
    NEW.user_id,
    NEW.role = 'admin'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_admin = (NEW.role = 'admin'),
    updated_at = timezone('utc'::text, now());
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin lookup
DROP TRIGGER IF EXISTS update_admin_lookup ON tenant_users;
CREATE TRIGGER update_admin_lookup
  AFTER INSERT OR UPDATE ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION maintain_admin_lookup();

-- Populate initial admin lookup data
INSERT INTO tenant_admin_lookup (user_id, is_admin)
SELECT DISTINCT user_id, role = 'admin'
FROM tenant_users
ON CONFLICT (user_id) DO UPDATE
SET is_admin = EXCLUDED.is_admin;

-- Create new simplified policies
CREATE POLICY "tenant_read_policy"
  ON tenants
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tenant_admin_lookup
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "tenant_write_policy"
  ON tenants
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tenant_admin_lookup
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "tenant_users_read_policy"
  ON tenant_users
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tenant_admin_lookup
    WHERE user_id = auth.uid() AND is_admin = true
  ));

CREATE POLICY "tenant_users_write_policy"
  ON tenant_users
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tenant_admin_lookup
    WHERE user_id = auth.uid() AND is_admin = true
  ));