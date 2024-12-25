import React from 'react';
import { UserPlus } from 'lucide-react';
import { CampersList } from '../components/CampersList';

export function CampersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Campers</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <UserPlus className="h-5 w-5" />
          Add camper
        </button>
      </div>
      <CampersList />
    </div>
  );
}