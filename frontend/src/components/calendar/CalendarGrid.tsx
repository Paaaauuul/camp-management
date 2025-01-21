import React, { useState } from "react";
import {
    isWithinInterval,
    parseISO,
    differenceInDays,
    isSameDay,
} from "date-fns";
import clsx from "clsx";
import { Site, Booking, Reservation } from "../../types";
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
import { CalendarGridHeader } from "./CalendarGridHeader";
import { SitesList } from "./SitesList";
import { BookingCell } from "./BookingCell";
import { useCalendarDrag } from "../../hooks/useCalendarDrag";
import { useCalendarResize } from "../../hooks/useCalendarResize";
import { useNewReservation } from "../../hooks/useNewReservation";

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
    const [error, setError] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<any>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [selectedReservation, setSelectedReservation] = useState<any>(null);

    const {
        draggedItem,
        dragOverInfo,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
    } = useCalendarDrag({
        bookings,
        reservations,
        onBookingUpdate,
        onError: setError,
    });

    const { isResizing, handleResizeStart } = useCalendarResize({
        bookings,
        reservations,
        onBookingUpdate,
        onError: setError,
    });

    const {
        newReservation,
        isDraggingNew,
        selectionBox,
        handleMouseDown,
        handleMouseMove,
        setNewReservation,
    } = useNewReservation({
        getBookingForDate: (date, siteId) => {
            const filterByDate = (
                items: Array<{ start_date: string; end_date: string }>
            ) =>
                items.filter((item) =>
                    isWithinInterval(date, {
                        start: parseISO(item.start_date),
                        end: parseISO(item.end_date),
                    })
                );
            return [
                ...filterByDate(bookings.filter((b) => b.site_id === siteId)),
                ...filterByDate(
                    reservations.filter((r) => r.site_id === siteId)
                ),
            ];
        },
    });

    const fetchCustomerDetails = async (id: number, callback: any) => {
        try {
            const customer = await getCustomerById(id);
            if (customer) {
                callback(customer);
            } else {
                setError("Could not find customer information");
            }
        } catch {
            setError("Failed to load details");
        }
    };

    const handleBookingClick = (booking: Booking) => {
        fetchCustomerDetails(booking.customer_id, (customer: any) =>
            setSelectedBooking({ booking, customer })
        );
    };

    const handleReservationClick = (reservation: Reservation) => {
        fetchCustomerDetails(reservation.customer_id, (customer: any) =>
            setSelectedReservation({ reservation, customer })
        );
    };

    const handleContextMenu = (
        e: React.MouseEvent,
        item: { id: number; check_in_status: string }
    ) => {
        e.preventDefault();
        if (item.check_in_status === "checked_out") return;
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const handleStatusUpdate = async (
        booking: Booking,
        status: "checked_in" | "checked_out"
    ) => {
        try {
            await updateBookingCheckInStatus(booking.id, status);
            setContextMenu(null);
            onBookingUpdate?.();
        } catch {
            setError("Failed to update status");
        }
    };

    const handleMarkAsPaid = async (reservation: Reservation) => {
        try {
            await markReservationAsPaid(reservation.id);
            setContextMenu(null);
            onBookingUpdate?.();
        } catch {
            setError("Failed to mark reservation as paid");
        }
    };

    const renderTableCell = (site: Site, day: Date) => {
        const items = [
            ...bookings.filter(
                (b) =>
                    b.site_id === site.id &&
                    isSameDay(parseISO(b.start_date), day)
            ),
            ...reservations.filter(
                (r) =>
                    r.site_id === site.id &&
                    isSameDay(parseISO(r.start_date), day)
            ),
        ];

        const cellClasses = clsx(
            "border-b border-r p-1 h-12 relative",
            dragOverInfo?.date === day && dragOverInfo.siteId === site.id
                ? "bg-blue-50"
                : "group-hover:bg-gray-50",
            selectionBox &&
                site.id === selectionBox.siteId &&
                isWithinInterval(day, {
                    start: selectionBox.startDate,
                    end: selectionBox.endDate,
                }) &&
                "selection-animation"
        );

        return (
            <td
                key={day.toString()}
                className={cellClasses}
                onDragOver={(e) => handleDragOver(e, day, site.id)}
                onDrop={(e) => handleDrop(e, day, site.id)}
                onMouseDown={(e) => handleMouseDown(e, day, site.id)}
                onMouseEnter={(e) => handleMouseMove(e, day, site.id)}
            >
                {items.map((item: any) => (
                    <BookingCell
                        key={`${item.id}-${site.id}-${day}`}
                        booking={item}
                        day={day}
                        siteId={site.id}
                        width={
                            differenceInDays(
                                parseISO(item.end_date),
                                parseISO(item.start_date)
                            ) *
                                120 -
                            5
                        }
                        isDragging={draggedItem?.id === item.id}
                        isResizing={isResizing}
                        onDragStart={(e) => handleDragStart(item, e)}
                        onDragEnd={handleDragEnd}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onDoubleClick={() => {
                            return "status" in item
                                ? handleReservationClick(item)
                                : handleBookingClick(item);
                        }}
                        onResizeStart={(e, edge) =>
                            handleResizeStart(e, item, edge)
                        }
                    />
                ))}
            </td>
        );
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
                                    {days.map((day) =>
                                        renderTableCell(site, day)
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {contextMenu &&
                ("status" in contextMenu.item ? (
                    <ReservationContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        onClose={() => setContextMenu(null)}
                        onEdit={() => handleReservationClick(contextMenu.item)}
                        onConfirm={() => handleMarkAsPaid(contextMenu.item)}
                        onDelete={() =>
                            console.log(
                                "Delete reservation",
                                contextMenu.item.id
                            )
                        }
                    />
                ) : (
                    <BookingContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        booking={contextMenu.item}
                        onClose={() => setContextMenu(null)}
                        onEdit={() => handleBookingClick(contextMenu.item)}
                        onCheckIn={() =>
                            handleStatusUpdate(contextMenu.item, "checked_in")
                        }
                        onCheckOut={() =>
                            handleStatusUpdate(contextMenu.item, "checked_out")
                        }
                        onDelete={() =>
                            console.log("Delete booking", contextMenu.item.id)
                        }
                    />
                ))}

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
                        siteId: newReservation.siteId,
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
