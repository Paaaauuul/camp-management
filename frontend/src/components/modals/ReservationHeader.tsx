import React from 'react';
import { X, User, Users, UserMinus, RefreshCw } from 'lucide-react';

interface ReservationHeaderProps {
  onClose: () => void;
}

export function ReservationHeader({ onClose }: ReservationHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">New reservation type</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { icon: User, label: 'Single', active: true },
          { icon: RefreshCw, label: 'Recurring' },
          { icon: Users, label: 'Group' },
          { icon: UserMinus, label: 'Blocked' },
        ].map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            className={`flex flex-col items-center p-4 rounded-lg border-2 ${
              active 
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Icon className={`h-6 w-6 ${active ? 'text-green-500' : 'text-gray-500'}`} />
            <span className={`mt-2 text-sm ${active ? 'text-green-700' : 'text-gray-600'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}