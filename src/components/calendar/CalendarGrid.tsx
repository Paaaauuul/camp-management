import React from 'react';
import { isWithinInterval, parseISO, differenceInDays, isSameDay } from 'date-fns';
import clsx from 'clsx';
import { Site, Booking, Customer, Reservation } from '../../types';
import { TimeIndicator } from '../TimeIndicator';
import { getCustomerById, markReservationAsPaid, updateBookingCheckInStatus } from '../../lib/queries';
import { ReservationModal } from '../modals/ReservationModal';
import { BookingContextMenu } from '../BookingContextMenu';
import { ReservationContextMenu } from '../ReservationContextMenu';
import { Toast } from '../Toast';
import { BookingDetails } from '../BookingDetails';
import { ReservationDetails } from '../ReservationDetails';
import { CalendarGridHeader } from './CalendarGridHeader';
import { SitesList } from './SitesList';
import { BookingCell } from './BookingCell';
import { useCalendarDrag } from '../../hooks/useCalendarDrag';
import { useCalendarResize } from '../../hooks/useCalendarResize';
import { SiteGroupContext } from '../../contexts/SiteGroupContext';
import { useNewReservation } from '../../hooks/useNewReservation';
import { SiteGroup } from './SiteGroup';

interface CalendarGridProps {
  days: Date[];
  sites: Site[];
  bookings: Booking[];
  reservations: Reservation[];
  onBookingUpdate?: () => void;
}

