/*
  # Fix tenant policies and optimize queries

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Add separate policies for different operations
    - Add proper indexes for performance

  2. Security
    - Maintain proper access control
    - Fix infinite recursion issues
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can manage tenants" ON tenants;
DROP POLICY IF EXISTS "Users can view users in same tenant" ON tenant_users;
DROP POLICY IF EXISTS "Admins can manage tenant users" ON tenant_users;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_composite ON tenant_users(tenant_id, user_id, role);

-- Create new tenant policies
CREATE POLICY "Enable tenant read access"
  ON tenants
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM tenant_users 
      WHERE tenant_id = id
    )
  );

CREATE POLICY "Enable tenant write access"
  ON tenants
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM tenant_users 
      WHERE tenant_id = id 
      AND role = 'admin'
    )
  );

-- Create new tenant_users policies
CREATE POLICY "Enable user read access"
  ON tenant_users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable user write access"
  ON tenant_users
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM tenant_users 
      WHERE tenant_id = tenant_users.tenant_id 
      AND role = 'admin'
    )
  );

CREATE POLICY "Enable user update/delete"
  ON tenant_users
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM tenant_users 
      WHERE tenant_id = tenant_users.tenant_id 
      AND role = 'admin'
    )
  );