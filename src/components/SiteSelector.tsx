import React from 'react';
import { Site, Booking } from '../types';
import { Tent } from 'lucide-react';
import { parseISO, isBefore, isAfter, isEqual, format } from 'date-fns';
import clsx from 'clsx';

interface SiteSelectorProps {
  sites: Site[];
  bookings: Booking[];
  reservations?: Reservation[];
  selectedSiteId: number | null;
  dates: {
    startDate?: Date;
    endDate?: Date;
  };
  onSiteSelect: (siteId: number) => void;
  className?: string;
}

export function SiteSelector({ 
  sites, 
  bookings, 
  reservations = [],
  selectedSiteId, 
  dates,
  onSiteSelect,
  className 
}: SiteSelectorProps) {
  // Check if a site is available for the selected date range
  const isSiteAvailable = (siteId: number) => {
    if (!dates.startDate || !dates.endDate) return true;
    
    const selectedStart = format(dates.startDate, 'yyyy-MM-dd');
    const selectedEnd = format(dates.endDate, 'yyyy-MM-dd');

    // Filter bookings for this site
    const siteBookings = bookings.filter(booking => booking.site_id === siteId);
    const siteReservations = reservations.filter(reservation => reservation.site_id === siteId);
    
    // Helper function to check date overlap
    const hasDateOverlap = (start1: string, end1: string, start2: string, end2: string) => {
      // Allow bookings to end on the same day another starts
      if (end1 === start2 || end2 === start1) {
        return false;
      }
      
      return start1 < end2 && end1 > start2;
    };

    // Check existing bookings
    const hasBookingOverlap = siteBookings.some(booking => {
      return hasDateOverlap(
        selectedStart,
        selectedEnd,
        booking.start_date,
        booking.end_date
      );
    });
    
    // Check pending reservations
    const hasReservationOverlap = siteReservations.some(reservation => {
      return hasDateOverlap(
        selectedStart,
        selectedEnd,
        reservation.start_date,
        reservation.end_date
      );
    });
    
    return !hasBookingOverlap && !hasReservationOverlap;
  };

  // Filter available sites
  const availableSites = sites.filter(site => isSiteAvailable(site.id));

  return (
    <div className={clsx("relative", className)}>
      <select
        value={selectedSiteId || ''}
        onChange={(e) => onSiteSelect(Number(e.target.value))}
        className="w-full border border-gray-300 rounded-md p-2 pr-8 appearance-none bg-white"
      >
        <option value="">Select a site</option>
        {availableSites.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <Tent className="h-4 w-4 text-gray-400" />
      </div>
      {availableSites.length === 0 && dates.startDate && dates.endDate && (
        <p className="mt-2 text-sm text-red-600">
          No sites available for the selected dates
        </p>
      )}
    </div>
  );
}