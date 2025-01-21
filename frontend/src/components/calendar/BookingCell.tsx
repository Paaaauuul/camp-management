import React from 'react';
import { parseISO, isSameDay } from 'date-fns';
import { CheckSquare, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Booking, Reservation } from '../../types';

interface BookingCellProps {
  booking: Booking | Reservation;
  day: Date;
  siteId: number;
  width: number;
  isDragging: boolean;
  isResizing: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onResizeStart: (e: React.MouseEvent, edge: 'start' | 'end') => void;
}

export function BookingCell({
  booking,
  day,
  siteId,
  width,
  isDragging,
  isResizing,
  onDragStart,
  onDragEnd,
  onContextMenu,
  onDoubleClick,
  onResizeStart
}: BookingCellProps) {
  if (!isSameDay(parseISO(booking.start_date), day)) {
    return null;
  }

  return (
    <div 
      className={clsx(
        "absolute rounded p-1 z-10 h-[40px] transition-opacity",
        'group/booking',
        'status' in booking
          ? 'bg-white border-2 border-green-600 text-black hover:bg-green-50'
          : booking.check_in_status === 'checked_out'
            ? 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            : booking.check_in_status === 'checked_in'
              ? 'bg-green-800 text-white hover:bg-green-900'
              : 'bg-green-100 border-2 border-green-600 text-black hover:bg-green-200',
        // Handle cursor states
        !('status' in booking) && booking.check_in_status === 'checked_out'
          ? 'cursor-not-allowed'
          : isDragging
            ? "cursor-grabbing opacity-50"
            : "cursor-grab",
        isResizing && "pointer-events-none"
      )}
      draggable={!('status' in booking) ? booking.check_in_status !== 'checked_out' : true}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onContextMenu={(e) => {
        // Prevent context menu for checked out bookings
        if (!('status' in booking) && booking.check_in_status === 'checked_out') {
          e.preventDefault();
          return;
        }
        onContextMenu(e);
      }}
      onDoubleClick={onDoubleClick}
      style={{ 
        left: '55%',
        width: `${width}px`,
        top: '4px'
      }}
      title={!('status' in booking) && booking.check_in_status === 'checked_out' 
        ? "Cannot modify a checked out booking"
        : "Drag to move booking"}
    >
      {/* Only show resize handles if booking is not checked out */}
      {('status' in booking || booking.check_in_status !== 'checked_out') && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize resize-handle opacity-0 group-hover/booking:opacity-100 transition-opacity"
            onMouseDown={(e) => onResizeStart(e, 'start')}
            title="Drag to change start date"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 opacity-50" />
          </div>
          <div 
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize resize-handle opacity-0 group-hover/booking:opacity-100 transition-opacity"
            onMouseDown={(e) => onResizeStart(e, 'end')}
            title="Drag to change end date"
          >
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-600 opacity-50" />
          </div>
        </>
      )}
      <span className={clsx(
        "text-sm font-medium line-clamp-2 h-full flex items-center pl-2 select-none",
        !('status' in booking) && booking.check_in_status === 'pending' ? 'text-black' : ''
      )}>
        {booking?.customers?.last_name || ''}
      </span>
      {'status' in booking ? null : (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {booking.check_in_status === 'checked_in' ? (
            <CheckSquare className="h-4 w-4 text-white" />
          ) : booking.check_in_status === 'checked_out' ? (
            <LogOut className="h-4 w-4 text-gray-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gray-600" />
          )}
        </div>
      )}
    </div>
  );
}