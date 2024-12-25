import React from 'react';
import { Edit, CheckSquare, LogOut, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { Booking } from '../types';
import { updateBooking, updateReservation, getCustomerById, markReservationAsPaid, updateBookingCheckInStatus} from '../lib/queries';

interface BookingContextMenuProps {
  x: number;
  y: number;
  booking: Booking;
  onClose: () => void;
  onEdit: () => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onDelete: () => void;
}

export function BookingContextMenu({
  x,
  y,
  booking,
  onClose,
  onEdit,
  onCheckIn,
  onCheckOut,
  onDelete
}: BookingContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Build menu items array based on booking status
  const menuItems = React.useMemo(() => {
    const items = [
      { icon: Edit, label: 'Edit booking', onClick: onEdit }
    ];

    // Add check-in/check-out option based on current status
    if (booking.check_in_status === 'pending') {
      items.push({
        icon: CheckSquare,
        label: 'Mark as checked-in',
        onClick: onCheckIn
      });
    } else if (booking.check_in_status === 'checked_in') {
      items.push({
        icon: LogOut,
        label: 'Mark as checked-out',
        onClick: onCheckOut
      });
    }

    // Always add delete option at the end
    items.push({
      icon: Trash2,
      label: 'Delete booking',
      onClick: onDelete,
      danger: true
    });

    return items;
  }, [booking.check_in_status, onEdit, onCheckIn, onCheckOut, onDelete]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 w-56"
      style={{
        left: x,
        top: y
      }}
    >
      {menuItems.map(({ icon: Icon, label, onClick, danger }, index) => (
        <button
          key={index}
          onClick={() => {
            onClick();
            onClose();
          }}
          className={clsx(
            'w-full px-4 py-2 text-sm flex items-center gap-2',
            'hover:bg-gray-50 transition-colors',
            danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}