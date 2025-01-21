/*
  # Fix Tenant RLS Policies

  1. Changes
    - Remove circular policy dependencies
    - Optimize tenant user role checks
    - Add proper indexes for performance
    - Fix tenant creation flow

  2. Security
    - Maintain proper access control
    - Use security definer functions
    - Set explicit search paths
*/

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_select_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_insert_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_update_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_sites_select_policy" ON tenant_sites;
DROP POLICY IF EXISTS "tenant_sites_modify_policy" ON tenant_sites;
DROP POLICY IF EXISTS "tenant_users_select_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_modify_policy" ON tenant_users;

-- Create function to check user role
CREATE OR REPLACE FUNCTION check_user_role(
  tenant_id_param BIGINT,
  required_role user_role DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users
    WHERE tenant_id = tenant_id_param
    AND user_id = auth.uid()
    AND (required_role IS NULL OR role = required_role)
  );
END;
$$;

-- Create new simplified policies
CREATE POLICY "tenant_select_policy" ON tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "tenant_insert_policy" ON tenants
FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_update_policy" ON tenants
FOR UPDATE USING (
  check_user_role(id, 'admin'::user_role)
);

-- Update tenant sites policies
CREATE POLICY "tenant_sites_select_policy" ON tenant_sites
FOR SELECT USING (
  check_user_role(tenant_id)
);

CREATE POLICY "tenant_sites_modify_policy" ON tenant_sites
FOR ALL USING (
  check_user_role(tenant_id, 'admin'::user_role)
);

-- Update tenant users policies
CREATE POLICY "tenant_users_select_policy" ON tenant_users
FOR SELECT USING (
  check_user_role(tenant_id)
);

CREATE POLICY "tenant_users_modify_policy" ON tenant_users
FOR ALL USING (
  check_user_role(tenant_id, 'admin'::user_role)
);

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_lookup 
ON tenant_users(tenant_id, user_id, role);

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

  RETURN NEW;
END;
$$;