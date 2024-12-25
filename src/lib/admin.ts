import { supabase } from './supabase';

interface CreateTenantData {
  name: string;
  slug: string;
  domain: string | null;
  primary_color: string;
  secondary_color: string;
}

export async function getTenants() {
  const { data, error } = await supabase
    .from('tenant_stats')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function createTenant(tenantData: CreateTenantData) {
  const { data, error } = await supabase
    .from('tenants')
    .insert([{
      name: tenantData.name,
      slug: tenantData.slug,
      domain: tenantData.domain,
      primary_color: tenantData.primary_color,
      secondary_color: tenantData.secondary_color
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTenantSites(tenantId: number) {
  const { data, error } = await supabase
    .from('tenant_sites')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('site_type');

  if (error) throw error;
  return data;
}

export async function updateTenantSites(tenantId: number, sites: { site_type: string; quantity: number }[]) {
  const { error } = await supabase
    .from('tenant_sites')
    .upsert(
      sites.map(site => ({
        tenant_id: tenantId,
        site_type: site.site_type,
        quantity: site.quantity
      }))
    );

  if (error) throw error;
}

export async function getTenantPricing(tenantId: number) {
  const { data, error } = await supabase
    .from('tenant_pricing')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('site_type');

  if (error) throw error;
  return data;
}

export async function updateTenantPricing(tenantId: number, pricing: { site_type: string; price_per_night: number }[]) {
  const { error } = await supabase
    .from('tenant_pricing')
    .upsert(
      pricing.map(price => ({
        tenant_id: tenantId,
        site_type: price.site_type,
        price_per_night: price.price_per_night
      }))
    );

  if (error) throw error;
}

export async function getTenantUsers(tenantId: number) {
  const { data, error } = await supabase
    .from('tenant_users')
    .select(`
      *,
      users:user_id(
        email,
        user_metadata
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at');

  if (error) throw error;
  return data;
}

export async function createTenantUser(tenantId: number, email: string, role: 'admin' | 'owner' | 'employee') {
  // First create the user in auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      tenant_id: tenantId
    }
  });

  if (authError) throw authError;

  // Then create the tenant user link
  const { data, error } = await supabase
    .from('tenant_users')
    .insert([{
      tenant_id: tenantId,
      user_id: authData.user.id,
      role
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}