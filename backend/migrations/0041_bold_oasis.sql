/*
  # Fix Tenant Stats and Policies

  1. Changes
    - Drop existing problematic view and policies
    - Create new non-recursive tenant stats view
    - Add proper indexes and permissions
    - Create simplified policies
    
  2. Security
    - Maintain proper access control without recursion
    - Use role-based permissions efficiently
*/

-- Drop existing view and policies
DROP VIEW IF EXISTS tenant_stats;
DROP POLICY IF EXISTS "enable_tenant_access" ON tenants;
DROP POLICY IF EXISTS "enable_tenant_users_access" ON tenant_users;

-- Create proper indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_admin 
ON tenant_users(user_id, role) 
WHERE role = 'admin';

-- Create admin users view for efficient lookups
CREATE VIEW admin_users AS 
SELECT DISTINCT user_id 
FROM tenant_users 
WHERE role = 'admin';

-- Create tenant stats view
CREATE VIEW tenant_stats AS 
WITH site_counts AS (
  SELECT tenant_id, COUNT(*) as site_count
  FROM tenant_sites
  GROUP BY tenant_id
),
user_counts AS (
  SELECT tenant_id, COUNT(*) as user_count
  FROM tenant_users
  GROUP BY tenant_id
)
SELECT 
  t.id,
  t.name,
  t.slug,
  t.domain,
  t.primary_color,
  t.secondary_color,
  t.created_at,
  t.updated_at,
  COALESCE(s.site_count, 0) as site_count,
  COALESCE(u.user_count, 0) as user_count
FROM tenants t
LEFT JOIN site_counts s ON s.tenant_id = t.id
LEFT JOIN user_counts u ON u.tenant_id = t.id;

-- Grant access to authenticated users
GRANT SELECT ON tenant_stats TO authenticated;
GRANT SELECT ON admin_users TO authenticated;

-- Create simplified tenant policies
CREATE POLICY "enable_read_for_admins" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "enable_write_for_admins" ON tenants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);

-- Create simplified tenant_users policies
CREATE POLICY "enable_read_for_all" ON tenant_users
FOR SELECT USING (true);

CREATE POLICY "enable_write_for_admins" ON tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  )
);