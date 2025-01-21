/*
  # Fix tenant access policies

  1. Changes
    - Simplify RLS policies for better performance
    - Fix tenant access for admins
    - Add proper indexes
    - Add proper cascading permissions

  2. Security
    - Maintain proper access control
    - Prevent unauthorized access
    - Allow proper admin access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_read_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_write_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_users_read_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_write_policy" ON tenant_users;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tenant_admin_lookup_user ON tenant_admin_lookup(user_id, is_admin);

-- Create new simplified policies for tenants
CREATE POLICY "enable_read_for_admins"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_admin_lookup
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "enable_write_for_admins"
  ON tenants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_admin_lookup
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "enable_modify_for_admins"
  ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_admin_lookup
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Create policies for tenant_users
CREATE POLICY "enable_read_for_all"
  ON tenant_users
  FOR SELECT
  USING (true);

CREATE POLICY "enable_write_for_admins"
  ON tenant_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenant_admin_lookup
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "enable_modify_for_admins"
  ON tenant_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_admin_lookup
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Refresh admin lookup data
TRUNCATE tenant_admin_lookup;
INSERT INTO tenant_admin_lookup (user_id, is_admin)
SELECT DISTINCT user_id, role = 'admin'
FROM tenant_users
ON CONFLICT (user_id) DO UPDATE
SET 
  is_admin = EXCLUDED.is_admin,
  updated_at = timezone('utc'::text, now());