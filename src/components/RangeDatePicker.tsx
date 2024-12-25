import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, DayClickEventHandler } from 'react-day-picker';
import { format, startOfToday, addDays } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import 'react-day-picker/dist/style.css';
import clsx from 'clsx';

interface RangeDatePickerProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  startDate?: Date;
  minDate?: Date;
  className?: string;
}

export function RangeDatePicker({ 
  selected, 
  onSelect, 
  startDate,
  minDate,
  className 
}: RangeDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewRange, setPreviewRange] = useState<{ from: Date; to: Date } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const today = startOfToday();

  // Format the display date
  const displayDate = selected ? format(selected, 'MMM d, yyyy') : 'Select departure date';

  // Handle mouse enter on days
  const handleDayMouseEnter: DayClickEventHandler = (day) => {
    if (startDate) {
      setPreviewRange({ from: startDate, to: day });
    }
  };

  // Handle mouse leave
  const handleDayMouseLeave = () => {
    setPreviewRange(null);
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

  // Custom CSS for the range preview
  const css = `
    .rdp-day_range_middle {
      border-radius: 0;
      background-color: rgb(243 244 246) !important;
      color: rgb(17 24 39) !important;
    }

    .rdp-day_range_start,
    .rdp-day_range_end {
      border-radius: 9999px !important;
      color: white !important;
      background-color: rgb(37 99 235) !important;
    }

    .rdp-day_range_preview {
      background-color: rgb(243 244 246) !important;
      color: rgb(17 24 39) !important;
    }

    .rdp-day_start {
      background-color: rgb(37 99 235) !important;
      color: white !important;
      border-radius: 9999px !important;
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
            mode="single"
            selected={selected}
            disabled={{ before: minDate || today }}
            defaultMonth={selected || startDate || new Date()}
            onSelect={(date) => {
              if (date) {
                onSelect(date);
                setIsOpen(false);
              }
            }}
            modifiers={{
              start: startDate ? [startDate] : [],
              range_preview: previewRange ? [
                { from: previewRange.from, to: previewRange.to }
              ] : []
            }}
            modifiersClassNames={{
              start: 'rdp-day_start',
              range_preview: 'rdp-day_range_preview'
            }}
            onDayMouseEnter={handleDayMouseEnter}
            onDayMouseLeave={handleDayMouseLeave}
            className="p-2"
          />
        </div>
      )}
    </div>
  );
}