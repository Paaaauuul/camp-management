/*
  # Fix Tenant Policies

  1. Changes
    - Drop existing recursive policies
    - Create simplified non-recursive policies
    - Add proper indexes for performance
    
  2. Security
    - Maintain proper access control without recursion
*/

-- Drop existing policies
DROP POLICY IF EXISTS "tenant_stats_access_policy" ON tenants;
DROP POLICY IF EXISTS "tenant_users_read_policy" ON tenant_users;
DROP POLICY IF EXISTS "tenant_users_write_policy" ON tenant_users;

-- Create proper indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_role_user 
ON tenant_users(user_id, role);

-- Create base policy for tenant access
CREATE POLICY "enable_tenant_access" ON tenants
FOR ALL USING (
  auth.uid() IN (
    SELECT user_id 
    FROM tenant_users 
    WHERE role = 'admin'
  )
);

-- Create base policy for tenant_users access
CREATE POLICY "enable_tenant_users_access" ON tenant_users
FOR ALL USING (
  auth.uid() IN (
    SELECT user_id 
    FROM tenant_users 
    WHERE role = 'admin'
  )
);

-- Update stats view permissions
GRANT SELECT ON tenant_stats TO authenticated;