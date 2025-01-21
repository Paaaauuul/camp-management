/*
  # Fix RLS Policies

  1. Changes
    - Remove circular dependencies in RLS policies
    - Simplify access control logic
    - Add proper indexes for performance
    
  2. Security
    - Maintain proper access control
    - Prevent infinite recursion
    - Keep data properly secured
*/

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_stats_access_policy" ON tenants;
DROP POLICY IF EXISTS "enable_tenant_read" ON tenants;
DROP POLICY IF EXISTS "enable_tenant_write" ON tenants;
DROP POLICY IF EXISTS "enable_user_read" ON tenant_users;
DROP POLICY IF EXISTS "enable_user_write" ON tenant_users;

-- Create base view for admin users
CREATE OR REPLACE VIEW admin_users AS
SELECT DISTINCT user_id
FROM tenant_users
WHERE role = 'admin';

-- Create index for admin lookup
CREATE INDEX IF NOT EXISTS idx_tenant_users_admin 
ON tenant_users(user_id) 
WHERE role = 'admin';

-- Create simplified tenant policies
CREATE POLICY "tenant_read_policy" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenant_write_policy" ON tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Create simplified tenant_users policies
CREATE POLICY "tenant_users_read_policy" ON tenant_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenant_users_write_policy" ON tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Update stats view
CREATE OR REPLACE VIEW tenant_stats AS
SELECT 
  t.*,
  COALESCE(s.site_count, 0) as site_count,
  COALESCE(u.user_count, 0) as user_count
FROM tenants t
LEFT JOIN (
  SELECT tenant_id, COUNT(*) as site_count
  FROM tenant_sites
  GROUP BY tenant_id
) s ON s.tenant_id = t.id
LEFT JOIN (
  SELECT tenant_id, COUNT(*) as user_count
  FROM tenant_users
  GROUP BY tenant_id
) u ON u.tenant_id = t.id;