import React from 'react';
import { Edit, CheckSquare, DollarSign, CreditCard, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface ReservationContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onEdit: () => void;
  onConfirm: () => void;
  onAcceptPayment: () => void;
  onDelete: () => void;
}

export function ReservationContextMenu({
  x,
  y,
  onClose,
  onEdit,
  onConfirm,
  onAcceptPayment,
  onDelete
}: ReservationContextMenuProps) {
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

  const menuItems = [
    { icon: Edit, label: 'Edit reservation', onClick: onEdit },
    { icon: DollarSign, label: 'Mark as paid', onClick: onConfirm },
    { icon: CreditCard, label: 'Accept payment', onClick: onAcceptPayment },
    { icon: Trash2, label: 'Delete reservation', onClick: onDelete, danger: true }
  ];

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