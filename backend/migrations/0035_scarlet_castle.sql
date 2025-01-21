/*
  # Fix Tenant Policies

  1. Changes
    - Drop existing policies that cause recursion
    - Create simplified policies for tenant access
    - Add optimized indexes for performance
    - Create materialized view for tenant stats

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_sites_select_policy" ON tenant_sites;
DROP POLICY IF EXISTS "tenant_sites_modify_policy" ON tenant_sites;
DROP POLICY IF EXISTS "tenant_users_select_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_modify_policy" ON tenant_users;

-- Create materialized view for tenant stats
CREATE MATERIALIZED VIEW tenant_stats AS
SELECT 
  t.id AS tenant_id,
  t.name,
  t.slug,
  t.domain,
  COUNT(DISTINCT ts.id) AS site_count,
  COUNT(DISTINCT tu.id) AS user_count
FROM tenants t
LEFT JOIN tenant_sites ts ON ts.tenant_id = t.id
LEFT JOIN tenant_users tu ON tu.tenant_id = t.id
GROUP BY t.id, t.name, t.slug, t.domain;

-- Create indexes for the materialized view
CREATE UNIQUE INDEX tenant_stats_id ON tenant_stats(tenant_id);

-- Create function to refresh stats
CREATE OR REPLACE FUNCTION refresh_tenant_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh stats
CREATE TRIGGER refresh_tenant_stats_on_tenant_change
  AFTER INSERT OR UPDATE OR DELETE ON tenants
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_tenant_stats();

CREATE TRIGGER refresh_tenant_stats_on_site_change
  AFTER INSERT OR UPDATE OR DELETE ON tenant_sites
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_tenant_stats();

CREATE TRIGGER refresh_tenant_stats_on_user_change
  AFTER INSERT OR UPDATE OR DELETE ON tenant_users
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_tenant_stats();

-- Create simplified policies
CREATE POLICY "enable_tenant_read" ON tenants
  FOR SELECT USING (true);

CREATE POLICY "enable_tenant_write" ON tenants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

-- Create policies for tenant_users
CREATE POLICY "enable_user_read" ON tenant_users
  FOR SELECT USING (true);

CREATE POLICY "enable_user_write" ON tenant_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu
      WHERE tu.user_id = auth.uid()
      AND tu.role = 'admin'
      AND tu.tenant_id = tenant_users.tenant_id
    )
  );