/*
  # Fix Tenant Stats View

  1. Changes
    - Drop materialized view properly
    - Recreate as regular view
    - Add proper indexes
    - Fix security settings
    
  2. Security
    - Maintain proper access control
*/

-- Drop materialized view properly
DROP MATERIALIZED VIEW IF EXISTS tenant_stats;

-- Drop regular view if it exists
DROP VIEW IF EXISTS tenant_stats;

-- Create proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_sites_tenant_id 
ON tenant_sites(tenant_id);

CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id 
ON tenant_users(tenant_id);

-- Create the view with proper permissions
CREATE VIEW tenant_stats AS
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

-- Grant proper permissions
GRANT SELECT ON tenant_stats TO authenticated;

-- Create policy for view access
CREATE POLICY "tenant_stats_access_policy" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );