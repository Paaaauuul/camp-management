import React from 'react';
import { Customer } from '../../types';

interface CustomerSummaryProps {
  customer: Customer;
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export function CustomerSummary({ customer, formData }: CustomerSummaryProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {formData.first_name} {formData.last_name}
          </h2>
          <div className="mt-1 space-y-1">
            <a href={`mailto:${formData.email}`} className="block text-gray-600 hover:text-gray-900">
              {formData.email}
            </a>
            <div className="text-gray-600">{formData.phone}</div>
          </div>
        </div>
        <div className="text-gray-600">1 Main st</div>
        <div className="text-gray-600">
          25 ft - Thor, 30A-amp<br />
          License #: LXN1233
        </div>
        <div className="text-gray-600">Prefers site 16 & 17</div>
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold">10/25/2023</div>
            <div className="text-sm text-gray-600">last stayed</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold">5</div>
            <div className="text-sm text-gray-600">bookings</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xl font-semibold">$288.93</div>
            <div className="text-sm text-gray-600">total spent</div>
          </div>
        </div>
      </div>
    </div>
  );
}