import { useState, useRef, useEffect } from 'react';
import { addDays } from 'date-fns';

interface UseNewReservationProps {
  getBookingForDate: (date: Date, siteId: number) => any[];
}

export function useNewReservation({ getBookingForDate }: UseNewReservationProps) {
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; date: Date } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{
    startDate: Date;
    endDate: Date;
    siteId: number;
  } | null>(null);
  const [newReservation, setNewReservation] = useState<{
    startDate: Date;
    endDate: Date;
    siteId: number;
  } | null>(null);
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const dragStartRef = useRef<{ date: Date; siteId: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, date: Date, siteId: number) => {
    if (e.button !== 0) return;

    const existingBookings = getBookingForDate(date, siteId);
    if (existingBookings.length > 0) return;

    setDragStartPosition({ x: e.clientX, date });
    dragStartRef.current = { date, siteId };
  };

  const handleMouseMove = (e: React.MouseEvent, date: Date, siteId: number) => {
    if (!dragStartPosition || !dragStartRef.current) return;

    if ((e.buttons & 1) === 0) {
      handleMouseUp();
      return;
    }

    const dragDistance = e.clientX - dragStartPosition.x;
    const daysDragged = Math.floor(dragDistance / 120) + 1;

    if (!isDraggingNew && Math.abs(daysDragged) >= 1) {
      setIsDraggingNew(true);
      setSelectionBox({
        startDate: dragStartPosition.date,
        endDate: addDays(dragStartPosition.date, 1),
        siteId
      });
    }

    if (isDraggingNew && siteId === dragStartRef.current.siteId) {
      const startDate = dragStartRef.current.date;
      const endDate = addDays(startDate, Math.max(1, daysDragged));

      setSelectionBox({
        startDate,
        endDate,
        siteId
      });
    }
  };

  const handleMouseUp = () => {
    if (isDraggingNew && selectionBox) {
      const startDate = selectionBox.startDate < selectionBox.endDate 
        ? selectionBox.startDate 
        : selectionBox.endDate;
      const endDate = selectionBox.startDate < selectionBox.endDate 
        ? selectionBox.endDate 
        : selectionBox.startDate;

      setNewReservation({
        startDate,
        endDate,
        siteId: selectionBox.siteId
      });
    }
    setIsDraggingNew(false);
    setSelectionBox(null);
    dragStartRef.current = null;
    setDragStartPosition(null);
  };

  useEffect(() => {
    if (isDraggingNew) {
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };
      
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDraggingNew]);

  return {
    newReservation,
    isDraggingNew,
    selectionBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setNewReservation
  };
}