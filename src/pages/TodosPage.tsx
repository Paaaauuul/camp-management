import React from 'react';
import { format } from 'date-fns';
import { Calendar, ArrowRight, CheckSquare, LogOut, CreditCard, Tent } from 'lucide-react';
import { getTodayBookings, getCurrentCampers, updateBookingCheckInStatus } from '../lib/queries';
import { Booking } from '../types';
import { Toast } from '../components/Toast';

export function TodosPage() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [currentCampers, setCurrentCampers] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date>(() => new Date());

  const refreshData = React.useCallback(async () => {
    try {
      const [data, campers] = await Promise.all([
        getTodayBookings(),
        getCurrentCampers()
      ]);
      setBookings(data);
      setCurrentCampers(campers);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to refresh data');
    }
  }, []);

  React.useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        await refreshData();
      } catch (error) {
        console.error('Error loading bookings:', error);
        setError('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [selectedDate]);

  const handleCheckIn = async (booking: Booking) => {
    try {
      if (booking.check_in_status === 'checked_in') {
        setError('Booking is already checked in');
        return;
      }
      
      if (booking.check_in_status === 'checked_out') {
        setError('Cannot check in a checked out booking');
        return;
      }

      await updateBookingCheckInStatus(booking.id, 'checked_in');
      await refreshData();
    } catch (error) {
      console.error('Error checking in booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to check in');
    }
  };

  const handleCheckOut = async (booking: Booking) => {
    try {
      if (booking.check_in_status === 'checked_out') {
        setError('Booking is already checked out');
        return;
      }
      
      if (booking.check_in_status === 'pending') {
        setError('Cannot check out a booking that has not been checked in');
        return;
      }

      await updateBookingCheckInStatus(booking.id, 'checked_out');
      await refreshData();
    } catch (error) {
      console.error('Error checking out booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to check out');
    }
  };

  // Filter bookings into check-ins and check-outs
  const checkIns = bookings.filter(booking => 
    format(new Date(booking.start_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
    booking.check_in_status === 'pending'
  );

  const checkOuts = bookings.filter(booking => 
    format(new Date(booking.end_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
    booking.check_in_status === 'checked_in'
  );

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-10 w-36 bg-gray-200 rounded"></div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="mb-4 p-4 border border-gray-200 rounded-lg">
            <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Toast
          message={error}
          onClose={() => setError(null)}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Today's Tasks</h1>
          <span className="px-3 py-1 text-sm bg-gray-100 rounded-full">
            {format(selectedDate, 'MMMM d, yyyy')}
          </span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Message Campers
        </button>
      </div>

      {/* Check-ins Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-medium">Checking in today</h2>
        </div>
        {checkIns.length === 0 ? (
          <p className="text-gray-500">No check-ins scheduled for today</p>
        ) : (
          <div className="space-y-4">
            {checkIns.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">
                      {booking.customers?.first_name} {booking.customers?.last_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        Site {booking.sites?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <CreditCard className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleCheckIn(booking)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Check in
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-outs Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <LogOut className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-medium">Checking out today</h2>
        </div>
        {checkOuts.length === 0 ? (
          <p className="text-gray-500">No check-outs scheduled for today</p>
        ) : (
          <div className="space-y-4">
            {checkOuts.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">
                      {booking.customers?.first_name} {booking.customers?.last_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        Site {booking.sites?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleCheckOut(booking)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Check out
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Campers Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Tent className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-medium">Currently on campground</h2>
        </div>
        {currentCampers.length === 0 ? (
          <p className="text-gray-500">No campers currently checked in</p>
        ) : (
          <div className="space-y-4">
            {currentCampers.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">
                      {booking.customers?.first_name} {booking.customers?.last_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        Site {booking.sites?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.start_date), 'MMM d')} - {format(new Date(booking.end_date), 'MMM d')}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4 text-green-600" />
                        Checked in {booking.check_in_date ? format(new Date(booking.check_in_date), 'MMM d, h:mma') : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}