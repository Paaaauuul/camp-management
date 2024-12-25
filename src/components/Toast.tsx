import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'error', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      // Add fade-out class before closing
      const element = document.getElementById('toast');
      if (element) {
        element.classList.add('fade-out');
        // Wait for animation to complete before closing
        setTimeout(onClose, 300);
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center">
      <div
        id="toast"
        className={clsx(
          'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
          'animate-in fade-in duration-300 opacity-100 transition-opacity',
          'transform translate-y-0 transition-transform',
          type === 'error' && 'bg-red-50 text-red-800 border border-red-200',
          type === 'success' && 'bg-green-50 text-green-800 border border-green-200',
          type === 'info' && 'bg-blue-50 text-blue-800 border border-blue-200'
        )}
      >
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            const element = document.getElementById('toast');
            if (element) {
              element.classList.add('fade-out');
              setTimeout(onClose, 300);
            }
          }}
          className={clsx(
            'p-1 rounded-full hover:bg-white/20',
            'transition-colors duration-200'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}