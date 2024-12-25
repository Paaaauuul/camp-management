import React from 'react';

interface VehicleInfoFormProps {
  formData: {
    license_plate: string;
    vehicle_type: string;
    vehicle_length: string;
    vehicle_electric: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function VehicleInfoForm({ formData, onChange }: VehicleInfoFormProps) {
  return (
    <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium">Vehicle info</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            License Plate
          </label>
          <input
            type="text"
            name="license_plate"
            value={formData.license_plate}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Rig Type
          </label>
          <input
            type="text"
            name="vehicle_type"
            value={formData.vehicle_type}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Rig Length
          </label>
          <input
            type="text"
            name="vehicle_length"
            value={formData.vehicle_length}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Electric
          </label>
          <input
            type="text"
            name="vehicle_electric"
            value={formData.vehicle_electric}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}