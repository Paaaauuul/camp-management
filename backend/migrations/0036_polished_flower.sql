-- Drop existing materialized view and triggers
DROP MATERIALIZED VIEW IF EXISTS tenant_stats;
DROP TRIGGER IF EXISTS refresh_tenant_stats_on_tenant_change ON tenants;
DROP TRIGGER IF EXISTS refresh_tenant_stats_on_site_change ON tenant_sites;
DROP TRIGGER IF EXISTS refresh_tenant_stats_on_user_change ON tenant_users;
DROP FUNCTION IF EXISTS refresh_tenant_stats();

-- Create view instead of materialized view for real-time stats
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

-- Enable RLS on the view
ALTER VIEW tenant_stats SECURITY INVOKER;

-- Create policy for tenant_stats view access
CREATE POLICY "tenant_stats_access_policy" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND (
        tenant_users.role = 'admin' OR
        tenant_users.tenant_id = tenants.id
      )
    )
  );

-- Update tenant_users policies to prevent recursion
CREATE OR REPLACE FUNCTION check_admin_access(tenant_id bigint)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid()
    AND role = 'admin'
    AND tenant_id = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;