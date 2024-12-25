import React from 'react';

export function CampersTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </th>
              <th className="text-left py-3 px-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
              </th>
              <th className="text-left py-3 px-4">
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
              </th>
              <th className="text-left py-3 px-4">
                <div className="h-6 w-32 bg-gray-200 rounded"></div>
              </th>
              <th className="text-right py-3 px-4">
                <div className="h-6 w-20 bg-gray-200 rounded ml-auto"></div>
              </th>
              <th className="text-left py-3 px-4">
                <div className="h-6 w-28 bg-gray-200 rounded"></div>
              </th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 px-4">
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-48 bg-gray-200 rounded"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-32 bg-gray-200 rounded"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-16 bg-gray-200 rounded"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-20 bg-gray-200 rounded ml-auto"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-24 bg-gray-200 rounded"></div>
                </td>
                <td className="py-3 px-4">
                  <div className="h-5 w-5 bg-gray-200 rounded"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}