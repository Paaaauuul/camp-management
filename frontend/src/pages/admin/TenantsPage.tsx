import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { TenantsList } from "../../components/admin/TenantsList";
import { TenantDetails } from "../../components/admin/TenantDetails";
import { CreateTenantModal } from "../../components/admin/CreateTenantModal";
import { getTenants } from "@backend/admin";

interface Tenant {
    id: number;
    name: string;
    slug: string;
    domain: string | null;
    created_at: string;
    site_count: number;
    user_count: number;
}

export function TenantsPage() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const { tenantId } = useParams();

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const data = await getTenants();
            setTenants(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load tenants"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const selectedTenant = tenantId
        ? tenants.find((t) => t.id === parseInt(tenantId))
        : null;

    const handleCreateSuccess = async () => {
        setIsModalOpen(false);
        await loadTenants(); // Refresh the list after successful creation
    };

    return (
        <div className="space-y-6">
            {selectedTenant ? (
                <TenantDetails tenant={selectedTenant} />
            ) : (
                <>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Campgrounds
                        </h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="h-5 w-5" />
                            Add Campground
                        </button>
                    </div>

                    <TenantsList
                        tenants={tenants}
                        loading={loading}
                        error={error}
                    />
                </>
            )}

            <CreateTenantModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleCreateSuccess}
            />
        </div>
    );
}
