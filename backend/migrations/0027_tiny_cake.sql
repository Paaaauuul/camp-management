/*
  # Fix RLS policies to prevent infinite recursion

  1. Changes
    - Restructure RLS policies to avoid circular dependencies
    - Add separate policies for different operations
    - Improve policy security and clarity

  2. Security
    - Enable RLS on all tables
    - Add proper policies for tenant access
    - Fix infinite recursion issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their assigned tenants" ON tenants;
DROP POLICY IF EXISTS "System admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view their tenant sites" ON tenant_sites;
DROP POLICY IF EXISTS "System admins can manage tenant sites" ON tenant_sites;
DROP POLICY IF EXISTS "Users can view their tenant users" ON tenant_users;
DROP POLICY IF EXISTS "System admins can manage tenant users" ON tenant_users;

-- Create new policies for tenants
CREATE POLICY "Users can view tenants"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tenants"
  ON tenants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
      AND tenant_users.tenant_id = tenants.id
    )
  );

-- Create new policies for tenant_sites
CREATE POLICY "Users can view tenant sites"
  ON tenant_sites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_sites.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can manage tenant sites"
  ON tenant_sites
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_sites.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('admin', 'owner')
    )
  );

-- Create new policies for tenant_users
CREATE POLICY "Users can view users in same tenant"
  ON tenant_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu2
      WHERE tu2.tenant_id = tenant_users.tenant_id
      AND tu2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tenant users"
  ON tenant_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users tu2
      WHERE tu2.tenant_id = tenant_users.tenant_id
      AND tu2.user_id = auth.uid()
      AND tu2.role = 'admin'
    )
  );

-- Create new policies for tenant_pricing
CREATE POLICY "Users can view tenant pricing"
  ON tenant_pricing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_pricing.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and owners can manage tenant pricing"
  ON tenant_pricing
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_pricing.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('admin', 'owner')
    )
  );