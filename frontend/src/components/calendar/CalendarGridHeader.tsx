import React from 'react';
import { format } from 'date-fns';

interface CalendarGridHeaderProps {
  days: Date[];
}

export function CalendarGridHeader({ days }: CalendarGridHeaderProps) {
  return (
    <thead>
      <tr>
        {days.map((day) => (
          <th
            key={day.toString()}
            className="border-b border-r border-gray-200 bg-gray-50 p-3 text-left min-w-[120px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-normal text-gray-500">
                {format(day, 'MMM')}
              </span>
              <div className="flex items-baseline space-x-1">
                <span className="font-semibold">{format(day, 'd')}</span>
                <span className="text-sm text-gray-500">{format(day, 'EEE')}</span>
              </div>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}