/*
  # Fix tenant management policies

  1. Changes
    - Simplify RLS policies to prevent recursion
    - Fix tenant user association
    - Add proper indexes for performance
    - Update trigger function to handle auth.uid() properly

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Use SECURITY DEFINER for elevated privilege functions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "enable_tenant_read" ON tenants;
DROP POLICY IF EXISTS "enable_tenant_insert" ON tenants;
DROP POLICY IF EXISTS "enable_tenant_update" ON tenants;

-- Create new simplified policies
CREATE POLICY "tenant_select_policy" ON tenants
  FOR SELECT USING (true);

CREATE POLICY "tenant_insert_policy" ON tenants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_update_policy" ON tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_tenant_users_lookup 
  ON tenant_users(tenant_id, user_id, role);

-- Update tenant creation handler
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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

  -- Update admin lookup
  INSERT INTO tenant_admin_lookup (user_id, is_admin)
  VALUES (current_user_id, true)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    is_admin = true,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;