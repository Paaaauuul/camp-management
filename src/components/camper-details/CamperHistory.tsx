import React from 'react';
import { format, parseISO } from 'date-fns';
import { Customer } from '../../types';

interface CamperHistoryProps {
  customer: Customer;
}

interface Reservation {
  booked_on: string;
  site: string;
  dates: string;
  amount: number;
  status: 'paid' | 'unpaid';
}

const mockReservations: Reservation[] = [
  {
    booked_on: '2024-01-28',
    site: 'Site 6',
    dates: 'Feb 10th - Feb 12th, 2024',
    amount: 30.00,
    status: 'paid'
  },
  {
    booked_on: '2024-01-28',
    site: 'Site 5',
    dates: 'Feb 10th - Feb 12th, 2024',
    amount: 160.00,
    status: 'paid'
  },
  {
    booked_on: '2024-01-28',
    site: 'Site 4',
    dates: 'Feb 10th - Feb 12th, 2024',
    amount: 30.00,
    status: 'paid'
  },
  {
    booked_on: '2023-10-24',
    site: 'Site 2',
    dates: 'Oct 24th - Oct 25th, 2023',
    amount: 32.40,
    status: 'unpaid'
  },
  {
    booked_on: '2023-06-15',
    site: 'Site 1',
    dates: 'Jun 15th - Jun 17th, 2023',
    amount: 68.93,
    status: 'paid'
  }
];

export function CamperHistory({ customer }: CamperHistoryProps) {
  return (
    <div className="grid grid-cols-[300px,1fr] gap-6">
      {/* Left sidebar with customer summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">
              {customer.first_name} {customer.last_name}
            </h2>
            <div className="mt-1 space-y-1">
              <a href={`mailto:${customer.email}`} className="block text-gray-600 hover:text-gray-900">
                {customer.email}
              </a>
              <div className="text-gray-600">{customer.phone}</div>
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

      {/* Main content */}
      <div>
      <h2 className="text-lg font-medium mb-4">Reservations</h2>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Booked on</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Site</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Dates</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Amount</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockReservations.map((reservation, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0">
                <td className="py-3 px-4">
                  {format(parseISO(reservation.booked_on), 'MM/dd/yyyy')}
                </td>
                <td className="py-3 px-4">{reservation.site}</td>
                <td className="py-3 px-4">{reservation.dates}</td>
                <td className="py-3 px-4 text-right">
                  ${reservation.amount.toFixed(2)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      reservation.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {reservation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}