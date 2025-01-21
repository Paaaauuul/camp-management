import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
  range: DateRange | undefined;
  onRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}
export function DateRangePicker({ range, onRangeChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format the display date range
  const displayDate = range?.from ? (
    range.to ? (
      `${format(range.from, 'MMM d')} - ${format(range.to, 'MMM d, yyyy')}`
    ) : (
      format(range.from, 'MMM d, yyyy')
    )
  ) : (
    'Select dates'
  );

  const handleSelect = (newRange: DateRange | undefined) => {
    if (!newRange) {
      onRangeChange(undefined);
      return;
    }

    // If we have a from date but no to date, keep the picker open
    if (newRange.from && !newRange.to) {
      onRangeChange({ from: newRange.from, to: undefined });
      return;
    }

    // If we have both dates and they're valid
    if (newRange.from && newRange.to && newRange.to >= newRange.from) {
      onRangeChange(newRange);
      setIsOpen(false);
      return;
    }

    // Invalid range (end date before start date)
    onRangeChange(undefined);
  };

  // Handle clicks outside of the date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Custom styles for the date picker
  const css = `
    .rdp-day_selected {
      border-radius: 9999px !important;
    }

    .rdp-day_range_middle {
      border-radius: 0;
      background-color: rgb(243 244 246);
      color: rgb(17 24 39) !important;
    }

    .rdp-day_range_start,
    .rdp-day_range_end {
      border-radius: 9999px !important;
      color: white !important;
      background-color: rgb(37 99 235) !important;
    }
  `;

  return (
    <div className="relative" ref={containerRef}>
      <style>{css}</style>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "border rounded-md px-3 py-1.5 flex items-center justify-between bg-white w-full",
          className
        )}
      >
        <span className="text-sm">{displayDate}</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>
      
      {isOpen && (
        <div className="absolute mt-1 bg-white border rounded-lg shadow-lg z-50">
          <DayPicker
            mode="range"
            defaultMonth={range?.from}
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="p-2"
            modifiersClassNames={{
              selected: 'bg-blue-600 text-white',
              range_start: 'bg-blue-600 text-white rounded-full',
              range_end: 'bg-blue-600 text-white rounded-full',
              range_middle: 'bg-gray-100 text-gray-900',
            }}
          />
        </div>
      )}
    </div>
  );
}