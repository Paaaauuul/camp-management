import React from 'react';
import { DollarSign } from 'lucide-react';
import { getTenantPricing, updateTenantPricing } from '../../../lib/admin';

interface TenantPricingProps {
  tenant: {
    id: number;
    name: string;
  };
}

interface PricingConfig {
  site_type: 'tent' | 'rv' | 'mobile_home';
  price_per_night: number;
}

export function TenantPricing({ tenant }: TenantPricingProps) {
  const [pricing, setPricing] = React.useState<PricingConfig[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function loadPricing() {
      try {
        const data = await getTenantPricing(tenant.id);
        setPricing(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pricing');
      } finally {
        setLoading(false);
      }
    }

    loadPricing();
  }, [tenant.id]);

  const handlePriceChange = (type: 'tent' | 'rv' | 'mobile_home', value: number) => {
    setPricing(prev => 
      prev.map(price => 
        price.site_type === type 
          ? { ...price, price_per_night: Math.max(0, value) }
          : price
      )
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateTenantPricing(tenant.id, pricing);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pricing');
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
        {pricing.map((price) => (
          <div key={price.site_type} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium capitalize">
                {price.site_type.replace('_', ' ')} Sites
              </h3>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <input
                type="number"
                value={price.price_per_night}
                onChange={(e) => handlePriceChange(price.site_type, parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg pl-7 pr-12 py-2"
                min="0"
                step="0.01"
              />
              <span className="absolute right-3 top-2.5 text-gray-500">USD</span>
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