const CalendarGridComponent = (
  { days, sites, bookings, reservations, onBookingUpdate }: CalendarGridProps,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const [error, setError] = React.useState<string | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    item: Booking | Reservation;
  } | null>(null);
  const [selectedBooking, setSelectedBooking] = React.useState<{ booking: Booking; customer: Customer } | null>(null);
  const [selectedReservation, setSelectedReservation] = React.useState<{ reservation: Reservation; customer: Customer } | null>(null);
  const { expandedTypes, toggleType } = React.useContext(SiteGroupContext);

  // Group sites by type
  const sitesByType = React.useMemo(() => {
    const grouped = sites.reduce((acc, site) => {
      const type = site.site_type || 'rv';
      if (!acc[type]) acc[type] = [];
      acc[type].push(site);
      return acc;
    }, {} as Record<string, Site[]>);

    return grouped;
  }, [sites]);

  // Custom hooks
  const {
    draggedItem,
    dragOverInfo,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd
  } = useCalendarDrag({
    bookings,
    reservations,
    onBookingUpdate,
    onError: setError
  });

  const {
    isResizing,
    handleResizeStart
  } = useCalendarResize({
    bookings,
    reservations,
    onBookingUpdate,
    onError: setError
  });

  const {
    newReservation,
    isDraggingNew,
    selectionBox,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setNewReservation
  } = useNewReservation({
    getBookingForDate: (date: Date, siteId: number) => {
      const dateBookings = bookings.filter(booking => 
        booking.site_id === siteId && 
        isWithinInterval(date, { 
          start: parseISO(booking.start_date), 
          end: parseISO(booking.end_date) 
        }) 
      );
      
      const datePendingReservations = reservations.filter(reservation =>
        reservation.site_id === siteId &&
        isWithinInterval(date, {
          start: parseISO(reservation.start_date),
          end: parseISO(reservation.end_date)
        })
      );
      
      return [...dateBookings, ...datePendingReservations];
    }
  });

  const getBookingWidth = (booking: Booking | Reservation) => {
    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);
    return (differenceInDays(endDate, startDate) * 120) - 5;
  };

  const handleBookingClick = async (booking: Booking) => {
    try {
      if (!booking.customer_id) {
        setError('No customer information available for this booking');
        return;
      }

      const customer = await getCustomerById(booking.customer_id);
      if (customer) {
        setSelectedBooking({ booking, customer });
      } else {
        setError('Could not find customer information');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load booking details');
    }
  };

  const handleReservationClick = async (reservation: Reservation) => {
    try {
      if (!reservation.customer_id) {
        setError('No customer information available for this reservation');
        return;
      }

      const customer = await getCustomerById(reservation.customer_id);
      if (customer) {
        setSelectedReservation({ reservation, customer });
      } else {
        setError('Could not find customer information');
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
      setError('Failed to load reservation details');
    }
  };

  const handleContextMenu = async (e: React.MouseEvent, item: Booking | Reservation) => {
    e.preventDefault();
    if (!('status' in item) && item.check_in_status === 'checked_out') {
      return;
    }
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

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
      setContextMenu(null);
      onBookingUpdate?.();
    } catch (error) {
      console.error('Error checking in booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to update check-in status');
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
      setContextMenu(null);
      onBookingUpdate?.();
    } catch (error) {
      console.error('Error checking out booking:', error);
      setError(error instanceof Error ? error.message : 'Failed to update check-out status');
    }
  };

  const handleMarkAsPaid = async (reservation: Reservation) => {
    try {
      await markReservationAsPaid(reservation.id);
      setContextMenu(null);
      onBookingUpdate?.();
    } catch (error) {
      console.error('Error marking reservation as paid:', error);
      setError('Failed to mark reservation as paid');
    }
  };

  const handleDelete = async () => {
    // TODO: Implement delete functionality
    console.log('Delete booking:', contextMenu?.item.id);
  };

  return (
    <div className="relative">
      {error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}
      
      <SitesList sites={sites} />
      
      <div ref={ref} className="overflow-x-auto ml-[200px]">
        <div className="relative">
          <TimeIndicator dayWidth={120} days={days} />
          <table className="w-full border-collapse">
            <CalendarGridHeader days={days} />
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="group">
                  {days.map((day) => {
                    const dayBookings = bookings.filter(booking => 
                      booking.site_id === site.id && 
                      isSameDay(parseISO(booking.start_date), day)
                    );
                    
                    const dayReservations = reservations.filter(reservation =>
                      reservation.site_id === site.id &&
                      isSameDay(parseISO(reservation.start_date), day)
                    );

                    return (
                      <td
                        key={day.toString()}
                        className={clsx(
                          'border-b border-r border-gray-200 p-1 h-12',
                          'relative select-none',
                          dragOverInfo?.date === day && dragOverInfo.siteId === site.id
                            ? 'bg-blue-50'
                            : 'group-hover:bg-gray-50',
                          selectionBox && site.id === selectionBox.siteId && 
                          isWithinInterval(day, {
                             start: selectionBox.startDate,
                             end: selectionBox.endDate
                          }) && 'selection-animation'
                        )}
                        onDragOver={(e) => handleDragOver(e, day, site.id)}
                        onDrop={(e) => handleDrop(e, day, site.id)}
                        onMouseDown={(e) => handleMouseDown(e, day, site.id)}
                        onMouseEnter={(e) => handleMouseMove(e, day, site.id)}
                      >
                        {[...dayBookings, ...dayReservations].map((booking) => (
                          <BookingCell
                            key={`${booking.id}-${site.id}-${day.toString()}`}
                            booking={booking}
                            day={day}
                            siteId={site.id}
                            width={getBookingWidth(booking)}
                            isDragging={draggedItem?.id === booking.id}
                            isResizing={isResizing}
                            onDragStart={(e) => handleDragStart(booking, e)}
                            onDragEnd={handleDragEnd}
                            onContextMenu={(e) => handleContextMenu(e, booking)}
                            onDoubleClick={() => {
                              if ('status' in booking) {
                                handleReservationClick(booking as Reservation);
                              } else {
                                handleBookingClick(booking as Booking);
                              }
                            }}
                            onResizeStart={(e, edge) => handleResizeStart(e, booking, edge)}
                          />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {contextMenu && (
        'status' in contextMenu.item ? (
          <ReservationContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onEdit={() => {
              handleReservationClick(contextMenu.item as Reservation);
              setContextMenu(null);
            }}
            onConfirm={async () => {
              await handleMarkAsPaid(contextMenu.item as Reservation);
            }}
            onAcceptPayment={() => {
              // TODO: Implement accept payment functionality
              console.log('Accept payment for reservation:', contextMenu.item.id);
            }}
            onDelete={handleDelete}
          />
        ) : (
          <BookingContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            booking={contextMenu.item as Booking}
            onClose={() => setContextMenu(null)}
            onEdit={() => {
              handleBookingClick(contextMenu.item as Booking);
              setContextMenu(null);
            }}
            onCheckIn={() => handleCheckIn(contextMenu.item as Booking)}
            onCheckOut={() => handleCheckOut(contextMenu.item as Booking)}
            onDelete={handleDelete}
          />
        )
      )}

      {newReservation && !isDraggingNew && (
        <ReservationModal
          isOpen={true}
          onClose={() => setNewReservation(null)}
          onReservationCreated={() => {
            setNewReservation(null);
            onBookingUpdate?.();
          }}
          initialData={{
            startDate: newReservation.startDate,
            endDate: newReservation.endDate,
            siteId: newReservation.siteId
          }}
        />
      )}

      {selectedBooking && (
        <BookingDetails
          booking={selectedBooking.booking}
          customer={selectedBooking.customer}
          onClose={() => setSelectedBooking(null)}
          onUpdate={onBookingUpdate}
        />
      )}

      {selectedReservation && (
        <ReservationDetails
          reservation={selectedReservation.reservation}
          customer={selectedReservation.customer}
          onClose={() => setSelectedReservation(null)}
          onUpdate={onBookingUpdate}
        />
      )}
    </div>
  );
};

export const CalendarGrid = React.forwardRef(CalendarGridComponent);