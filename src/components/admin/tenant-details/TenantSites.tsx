import React from 'react';
import { Plus, Tent } from 'lucide-react';
import { getTenantSites, updateTenantSites } from '../../../lib/admin';

interface TenantSitesProps {
  tenant: {
    id: number;
    name: string;
  };
}

interface SiteConfig {
  site_type: 'tent' | 'rv' | 'mobile_home';
  quantity: number;
}

export function TenantSites({ tenant }: TenantSitesProps) {
  const [sites, setSites] = React.useState<SiteConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadSites() {
      try {
        const data = await getTenantSites(tenant.id);
        setSites(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sites');
      } finally {
        setLoading(false);
      }
    }

    loadSites();
  }, [tenant.id]);

  const handleQuantityChange = (type: 'tent' | 'rv' | 'mobile_home', value: number) => {
    setSites(prev => 
      prev.map(site => 
        site.site_type === type 
          ? { ...site, quantity: Math.max(0, value) }
          : site
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateTenantSites(tenant.id, sites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sites');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sites.map((site) => (
          <div key={site.site_type} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Tent className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium capitalize">
                {site.site_type.replace('_', ' ')} Sites
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(site.site_type, site.quantity - 1)}
                className="p-2 border rounded hover:bg-gray-50"
              >
                -
              </button>
              <input
                type="number"
                value={site.quantity}
                onChange={(e) => handleQuantityChange(site.site_type, parseInt(e.target.value) || 0)}
                className="w-20 text-center border rounded-lg py-2"
                min="0"
              />
              <button
                onClick={() => handleQuantityChange(site.site_type, site.quantity + 1)}
                className="p-2 border rounded hover:bg-gray-50"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}