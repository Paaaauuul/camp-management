import React from 'react';
import { Plus, Mail, User } from 'lucide-react';
import { getTenantUsers, createTenantUser } from '../../../lib/admin';
import { CreateUserModal } from './CreateUserModal';

interface TenantUsersProps {
  tenant: {
    id: number;
    name: string;
  };
}

interface TenantUser {
  id: number;
  role: 'admin' | 'owner' | 'employee';
  users: {
    email: string;
    user_metadata: {
      first_name?: string;
      last_name?: string;
    };
  };
}

export function TenantUsers({ tenant }: TenantUsersProps) {
  const [users, setUsers] = React.useState<TenantUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getTenantUsers(tenant.id);
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [tenant.id]);

  const handleCreateUser = async (email: string, role: 'admin' | 'owner' | 'employee') => {
    try {
      const newUser = await createTenantUser(tenant.id, email, role);
      setUsers(prev => [...prev, newUser]);
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
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

      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add User
        </button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {users.map((user) => (
          <div key={user.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {user.users.user_metadata.first_name
                      ? `${user.users.user_metadata.first_name} ${user.users.user_metadata.last_name}`
                      : user.users.email}
                  </h3>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {user.users.email}
                    </span>
                    <span className="capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}