import React, { useState, useEffect } from 'react';
import { X, User, Users, UserMinus, RefreshCw } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { DatePicker } from '../DatePicker';
import { RangeDatePicker } from '../RangeDatePicker';
import { SiteSelector } from '../SiteSelector';
import { getSites, getBookings, getReservations } from '../../lib/queries';
import { createCustomerWithReservation } from '../../lib/reservation';
import { Site, Booking, Reservation } from '../../types';
import { ReservationFooter } from './ReservationFooter';
import { ReservationHeader } from './ReservationHeader';
import { useReservationForm } from '../../hooks/useReservationForm';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    startDate: Date;
    endDate: Date;
    siteId: number;
  };
  onReservationCreated?: () => void;
}

export function ReservationModal({ 
  isOpen, 
  onClose, 
  initialData, 
  onReservationCreated 
}: ReservationModalProps) {
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'sms' | 'both'>('email');
  const {
    formData,
    dates,
    selectedSiteId,
    sites,
    bookings,
    reservations,
    loading,
    error,
    isSubmitting,
    handleInputChange,
    handleDateChange,
    handleSiteSelect,
    handleSubmit
  } = useReservationForm({
    initialData,
    onClose,
    onReservationCreated
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-[800px] flex flex-col max-h-[90vh]">
        <ReservationHeader onClose={onClose} />

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arrival <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    selected={dates.startDate}
                    onSelect={(date) => handleDateChange('startDate', date)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departure <span className="text-red-500">*</span>
                  </label>
                  <RangeDatePicker
                    selected={dates.endDate}
                    onSelect={(date) => handleDateChange('endDate', date)}
                    startDate={dates.startDate}
                    minDate={dates.startDate ? addDays(dates.startDate, 1) : undefined}
                  />
                </div>
              </div>

              {/* Site Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Number <span className="text-red-500">*</span>
                </label>
                <SiteSelector
                  sites={sites}
                  bookings={bookings}
                  reservations={reservations}
                  selectedSiteId={selectedSiteId}
                  onSiteSelect={handleSiteSelect}
                  dates={dates}
                />
                {loading && (
                  <p className="mt-2 text-sm text-gray-500">Loading available sites...</p>
                )}
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-medium mb-2">Customer info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md p-2"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded-md p-2"
                ></textarea>
              </div>
            </div>

            {/* Right Column - Pricing */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subtotal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md pl-7 pr-12 py-2"
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-2.5 text-gray-500">USD</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>{selectedSiteId ? `$${formData.amount} x ${dates.startDate && dates.endDate ? 
                    differenceInDays(dates.endDate, dates.startDate) : 0} nights` : 'Select a site to see pricing'}</span>
                  <span>${formData.amount}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${selectedSiteId ? formData.amount : '0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ReservationFooter
          error={error}
          isSubmitting={isSubmitting}
          notificationMethod={notificationMethod}
          hasEmail={!!formData.email}
          hasPhone={!!formData.phone}
          onClose={onClose}
          onSubmit={handleSubmit}
          onNotificationMethodChange={setNotificationMethod}
        />
      </div>
    </div>
  );
}