import React from 'react';
import { X, MapPin, Calendar, DollarSign, Users, Send } from 'lucide-react';
import { format, parseISO, addDays, startOfToday } from 'date-fns';
import { Booking, Customer, Site } from '../types';
import { updateCustomer, updateBookingDetails, getSites, updateBookingCheckInStatus } from '../lib/queries';
import { DatePicker } from './DatePicker';
import { RangeDatePicker } from './RangeDatePicker';
import clsx from 'clsx';

interface BookingDetailsProps {
  booking: Booking;
  customer: Customer;
  onClose: () => void;
  onUpdate?: () => void;
}

export function BookingDetails({ booking, customer, onClose, onUpdate }: BookingDetailsProps) {
  const createdAt = parseISO(booking.created_at);
  const startDate = parseISO(booking.start_date);
  const endDate = parseISO(booking.end_date);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [formData, setFormData] = React.useState({
    site_id: booking.site_id.toString(),
    amount_owed: booking.amount?.toString() || '0.00',
    amount_paid: '0.00',
    start_date: startDate,
    end_date: endDate,
    first_name: customer.first_name || '',
    last_name: customer.last_name || '',
    email: customer.email || '',
    phone: customer.phone || ''
  });

  // Fetch available sites
  React.useEffect(() => {
    getSites().then(setSites).catch(console.error);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Update booking details
      await updateBookingDetails(booking.id, {
        site_id: parseInt(formData.site_id),
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd')
      });

      // Update customer details
      await updateCustomer(customer.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone
      });

      // Call update callback and close modal
      onUpdate?.();
      onClose();
    } catch (error) {
      console.error('Error updating details:', error);
      alert('Failed to update details');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-[100]" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-xl z-[101] border-l border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Booking for {customer.first_name} {customer.last_name}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Site {booking.site_id}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              </div>
              <span className={clsx(
                'px-2 py-1 rounded-full text-xs font-medium',
                'bg-yellow-100 text-yellow-800'
              )}>
                Unpaid
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Created {format(createdAt, 'M/d/yyyy h:mma')}
            </div>
          </div>

          {/* Reservation Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Booking info</h3>
              {booking.check_in_status === 'pending' && (
                <button 
                  onClick={async () => {
                    try {
                      await updateBookingCheckInStatus(booking.id, 'checked_in');
                      onUpdate?.();
                      onClose();
                    } catch (error) {
                      setError('Failed to check in booking');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Check in
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Number <span className="text-red-500">*</span>
                </label>
                <select
                  name="site_id"
                  value={formData.site_id}
                  onChange={handleSelectChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={formData.start_date}
                    onSelect={(date) => {
                      setFormData(prev => {
                        // If end date is before new start date, adjust it
                        if (prev.end_date < date) {
                          return {
                            ...prev,
                            start_date: date,
                            end_date: addDays(date, 1)
                          };
                        }
                        return { ...prev, start_date: date };
                      });
                    }}
                    minDate={startOfToday()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure <span className="text-red-500">*</span>
                  </label>
                  <RangeDatePicker
                    selected={formData.end_date}
                    onSelect={(date) => {
                      setFormData(prev => ({
                        ...prev,
                        end_date: date
                      }));
                    }}
                    startDate={formData.start_date}
                    minDate={addDays(formData.start_date, 1)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Payment info</h3>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <DollarSign className="h-4 w-4" />
                Pay now
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount owed
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="text"
                    name="amount_owed"
                    value={formData.amount_owed}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-12 py-2"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">USD</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount paid
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="text"
                    name="amount_paid"
                    value={formData.amount_paid}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-lg pl-7 pr-12 py-2"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* Camper Info */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Camper info</h3>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <Send className="h-4 w-4" />
                Send Message
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Fixed bottom bar */}
        <div className="border-t border-gray-200 p-4 bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Remove
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}