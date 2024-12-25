/*
  # Fix tenant RLS policies

  1. Changes
    - Remove recursive policy dependencies
    - Optimize tenant user lookups
    - Add proper indexes for performance
    - Fix tenant creation flow

  2. Security
    - Maintain proper access control
    - Use security definer functions
    - Set explicit search paths
*/

-- Create materialized view for tenant user roles
CREATE MATERIALIZED VIEW tenant_user_roles AS
SELECT DISTINCT
  user_id,
  tenant_id,
  role,
  created_at
FROM tenant_users;

-- Create index for efficient lookups
CREATE UNIQUE INDEX idx_tenant_user_roles_lookup 
ON tenant_user_roles(user_id, tenant_id);

CREATE INDEX idx_tenant_user_roles_role 
ON tenant_user_roles(role);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_tenant_user_roles()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_user_roles;
  RETURN NULL;
END;
$$;

-- Create trigger to refresh view
CREATE TRIGGER refresh_tenant_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON tenant_users
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_tenant_user_roles();

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_update_policy" ON tenants;

-- Create new simplified policies using materialized view
CREATE POLICY "tenant_select_policy" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenant_insert_policy" ON tenants
FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_update_policy" ON tenants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = tenants.id
    AND role = 'admin'
  )
);

-- Update tenant sites policies
CREATE POLICY "tenant_sites_select_policy" ON tenant_sites
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = tenant_sites.tenant_id
  )
);

CREATE POLICY "tenant_sites_modify_policy" ON tenant_sites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = tenant_sites.tenant_id
    AND role IN ('admin', 'owner')
  )
);

-- Update tenant users policies
CREATE POLICY "tenant_users_select_policy" ON tenant_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = tenant_users.tenant_id
  )
);

CREATE POLICY "tenant_users_modify_policy" ON tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM tenant_user_roles
    WHERE user_id = auth.uid()
    AND tenant_id = tenant_users.tenant_id
    AND role = 'admin'
  )
);

-- Update tenant creation handler
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;

  -- Create admin user for the new tenant
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (NEW.id, current_user_id, 'admin');

  -- Refresh materialized view
  REFRESH MATERIALIZED VIEW tenant_user_roles;

  RETURN NEW;
END;
$$;