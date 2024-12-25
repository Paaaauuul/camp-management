import { useState } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { Booking, Reservation } from '../types';
import { updateBooking, updateReservation } from '../lib/queries';

interface UseCalendarResizeProps {
  bookings: Booking[];
  reservations: Reservation[];
  onBookingUpdate?: () => void;
  onError: (message: string) => void;
}

export function useCalendarResize({
  bookings,
  reservations,
  onBookingUpdate,
  onError
}: UseCalendarResizeProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizing, setResizing] = useState<{
    booking: Booking | Reservation;
    edge: 'start' | 'end';
    initialX: number;
    initialDate: Date;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    item: Booking | Reservation,
    edge: 'start' | 'end'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Early return if trying to resize a checked out booking
    if (!('status' in item) && item.check_in_status === 'checked_out') {
      onError('Cannot modify a checked out booking');
      return;
    }
    
    setIsResizing(true);
    
    const initialX = e.clientX;
    const initialDate = edge === 'start' 
      ? parseISO(item.start_date)
      : parseISO(item.end_date);
    
    setResizing({ booking: item, edge, initialX, initialDate });

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;

      const deltaX = e.clientX - initialX;
      const daysDelta = Math.round(deltaX / 120);
      const newDate = addDays(initialDate, daysDelta);
      const formattedDate = format(newDate, 'yyyy-MM-dd');

      const updatePromise = 'status' in item && item.status === 'pending'
        ? updateReservation(item.id, {
            start_date: edge === 'start' ? formattedDate : item.start_date,
            end_date: edge === 'end' ? formattedDate : item.end_date,
            site_id: item.site_id
          })
        : updateBooking(item.id, {
            start_date: edge === 'start' ? formattedDate : item.start_date,
            end_date: edge === 'end' ? formattedDate : item.end_date,
            site_id: item.site_id
          });

      updatePromise.then(() => {
        onBookingUpdate?.();
      }).catch(error => {
        console.error('Error updating booking:', error);
        onError('Failed to update');
      });
    };
    
    const handleMouseUp = () => {
      setResizing(null);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    isResizing,
    resizing,
    handleResizeStart
  };
}