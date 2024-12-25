import React from 'react';
import { format, startOfToday, isWithinInterval, parseISO, differenceInDays, isSameDay, addDays } from 'date-fns';
import { Tent, CheckSquare, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Site, Booking, Customer, Reservation } from '../types';
import { TimeIndicator } from './TimeIndicator';
import { updateBooking, updateReservation, getCustomerById, markReservationAsPaid, updateBookingCheckInStatus} from '../lib/queries';
import { ReservationModal } from './modals/ReservationModal';
import { BookingContextMenu } from './BookingContextMenu';
import { ReservationContextMenu } from './ReservationContextMenu';
import { Toast } from './Toast';
import { BookingDetails } from './BookingDetails';
import { ReservationDetails } from './ReservationDetails';

// Props interface for the CalendarGrid component
interface CalendarGridProps {
  days: Date[];
  sites: Site[];
  bookings: Booking[];
  reservations: Reservation[];
  onBookingUpdate?: () => void;
}

// Main calendar grid component using forwardRef for scroll functionality
const CalendarGridComponent = (
  { days, sites, bookings, reservations, onBookingUpdate }: CalendarGridProps,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const today = startOfToday();
  const [draggedItem, setDraggedItem] = React.useState<Booking | Reservation | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [dragOverInfo, setDragOverInfo] = React.useState<{ date: Date; siteId: number } | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    item: Booking | Reservation;
  } | null>(null);
  const [dragStartPosition, setDragStartPosition] = React.useState<{ x: number; date: Date } | null>(null);
  const [selectionBox, setSelectionBox] = React.useState<{
    startDate: Date;
    endDate: Date;
    siteId: number;
  } | null>(null);
  const [newReservation, setNewReservation] = React.useState<{
    startDate: Date;
    endDate: Date;
    siteId: number;
  } | null>(null);
  const [isDraggingNew, setIsDraggingNew] = React.useState(false);
  const dragStartRef = React.useRef<{ date: Date; siteId: number } | null>(null);
  const [selectedBooking, setSelectedBooking] = React.useState<{ booking: Booking; customer: Customer } | null>(null);
  const [selectedReservation, setSelectedReservation] = React.useState<{ reservation: Reservation; customer: Customer } | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizing, setResizing] = React.useState<{
    booking: Booking | Reservation;
    edge: 'start' | 'end';
    initialX: number;
    initialDate: Date;
  } | null>(null);

  // Helper function to get all bookings for a specific date and site
  const getBookingForDate = (date: Date, siteId: number) => {
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
  };

  // Calculate the width of a booking based on its duration
  const getBookingWidth = (booking: Booking | Reservation) => {
    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);
    // Multiply by cell width (120px) and subtract 5px for visual spacing
    return (differenceInDays(endDate, startDate) * 120) - 5;
  };

  // Handle drag start
  const handleDragStart = (item: Booking | Reservation, e: React.DragEvent) => {
    // Prevent drag if we're resizing
    if (isResizing) {
      e.preventDefault();
      return;
    }

    setDraggedItem(item);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date, siteId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only update drag over info if it changed
    if (!dragOverInfo || 
        dragOverInfo.date.getTime() !== date.getTime() || 
        dragOverInfo.siteId !== siteId) {
      setDragOverInfo({ date, siteId });
    }
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, dropDate: Date, dropSiteId: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // Prevent dropping if nothing changed
    if (draggedItem.site_id === dropSiteId && 
        format(dropDate, 'yyyy-MM-dd') === draggedItem.start_date) {
      setDraggedItem(null);
      setDragOverInfo(null);
      return;
    }

    // Calculate new dates
    const originalStart = parseISO(draggedItem.start_date);
    const originalEnd = parseISO(draggedItem.end_date);
    const bookingDuration = differenceInDays(originalEnd, originalStart);
    
    const newStartDate = format(dropDate, 'yyyy-MM-dd');
    const newEndDate = format(addDays(dropDate, bookingDuration), 'yyyy-MM-dd');

    // Helper function to check if two date ranges overlap
    const hasOverlap = (start1: string, end1: string, start2: string, end2: string) => {
      // For same-day transitions (one booking ends when another starts),
      // we don't consider it an overlap
      if (end1 === start2 || end2 === start1) {
        return false;
      }
      return (
        (start1 <= end2 && end1 >= start2) ||
        (start2 <= end1 && end2 >= start1)
      );
    };

    try {
      // Check if the new slot is available
      const conflictingBookings = bookings.filter(booking => 
        booking.id !== draggedItem.id &&
        booking.site_id === dropSiteId &&
        hasOverlap(booking.start_date, booking.end_date, newStartDate, newEndDate)
      );

      const conflictingReservations = reservations.filter(reservation =>
        reservation.id !== draggedItem.id &&
        reservation.site_id === dropSiteId &&
        hasOverlap(reservation.start_date, reservation.end_date, newStartDate, newEndDate)
      );

      if (conflictingBookings.length > 0 || conflictingReservations.length > 0) {
        setError('Cannot move: This time slot is already booked');
        return;
      }

      // Update booking or reservation based on type
      if ('status' in draggedItem && draggedItem.status === 'pending') {
        await updateReservation(draggedItem.id, {
          start_date: newStartDate,
          end_date: newEndDate,
          site_id: dropSiteId
        });
      } else {
        await updateBooking(draggedItem.id, {
          start_date: newStartDate,
          end_date: newEndDate,
          site_id: dropSiteId
        });
      }
      
      // Refresh calendar data
      onBookingUpdate?.();
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to move. Please try again.');
    }

    setDraggedItem(null);
    setDragOverInfo(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverInfo(null);
  };

  // Handle resize start
  const handleResizeStart = async (
    e: React.MouseEvent,
    item: Booking | Reservation,
    edge: 'start' | 'end',
  ) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent drag from starting
    
    // Prevent resizing checked out bookings
    if (!('status' in item) && item.check_in_status === 'checked_out') {
      setError('Cannot modify a checked out booking');
      return;
    }
    
    setIsResizing(true);
    
    const initialX = e.clientX;
    const initialDate = edge === 'start' 
      ? parseISO(item.start_date)
      : parseISO(item.end_date);
    
    setResizing({ booking: item, edge, initialX, initialDate });

    // Add temporary event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - initialX; 
      const daysDelta = Math.round(deltaX / 120); // 120px per day
      const newDate = addDays(initialDate, daysDelta); 
      const formattedDate = format(newDate, 'yyyy-MM-dd');
      
      // Prevent invalid date ranges
      if (edge === 'start') {
        const endDate = parseISO(item.end_date);
        if (newDate >= endDate) return;
      } else {
        const startDate = parseISO(item.start_date);
        if (newDate <= startDate) return;
      }
      
      // Helper function to check if two date ranges overlap
      const hasOverlap = (start1: string, end1: string, start2: string, end2: string) => {
        // Allow bookings to end and start on the same day
        if (end1 === start2 || end2 === start1) {
          return false;
        }
        return (
          (start1 < end2 && end1 > start2) ||
          (start2 < end1 && end2 > start1)
        );
      };

      // Check for conflicts with existing bookings
      const conflictingBookings = bookings.filter(b => 
        b.id !== item.id &&
        b.site_id === item.site_id &&
        hasOverlap(
          edge === 'start' ? formattedDate : item.start_date,
          edge === 'end' ? formattedDate : item.end_date,
          b.start_date,
          b.end_date
        )
      );
      
      // Also check for conflicts with reservations
      const conflictingReservations = reservations.filter(r => 
        r.id !== item.id &&
        r.site_id === item.site_id &&
        hasOverlap(
          edge === 'start' ? formattedDate : item.start_date,
          edge === 'end' ? formattedDate : item.end_date,
          r.start_date,
          r.end_date
        )
      );
      
      if (conflictingBookings.length > 0 || conflictingReservations.length > 0) {
        setError('Cannot resize: This would overlap with another booking');
        return;
      }
      
      // Update booking or reservation
      const updatePromise = 'status' in item && item.status === 'pending'
        ? updateReservation(item.id, {
            start_date: edge === 'start' ? formattedDate : item.start_date,
            end_date: edge === 'end' ? formattedDate : item.end_date,
            site_id: item.site_id
          })
        : updateBooking(item.id, {
            start_date: edge === 'start' ? formattedDate : item.start_date,
            end_date: edge === 'end' ? formattedDate : item.end_date,
            site_id: item.site_id
          });

      updatePromise.then(() => {
        onBookingUpdate?.();
      }).catch(error => {
        console.error('Error updating booking:', error);
        setError('Failed to update');
      });
    };
    
    const handleMouseUp = () => {
      setResizing(null);
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
    // Only show context menu for bookings that aren't checked out
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

  // Handle mouse down on empty cell
  const handleMouseDown = (e: React.MouseEvent, date: Date, siteId: number) => {
    // Don't start new reservation if we're resizing
    if (isResizing || draggedItem || e.button !== 0) return;

    // Check if the cell already has a booking
    const existingBookings = getBookingForDate(date, siteId);
    if (existingBookings.length > 0) return;

    // Use exact click position
    setDragStartPosition({ x: e.clientX, date });
    dragStartRef.current = { date, siteId };
  };

  // Handle mouse move while creating new reservation
  const handleMouseMove = (e: React.MouseEvent, date: Date, siteId: number) => {
    if (!dragStartPosition || !dragStartRef.current) return;

    // Check if left mouse button is still pressed
    if ((e.buttons & 1) === 0) {
      handleMouseUp();
      return;
    }

    const dragDistance = e.clientX - dragStartPosition.x;
    // Add 1 to account for overnight stay (end date is exclusive)
    const daysDragged = Math.floor(dragDistance / 120) + 1;

    // Only start dragging if we've moved at least one day
    if (!isDraggingNew && Math.abs(daysDragged) >= 1) {
      setIsDraggingNew(true);
      setSelectionBox({
        startDate: dragStartPosition.date,
        endDate: addDays(dragStartPosition.date, 1), // Start with minimum 1 night
        siteId
      });
    }

    // Only update if we're still on the same site
    if (isDraggingNew && siteId === dragStartRef.current.siteId) {
      const startDate = dragStartRef.current.date;
      // Ensure minimum 1 night stay and end date is exclusive
      const endDate = addDays(startDate, Math.max(1, daysDragged));

      setSelectionBox({
        startDate,
        endDate,
        siteId
      });
    }
  };

  // Handle mouse up to finish creating new reservation
  const handleMouseUp = () => {
    if (isDraggingNew && selectionBox) {
      // Only create reservation if we've actually dragged
      const startDate = selectionBox.startDate < selectionBox.endDate 
        ? selectionBox.startDate 
        : selectionBox.endDate;
      const endDate = selectionBox.startDate < selectionBox.endDate 
        ? selectionBox.endDate 
        : selectionBox.startDate;

      setNewReservation(prev => ({
        startDate,
        endDate,
        siteId: selectionBox.siteId
      }));
    }
    setIsDraggingNew(false);
    setSelectionBox(null);
    dragStartRef.current = null;
    setDragStartPosition(null);
  };

  // Add mouse up listener to handle cases where mouse is released outside the grid
  React.useEffect(() => {
    if (isDraggingNew) {
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };
      
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isDraggingNew]);

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
      {/* Fixed left column showing site names */}
      <div className="absolute left-0 top-0 z-20 w-[200px] bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-r border-gray-200 bg-gray-50 items-center p-3 text-left font-bold min-w-[200px]">
                <div className="flex items-center h-[44px] pl-2">
                  Site
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr key={site.id} className="group">
                <td className="border-b border-r border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center space-x-2 h-[23px]">
                    <Tent className="h-5 w-5 text-gray-400" />
                    <div className="font-medium">
                      <div className="text-gray-900">{site.name}</div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Scrollable calendar grid */}
      <div ref={ref} className="overflow-x-auto ml-[200px]">
        <div className="relative">
          {/* Time indicator line - only shown if today is visible */}
          <TimeIndicator dayWidth={120} days={days} />
          <table className="w-full border-collapse">
            {/* Calendar header showing dates */}
            <thead>
              <tr>
                {days.map((day) => (
                  <th
                    key={day.toString()}
                    className="border-b border-r border-gray-200 bg-gray-50 p-3 text-left min-w-[120px]"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-normal text-gray-500">
                        {format(day, 'MMM')}
                      </span>
                      <div className="flex items-baseline space-x-1">
                        <span className="font-semibold">{format(day, 'd')}</span>
                        <span className="text-sm text-gray-500">{format(day, 'EEE')}</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Main calendar grid showing bookings */}
              {sites.map((site) => (
                <tr key={site.id} className="group">
                  {days.map((day) => (
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
                        {/* IIFE to handle booking display logic */}
                        {(() => {
                          const dayBookings = getBookingForDate(day, site.id);
                          if (dayBookings.length > 0) {
                            // Map through all bookings for this day/site
                            return dayBookings.map((booking, index) => {
                              // Only render booking on its start date
                              if (isSameDay(parseISO(booking.start_date), day)) {
                                const width = getBookingWidth(booking);
                                return (
                                  // Booking display box
                                  <div 
                                    key={`${booking.id}-${site.id}-${day.toString()}`}
                                    className={clsx(
                                      "absolute rounded p-1 z-10 h-[40px] transition-opacity",
                                      'group/booking',
                                      'status' in booking
                                        ? 'bg-white border-2 border-green-600 text-black hover:bg-green-50'
                                        : booking.check_in_status === 'pending'
                                          ? 'bg-green-100 border-2 border-green-600 text-black hover:bg-green-200'
                                          : 'bg-green-800 text-white hover:bg-green-900',
                                      draggedItem?.id === booking.id ? "cursor-grabbing opacity-50" : "cursor-grab",
                                      isResizing && "pointer-events-none"
                                    )}
                                    draggable
                                    onDragStart={(e) => {
                                      if (e.detail === 2) {
                                        e.preventDefault();
                                        if ('status' in booking) {
                                          handleReservationClick(booking as Reservation);
                                        } else {
                                          handleBookingClick(booking as Booking);
                                        }
                                        return;
                                      }
                                      e.stopPropagation();
                                      handleDragStart(booking, e);
                                    }}
                                    onDragEnd={handleDragEnd}
                                    onContextMenu={(e) => {
                                      handleContextMenu(e, booking);
                                    }}
                                    onDoubleClick={() => {
                                      if ('status' in booking) {
                                        handleReservationClick(booking as Reservation);
                                      } else {
                                        handleBookingClick(booking as Booking);
                                      }
                                    }}
                                    style={{ 
                                      // Position at 55% of cell width for visual alignment
                                      left: '55%',
                                      width: `${width}px`,
                                      top: '4px',
                                      transform: `translateY(${index * -0}px)`
                                    }}
                                    title="Drag to move booking"
                                  >
                                    {/* Guest name with ellipsis for overflow */}
                                    {/* Left resize handle */}
                                    <div 
                                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize resize-handle opacity-0 group-hover/booking:opacity-100 transition-opacity"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleResizeStart(e, booking, 'start');
                                      }}
                                      title="Drag to change start date"
                                    >
                                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-600 opacity-50">
                                      </div>
                                    </div>
                                    {/* Right resize handle */}
                                    <div 
                                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize resize-handle opacity-0 group-hover/booking:opacity-100 transition-opacity"
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        handleResizeStart(e, booking, 'end');
                                      }}
                                      title="Drag to change end date"
                                    >
                                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-green-600 opacity-50">
                                      </div>
                                    </div>
                                    <span className={clsx(
                                      "text-sm font-medium line-clamp-2 h-full flex items-center pl-2 select-none",
                                      !('status' in booking) && booking.check_in_status === 'pending' ? 'text-black' : ''
                                    )}>
                                     {booking.customers?.last_name || ''}
                                    </span>
                                    {'status' in booking ? null : (
                                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {booking.check_in_status === 'checked_in' ? (
                                          <CheckSquare className="h-4 w-4 text-white" />
                                        ) : booking.check_in_status === 'checked_out' ? (
                                          <LogOut className="h-4 w-4 text-gray-300" />
                                        ) : (
                                          <div className={clsx(
                                            'w-2 h-2 rounded-full',
                                          booking.check_in_status === 'checked_in'
                                            ? 'bg-blue-400'
                                            : booking.check_in_status === 'checked_out'
                                              ? 'bg-gray-300'
                                              : 'bg-green-300'
                                          )} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            });
                          }
                          return null;
                        })()}
                    </td>
                  ))}
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