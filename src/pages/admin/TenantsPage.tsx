import React from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TenantsList } from '../../components/admin/TenantsList';
import { TenantDetails } from '../../components/admin/TenantDetails';
import { CreateTenantModal } from '../../components/admin/CreateTenantModal';
import { getTenants } from '../../lib/admin';

export function TenantsPage() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [tenants, setTenants] = React.useState<any[]>([]);
  const { tenantId } = useParams();

  React.useEffect(() => {
    async function loadTenants() {
      try {
        const data = await getTenants();
        setTenants(data);
      } catch (error) {
        console.error('Error loading tenants:', error);
      }
    }

    loadTenants();
  }, []);

  const selectedTenant = tenantId 
    ? tenants.find(t => t.id === parseInt(tenantId))
    : null;

  return (
    <div className="space-y-6">
      {selectedTenant ? (
        <TenantDetails tenant={selectedTenant} />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Campgrounds</h1>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Campground
            </button>
          </div>

          <TenantsList />
        </>
      )}

      <CreateTenantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}