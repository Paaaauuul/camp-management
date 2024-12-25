import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfToday } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import clsx from 'clsx';

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  minDate?: Date;
  className?: string;
}

export function DatePicker({ selected, onSelect, minDate, className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = startOfToday();

  // Set the default month to the selected date's month
  const defaultMonth = selected || new Date();

  // Format the display date
  const displayDate = selected ? format(selected, 'MMM d, yyyy') : 'Select arrival date';

  // Handle clicks outside of the date picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    // Add event listener when the picker is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
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
            mode="single"
            selected={selected}
            disabled={{ before: minDate || today }}
            defaultMonth={defaultMonth}
            onSelect={(date) => {
              if (date) {
                onSelect(date);
                setIsOpen(false);
              } 
            }}
            className="p-2"
          />
        </div>
      )}
    </div>
  );
}