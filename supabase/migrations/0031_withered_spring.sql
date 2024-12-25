-- Drop existing policies
DROP POLICY IF EXISTS "enable_read_for_admins" ON tenants;
DROP POLICY IF EXISTS "enable_write_for_admins" ON tenants;
DROP POLICY IF EXISTS "enable_modify_for_admins" ON tenants;

-- Create new simplified tenant policies
CREATE POLICY "enable_tenant_read"
  ON tenants
  FOR SELECT
  USING (true);

CREATE POLICY "enable_tenant_insert"
  ON tenants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "enable_tenant_update"
  ON tenants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenants.id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role = 'admin'
    )
  );

-- Create function to automatically create admin user after tenant creation
CREATE OR REPLACE FUNCTION handle_new_tenant()
RETURNS TRIGGER AS $$
BEGIN
  -- Create admin user for the new tenant
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'admin');
  
  -- Update admin lookup
  INSERT INTO tenant_admin_lookup (user_id, is_admin)
  VALUES (auth.uid(), true)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    is_admin = true,
    updated_at = timezone('utc'::text, now());
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new tenant
DROP TRIGGER IF EXISTS on_tenant_created ON tenants;
CREATE TRIGGER on_tenant_created
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_tenant();