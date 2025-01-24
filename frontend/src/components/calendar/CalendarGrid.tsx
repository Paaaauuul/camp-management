import React, { useEffect, useRef, useState } from "react";
import {
    isWithinInterval,
    parseISO,
    format,
    addDays,
} from "date-fns";
import { Site, Booking, Reservation, Customer } from "../../types";
import { TimeIndicator } from "../TimeIndicator";
import {
    getCustomerById,
    markReservationAsPaid,
    updateBookingCheckInStatus,
} from "@backend/queries";
import { ReservationModal } from "../modals/ReservationModal";
import { BookingContextMenu } from "../BookingContextMenu";
import { ReservationContextMenu } from "../ReservationContextMenu";
import { Toast } from "../Toast";
import { BookingDetails } from "../BookingDetails";
import { ReservationDetails } from "../ReservationDetails";
import { BookingHead } from "./BookingHead";
import { TableBody } from "./TableBody";

interface CalendarGridProps {
    days: Date[];
    sites: Site[];
    bookings: Booking[];
    reservations: Reservation[];
    onBookingUpdate?: () => void;
}

interface IDate {
    startDate: Date;
    endDate: Date;
    siteId: number;
}

const CalendarGridComponent = (
    { days, sites, bookings, reservations, onBookingUpdate }: CalendarGridProps,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    const [draggedItem, setDraggedItem] = useState<Booking | Reservation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragOverInfo, setDragOverInfo] = useState<{ date: Date; siteId: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{
      x: number;
      y: number;
      item: Booking | Reservation;
    } | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<{ x: number; date: Date } | null>(null);
    const [selectionBox, setSelectionBox] = useState<IDate | null>(null);
    const [newReservation, setNewReservation] = useState<IDate | null>(null);
    const [isDraggingNew, setIsDraggingNew] = useState(false);
    const dragStartRef = useRef<{ date: Date; siteId: number } | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<{ booking: Booking; customer: Customer } | null>(null);
    const [selectedReservation, setSelectedReservation] = useState<{ reservation: Reservation; customer: Customer } | null>(null);
    const [isResizing, setIsResizing] = useState(false);
  
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
  
      // Utility functions
    const resetDragState = () => {
        setDraggedItem(null);
        setDragOverInfo(null);
    };
    const handleDragEnd = resetDragState;
    
    const checkConflicts = (siteId: number, itemId: number, start: string, end: string) => {
    const hasOverlap = (start1: string, end1: string, start2: string, end2: string) =>
        !(end1 === start2 || end2 === start1) &&
        ((start1 <= end2 && end1 >= start2) || (start2 <= end1 && end2 >= start1));
    
    const isConflicting = (entry: Booking | Reservation) =>
        entry.id !== itemId &&
        entry.site_id === siteId &&
        hasOverlap(start, end, entry.start_date, entry.end_date);
    
        return bookings.some(isConflicting) || reservations.some(isConflicting);
    };
      
    const handleItemClick = async (item: Booking | Reservation, type: "booking" | "reservation") => {
        try {
          if (!item.customer_id) {
            setError(`No customer information available for this ${type}`);
            return;
          }
          const customer = await getCustomerById(item.customer_id);
          if (customer) {
            if (type === "booking") {
              setSelectedBooking({ booking: item as Booking, customer });
            } else {
              setSelectedReservation({ reservation: item as Reservation, customer });
            }
          } else {
            setError(`Could not find customer information for this ${type}`);
          }
        } catch (error) {
          console.error(`Error fetching customer for ${type}:`, error);
          setError(`Failed to load ${type} details`);
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

    const handleCheckStatusUpdate = async (booking: Booking, status: "checked_in" | "checked_out") => {
        const { check_in_status:check } = booking;
        try {
          if (status === "checked_in") {
            if (check === "checked_in" || check === "checked_out") {
              setError(check === "checked_in" ? "Booking is already checked in" : "Cannot check in a checked-out booking");
              return;
            }
          }
          if (status === "checked_out") {
            if (check === "checked_out" || check === "pending") {
              setError(check === "checked_out" ? "Booking is already checked out" : "Cannot check out a booking that has not been checked in");
              return;
            }
          }
          await updateBookingCheckInStatus(booking.id, status);
          setContextMenu(null);
          onBookingUpdate?.();
        } catch (error) {
          console.error(`Error updating booking to ${status}:`, error);
          setError(error instanceof Error ? error.message : `Failed to update ${status} status`);
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
    const handleMouseDown = (e: React.MouseEvent, date: Date, siteId: number) => {
      if (isResizing || draggedItem || e.button !== 0) return;
      const existingBookings = getBookingForDate(date, siteId);
      if (existingBookings.length > 0) return;
      setDragStartPosition({ x: e.clientX, date });
      dragStartRef.current = { date, siteId };
    };
    const handleMouseMove = (e: React.MouseEvent, date: Date, siteId: number) => {
      if (!dragStartPosition || !dragStartRef.current) return;
      if ((e.buttons & 1) === 0) {
        handleMouseUp();
        return;
      }
      const dragDistance = e.clientX - dragStartPosition.x;
      const daysDragged = Math.floor(dragDistance / 120) + 1;
      if (!isDraggingNew && Math.abs(daysDragged) >= 1) {
        setIsDraggingNew(true);
        setSelectionBox({
          startDate: dragStartPosition.date,
          endDate: addDays(dragStartPosition.date, 1), 
          siteId
        });
      }
      if (isDraggingNew && siteId === dragStartRef.current.siteId) {
        const startDate = dragStartRef.current.date;
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
        const startDate = selectionBox.startDate < selectionBox.endDate 
          ? selectionBox.startDate 
          : selectionBox.endDate;
        const endDate = selectionBox.startDate < selectionBox.endDate 
          ? selectionBox.endDate 
          : selectionBox.startDate;
  
        setNewReservation(() => ({
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
  
    useEffect(() => {
      if (isDraggingNew) {
        const handleGlobalMouseUp = () => {
          handleMouseUp();
        };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
      }
    }, [isDraggingNew]);
  
    const handleDelete = async () => {};
  
    return (
      <div className="relative">
        {error && (
          <Toast
            message={error}
            type="error"
            onClose={() => setError(null)}
          />
        )}
        <BookingHead sites={sites} />
        {/* Scrollable calendar grid */}
        <div ref={ref} className="overflow-x-auto ml-[200px]">
            <div className="relative">
                <TimeIndicator dayWidth={120} days={days} />
                <table className="w-full border-collapse">
                <thead>
                    <tr>
                    {days.map((day) => (
                        <th
                        key={day.toString()}
                        className="border-b border-r border-gray-200 bg-gray-50 p-3 text-left min-w-[120px]"
                        >
                        <div className="flex flex-col">
                            <span className="text-sm font-normal text-gray-500">{format(day, 'MMM')}</span>
                            <div className="flex items-baseline space-x-1">
                            <span className="font-semibold">{format(day, 'd')}</span>
                            <span className="text-sm text-gray-500">{format(day, 'EEE')}</span>
                            </div>
                        </div>
                        </th>
                    ))}
                    </tr>
                </thead>
                <TableBody
                    sites={sites}
                    days={days}
                    dragOverInfo={dragOverInfo}
                    setDragOverInfo={setDragOverInfo}
                    selectionBox={selectionBox}
                    handleMouseDown={handleMouseDown}
                    handleMouseMove={handleMouseMove}
                    getBookingForDate={getBookingForDate}
                    draggedItem={draggedItem}
                    isResizing={isResizing}
                    setDraggedItem={setDraggedItem}
                    handleDragEnd={handleDragEnd}
                    handleContextMenu={handleContextMenu}
                    handleItemClick={handleItemClick}
                    setIsResizing={setIsResizing}
                    setError={setError}
                    onBookingUpdate={onBookingUpdate}
                    checkConflicts={checkConflicts}
                    resetDragState={resetDragState}
                />
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
                handleItemClick(contextMenu.item as Reservation, "reservation");
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
                handleItemClick(contextMenu.item as Booking, "booking");
                setContextMenu(null);
              }}
              onCheckIn={() => handleCheckStatusUpdate(contextMenu.item as Booking, 'checked_in')}
              onCheckOut={() => handleCheckStatusUpdate(contextMenu.item as Booking, 'checked_out')}
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
