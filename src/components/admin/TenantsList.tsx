import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ChevronRight, Users, Settings } from 'lucide-react';
import { getTenants } from '../../lib/admin';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  domain: string | null;
  created_at: string;
  site_count: number;
  user_count: number;
}

export function TenantsList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadTenants() {
      try {
        const data = await getTenants();
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenants');
      } finally {
        setLoading(false);
      }
    }

    loadTenants();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {tenants.map((tenant) => (
          <div
            key={tenant.id}
            className="p-6 hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">{tenant.name}</h2>
                <div className="mt-1 flex items-center gap-6 text-sm text-gray-500">
                  <span>{tenant.domain || tenant.slug}</span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    {tenant.site_count} sites
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {tenant.user_count} users
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}