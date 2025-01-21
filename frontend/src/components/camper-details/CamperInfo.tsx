import React from 'react';
import { Customer } from '../../types';
import { RichTextEditor } from './RichTextEditor';
import { CamperInfoForm } from './forms/CamperInfoForm';
import { VehicleInfoForm } from './forms/VehicleInfoForm';
import { CustomerSummary } from './CustomerSummary';

interface CamperInfoProps {
  customer: Customer;
  onSave?: (data: any) => void;
}

export function CamperInfo({ customer, onSave }: CamperInfoProps) {
  const [formData, setFormData] = React.useState({
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    address: '1 Main st',
    license_plate: 'LXN1233',
    vehicle_type: 'Thor',
    vehicle_length: '25 ft',
    vehicle_electric: '30A'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="grid grid-cols-[300px,1fr] gap-6">
      {/* Left sidebar with customer summary */}
      <CustomerSummary customer={customer} formData={formData} />

      {/* Main content */}
      <div className="space-y-6">
        {/* Notes */}
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Notes</h2>
          <RichTextEditor defaultValue="Prefers site 16 & 17" />
        </div>

        <CamperInfoForm formData={formData} onChange={handleChange} />

        <VehicleInfoForm formData={formData} onChange={handleChange} />
      </div>
    </div>
  );
}