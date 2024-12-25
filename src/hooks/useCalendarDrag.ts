import { useState, useRef } from 'react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import clsx from 'clsx';
import { Booking, Reservation } from '../types';
import { updateBooking, updateReservation } from '../lib/queries';

interface UseCalendarDragProps {
  bookings: Booking[];
  reservations: Reservation[];
  onBookingUpdate?: () => void;
  onError: (message: string) => void;
}

export function useCalendarDrag({
  bookings,
  reservations,
  onBookingUpdate,
  onError
}: UseCalendarDragProps) {
  const [draggedItem, setDraggedItem] = useState<Booking | Reservation | null>(null);
  const [dragOverInfo, setDragOverInfo] = useState<{ date: Date; siteId: number } | null>(null);

  const handleDragStart = (item: Booking | Reservation, e: React.DragEvent) => {
    // Prevent dragging checked out bookings
    if (!('status' in item) && item.check_in_status === 'checked_out') {
      e.preventDefault();
      onError('Cannot modify a checked out booking');
      return;
    }
    
    setDraggedItem(item);
    
    const ghostElement = document.createElement('div');
    ghostElement.className = clsx(
      'absolute rounded p-1 z-10 h-[40px]',
      'status' in item
        ? 'bg-white border-2 border-green-600 text-black'
        : item.check_in_status === 'checked_out'
          ? 'bg-gray-200 text-gray-500'
          : item.check_in_status === 'checked_in'
            ? 'bg-green-800 text-white'
            : 'bg-green-100 border-2 border-green-600 text-black'
    );
    ghostElement.style.width = `${(differenceInDays(parseISO(item.end_date), parseISO(item.start_date)) * 120) - 5}px`;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'text-sm font-medium line-clamp-2 h-full flex items-center pl-2 select-none';
    nameSpan.textContent = item.customers?.last_name || '';
    ghostElement.appendChild(nameSpan);
    
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 60, 20);
    requestAnimationFrame(() => document.body.removeChild(ghostElement));
  };

  const handleDragOver = (e: React.DragEvent, date: Date, siteId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!dragOverInfo || 
        dragOverInfo.date.getTime() !== date.getTime() || 
        dragOverInfo.siteId !== siteId) {
      setDragOverInfo({ date, siteId });
    }
  };

  const handleDrop = async (e: React.DragEvent, dropDate: Date, dropSiteId: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    if (draggedItem.site_id === dropSiteId && 
        format(dropDate, 'yyyy-MM-dd') === draggedItem.start_date) {
      setDraggedItem(null);
      setDragOverInfo(null);
      return;
    }

    const originalStart = parseISO(draggedItem.start_date);
    const originalEnd = parseISO(draggedItem.end_date);
    const bookingDuration = differenceInDays(originalEnd, originalStart);
    
    const newStartDate = format(dropDate, 'yyyy-MM-dd');
    const newEndDate = format(addDays(dropDate, bookingDuration), 'yyyy-MM-dd');

    try {
      if ('status' in draggedItem && draggedItem.status === 'pending') {
        await updateReservation(draggedItem.id, {
          start_date: newStartDate,
          end_date: newEndDate,
          site_id: dropSiteId
        });
      } else {
        await updateBooking(draggedItem.id, {
          start_date: newStartDate,
          end_date: newEndDate,
          site_id: dropSiteId
        });
      }
      
      onBookingUpdate?.();
    } catch (error) {
      console.error('Error updating booking:', error);
      onError('Failed to move. Please try again.');
    }

    setDraggedItem(null);
    setDragOverInfo(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverInfo(null);
  };

  return {
    draggedItem,
    dragOverInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  };
}