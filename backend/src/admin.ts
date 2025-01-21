import { supabase } from "./supabase";

interface CreateTenantData {
    name: string;
    slug: string;
    domain: string | null;
    primary_color: string;
    secondary_color: string;
}

export async function getTenants() {
    const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("name");

    if (error) throw error;
    return data;
}

export async function createTenant(tenantData: CreateTenantData) {
    const { data, error } = await supabase
        .from("tenants")
        .insert([
            {
                name: tenantData.name,
                slug: tenantData.slug,
                domain: tenantData.domain,
                primary_color: tenantData.primary_color,
                secondary_color: tenantData.secondary_color,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    console.log("data", data);

    const { data: item, error: itemError } = await supabase
        .from("tenant_sites")
        .insert([
            {
                tenant_id: data.id,
                site_type: `tent`,
                quantity: 0,
            },
        ])
        .select()
        .single();

    const { data: item2, error: itemError2 } = await supabase
        .from("tenant_pricing")
        .insert([
            {
                tenant_id: data.id,
                site_type: `tent`,
                price_per_night: 0,
            },
        ])
        .select()
        .single();

    if (itemError) throw itemError;
    return data;
}

export async function getTenantSites(tenantId: number) {
    const { data, error } = await supabase
        .from("tenant_sites")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("site_type");
    if (error) throw error;
    // const id = data[0].id; // Assuming the first record is the new tenant
    // const { data: site, error: siteError } = await supabase
    //     .from("tenant_sites")
    //     .insert({ ...data, tenant_id: id })
    //     .select();

    // if (siteError) throw siteError;
    return data;
}

export async function updateTenantSites(
    tenantId: number,
    sites: { site_type: string; quantity: number }[]
) {
    const { error } = await supabase.from("tenant_sites").upsert(
        sites.map((site) => ({
            tenant_id: tenantId,
            site_type: site.site_type,
            quantity: site.quantity,
        }))
    );

    if (error) throw error;
}

export async function getTenantPricing(tenantId: number) {
    const { data, error } = await supabase
        .from("tenant_pricing")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("site_type");

    if (error) throw error;
    return data;
}

export async function updateTenantPricing(
    tenantId: number,
    pricing: { site_type: string; price_per_night: number }[]
) {
    const { error } = await supabase.from("tenant_pricing").upsert(
        pricing.map(
            (price) => ({
                tenant_id: tenantId,
                site_type: price.site_type,
                price_per_night: price.price_per_night,
            }),
            { onConflict: ["tenant_id"] }
        )
    );

    if (error) throw error;
}

export async function getTenantUsers(tenantId: number) {
    const { data, error } = await supabase
        .from("tenant_users")
        .select(
            `
      *,
      users:user_id(
        email,
        user_metadata
      )
    `
        )
        .eq("tenant_id", tenantId)
        .order("created_at");

    if (error) throw error;
    return data;
}

export async function createTenantUser(
    tenantId: number,
    email: string,
    role: "admin" | "owner" | "employee"
) {
    // First create the user in auth
    const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
                tenant_id: tenantId,
            },
        });

    if (authError) throw authError;

    // Then create the tenant user link
    const { data, error } = await supabase
        .from("tenant_users")
        .insert([
            {
                tenant_id: tenantId,
                user_id: authData.user.id,
                role,
            },
        ])
        .select()
        .single();

    if (error) throw error;
    return data;
}
