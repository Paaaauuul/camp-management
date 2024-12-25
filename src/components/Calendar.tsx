import React, { useEffect, useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { format, addDays, startOfToday, subWeeks, addWeeks } from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { Site, Booking } from '../types';
import { getSites, getBookings } from '../lib/queries';
import { useInterval } from '../hooks/useInterval';
import { SiteGroupProvider } from '../contexts/SiteGroupContext';
import { SkeletonCalendar } from './SkeletonCalendar';
import { useCalendarData } from '../hooks/useCalendarData';

export function Calendar() {
  // Ref for the scrollable calendar container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State for selected date and date range
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfToday());

  // Memoize calendar structure based on selected date
  const { days, startDate, endDate } = useMemo(() => {
    const start = subWeeks(selectedDate, 3);
    const end = addWeeks(selectedDate, 3);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      days: Array.from({ length: totalDays }, (_, i) => addDays(start, i)),
      startDate: start,
      endDate: end
    };
  }, [selectedDate]);

  // Use custom hook for data management
  const {
    sites, bookings, loading, error,
    hasData, refreshData, reservations
  } = useCalendarData(days);

  // Navigation callbacks
  const handleTodayClick = useCallback(() => {
    setSelectedDate(startOfToday());
  }, []);

  // Function to handle navigation to previous week
  const handlePreviousWeek = useCallback(() => {
    setSelectedDate(date => subWeeks(date, 1));
  }, []);

  // Function to handle navigation to next week
  const handleNextWeek = useCallback(() => {
    setSelectedDate(date => addWeeks(date, 1));
  }, []);

  // Function to handle date selection from the date picker
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  useLayoutEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer && !loading) {
      const dayWidth = 120; // Fixed width for each day column in pixels
      const selectedIndex = days.findIndex(day => 
        format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
      );
      
      if (selectedIndex !== -1) {
        // Center the selected date by scrolling to its position minus one day
        scrollContainer.scrollLeft = dayWidth * (selectedIndex - 1);
      }
    }
  }, [days, loading, selectedDate]);

  // Loading state UI
  if (loading) {
    return (
      <SkeletonCalendar />
    );
  }

  // Error state UI
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-md">
        <div className="flex flex-col space-y-2">
          <p className="text-red-800 font-medium">Error loading data</p>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="self-start px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main calendar UI
  return (
    <div className="bg-white p-4 overflow-hidden">
      <SiteGroupProvider>
        <CalendarHeader 
          startDate={days[0]} 
          endDate={days[days.length - 1]} 
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          hasData={hasData}
          onTodayClick={handleTodayClick}
          onPreviousWeek={handlePreviousWeek}
          onNextWeek={handleNextWeek}
          onReservationCreated={refreshData}
        />
        <CalendarGrid 
          ref={scrollContainerRef}
          days={days} 
          sites={sites} 
          bookings={bookings}
          reservations={reservations}
          onBookingUpdate={() => refreshData()}
        />
      </SiteGroupProvider>
    </div>
  );
}