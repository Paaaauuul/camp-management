import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';
import { DatePicker } from './DatePicker';
import { ReservationModal } from './modals/ReservationModal';

// Memoize the header component to prevent unnecessary re-renders
interface CalendarHeaderProps {
  startDate: Date;
  endDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  hasData: boolean;
  onTodayClick: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onReservationCreated?: () => void;
}

export const CalendarHeader = React.memo(function CalendarHeader({ 
  startDate, 
  endDate, 
  selectedDate,
  onDateSelect,
  hasData, 
  onTodayClick,
  onPreviousWeek,
  onNextWeek,
  onReservationCreated
}: CalendarHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className={clsx(
          "inline-flex items-center rounded-md px-3 py-1.5",
          hasData ? "bg-green-50" : "bg-red-50"
        )}>
          <div className={clsx(
            "h-2 w-2 rounded-full mr-2 transition-all",
            hasData ? "bg-green-500 animate-[pulse-green_2s_ease-in-out_infinite]" : "bg-red-500"
          )}></div>
          <span className={clsx(
            "text-sm",
            hasData ? "text-green-700" : "text-red-700"
          )}>Live updates: {hasData ? "on" : "off"}</span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create reservation
        </button>
        <ReservationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onReservationCreated={onReservationCreated}
        />
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')}
        </h1>
        <div className="flex items-center gap-2 ml-auto">
          <DatePicker
            selected={selectedDate}
            onSelect={onDateSelect}
            className="w-[140px] ml-auto"
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={onTodayClick}
              className="border rounded-md px-3 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1">
              <button 
                onClick={onPreviousWeek}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button 
                onClick={onNextWeek}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});