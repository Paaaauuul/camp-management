import React from 'react';
import { Tent } from 'lucide-react';

export function SkeletonCalendar() {
  const daysArray = Array.from({ length: 14 });
  const sitesArray = Array.from({ length: 8 });

  return (
    <div className="bg-white p-4 overflow-hidden animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="inline-flex items-center rounded-md px-3 py-1.5 bg-gray-200 w-32 h-8"></div>
          <div className="bg-gray-200 h-9 w-40 rounded-md ml-auto"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="bg-gray-200 h-7 w-64 rounded"></div>
          <div className="flex items-center space-x-2">
            <div className="bg-gray-200 h-[34px] w-[140px] rounded-md"></div>
            <div className="bg-gray-200 h-[34px] w-[72px] rounded-md"></div>
            <div className="bg-gray-200 h-[34px] w-[34px] rounded-md"></div>
            <div className="bg-gray-200 h-[34px] w-[34px] rounded-md"></div>
            <div className="bg-gray-200 h-[34px] w-[72px] rounded-md"></div>
            <div className="bg-gray-200 h-[34px] w-[84px] rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Calendar Grid Skeleton */}
      <div className="relative">
        {/* Fixed left column */}
        <div className="absolute left-0 top-0 z-20 w-[200px] bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 text-left font-bold min-w-[200px]">
                  <div className="flex items-center h-[44px] pl-2">
                    <div className="bg-gray-200 h-5 w-8 rounded"></div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sitesArray.map((_, index) => (
                <tr key={index}>
                  <td className="border-b border-r border-gray-200 bg-gray-50 p-3">
                    <div className="flex items-center space-x-2 h-[23px]">
                      <Tent className="h-5 w-5 text-gray-300" />
                      <div className="bg-gray-200 h-5 w-20 rounded"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Scrollable calendar grid */}
        <div className="overflow-x-auto ml-[200px]">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {daysArray.map((_, index) => (
                  <th
                    key={index}
                    className="border-b border-r border-gray-200 bg-gray-50 p-3 text-left min-w-[120px]"
                  >
                    <div className="flex flex-col">
                      <div className="bg-gray-200 h-4 w-10 rounded"></div>
                      <div className="flex items-baseline space-x-1 mt-1">
                        <div className="bg-gray-200 h-5 w-6 rounded"></div>
                        <div className="bg-gray-200 h-4 w-8 rounded"></div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sitesArray.map((_, siteIndex) => (
                <tr key={siteIndex}>
                  {daysArray.map((_, dayIndex) => (
                    <td
                      key={dayIndex}
                      className="border-b border-r border-gray-200 p-1 h-[48px] relative"
                    >
                      {/* Random skeleton bookings */}
                      {Math.random() > 0.7 && (
                        <div 
                          className="absolute bg-gray-200 rounded h-[40px] top-1"
                          style={{
                            left: '55%',
                            width: '115px'
                          }}
                        ></div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}