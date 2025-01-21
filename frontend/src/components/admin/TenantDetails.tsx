import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tent, DollarSign, Users } from 'lucide-react';
import { TenantSites } from './tenant-details/TenantSites';
import { TenantPricing } from './tenant-details/TenantPricing';
import { TenantUsers } from './tenant-details/TenantUsers';

interface TenantDetailsProps {
  tenant: {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
  };
}

type Tab = 'sites' | 'pricing' | 'users';

export function TenantDetails({ tenant }: TenantDetailsProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>('sites');
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-50 z-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => navigate('/admin/tenants')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>

          <div className="flex flex-col gap-1 py-3">
            <h1 className="text-2xl font-semibold">{tenant.name}</h1>
            <p className="text-sm text-gray-500">
              {tenant.domain || `${tenant.slug}.example.com`}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-8">
            <button
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'sites'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sites')}
            >
              <div className="flex items-center gap-2">
                <Tent className="h-4 w-4" />
                Sites
              </div>
            </button>
            <button
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'pricing'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('pricing')}
            >
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </div>
            </button>
            <button
              className={`py-3 px-1 border-b-2 ${
                activeTab === 'users'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'sites' && <TenantSites tenant={tenant} />}
        {activeTab === 'pricing' && <TenantPricing tenant={tenant} />}
        {activeTab === 'users' && <TenantUsers tenant={tenant} />}
      </main>
    </div>
  );
}