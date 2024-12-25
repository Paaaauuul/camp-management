import React from 'react';
import { Mail, MessageSquare, Ban, Check } from 'lucide-react';
import clsx from 'clsx';

type NotificationMethod = 'none' | 'email' | 'sms' | 'both';

interface ReservationFooterProps { 
  error: string | null;
  isSubmitting: boolean;
  notificationMethod: NotificationMethod;
  hasEmail: boolean;
  hasPhone: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onNotificationMethodChange: (method: NotificationMethod) => void;
}

interface NotificationOption {
  value: NotificationMethod;
  label: string;
  icon: React.ElementType;
  disabled?: boolean;
}

export function ReservationFooter({ 
  error, 
  isSubmitting, 
  notificationMethod,
  hasEmail,
  hasPhone,
  onClose, 
  onSubmit,
  onNotificationMethodChange
}: ReservationFooterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const options: NotificationOption[] = [
    { 
      value: 'none', 
      label: 'Not sending confirmation', 
      icon: Ban 
    },
    { 
      value: 'email', 
      label: 'Email confirmation', 
      icon: Mail,
      disabled: !hasEmail
    },
    { 
      value: 'sms', 
      label: 'Text confirmation', 
      icon: MessageSquare,
      disabled: !hasPhone
    },
    { 
      value: 'both', 
      label: 'Email & text confirmation', 
      icon: MessageSquare,
      disabled: !hasEmail || !hasPhone
    }
  ];

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === notificationMethod);

  const handleSelect = (method: NotificationMethod) => {
    if (options.find(opt => opt.value === method)?.disabled) {
      return;
    }
    onNotificationMethodChange(method);
    setIsOpen(false);
  };

  const getWarningMessage = () => {
    if (notificationMethod === 'email' && !hasEmail) {
      return 'Email confirmation requires a valid email address';
    }
    if (notificationMethod === 'sms' && !hasPhone) {
      return 'SMS confirmation requires a valid phone number';
    }
    if (notificationMethod === 'both' && (!hasEmail || !hasPhone)) {
      return 'Both confirmation methods require valid email and phone';
    }
    return null;
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {error && (
        <div className="px-4 py-2 mb-4 text-sm text-red-800 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
            >
              {selectedOption && (
                <>
                  <selectedOption.icon className="h-4 w-4 text-gray-500" />
                  <span>{selectedOption.label}</span>
                </>
              )}
            </button>

            {isOpen && (
              <div className="absolute left-0 bottom-full mb-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    disabled={option.disabled}
                    className={clsx(
                      'w-full px-4 py-2 text-left flex items-center gap-3',
                      'hover:bg-gray-50 transition-colors relative',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                      notificationMethod === option.value && 'bg-gray-50'
                    )}
                  >
                    <option.icon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{option.label}</span>
                    {notificationMethod === option.value && (
                      <Check className="h-4 w-4 text-green-500 absolute right-4" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {getWarningMessage() && (
            <span className="text-sm text-orange-500">
              {getWarningMessage()}
            </span>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className={clsx(
              'px-4 py-2 bg-blue-600 text-white rounded-md',
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            )}
          >
            {isSubmitting ? 'Creating...' : 'Create reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}