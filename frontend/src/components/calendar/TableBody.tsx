import clsx from "clsx";
import {
    isWithinInterval,
    parseISO,
    isSameDay,
    differenceInDays,
    addDays,
    format,
} from "date-fns";
import { CheckSquare, LogOut } from "lucide-react";
import { Booking, Reservation } from "../../types";
import { updateBooking, updateReservation } from "@backend/queries";

export const TableBody = ({
    sites,
    days,
    dragOverInfo,
    setDragOverInfo,
    selectionBox,
    handleMouseDown,
    handleMouseMove,
    getBookingForDate,
    draggedItem,
    isResizing,
    setDraggedItem,
    handleDragEnd,
    handleContextMenu,
    handleItemClick,
    setIsResizing,
    setError,
    onBookingUpdate,
    checkConflicts,
    resetDragState
}: any) => {
    const handleDragOver = (e: React.DragEvent, date: Date, siteId: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (
            !dragOverInfo ||
            dragOverInfo.date.getTime() !== date.getTime() ||
            dragOverInfo.siteId !== siteId
        ) {
            setDragOverInfo({ date, siteId });
        }
    };
    const getBookingWidth = (booking: Booking | Reservation) => {
        const startDate = parseISO(booking.start_date);
        const endDate = parseISO(booking.end_date);
        return differenceInDays(endDate, startDate) * 120 - 5;
    };
    const handleDragStart = (
        item: Booking | Reservation,
        e: React.DragEvent
    ) => {
        if (isResizing) {
            e.preventDefault();
            return;
        }

        setDraggedItem(item);
    };

    const isResizable = (item: Booking | Reservation) =>
        "status" in item ? item.status !== "checked_out" : true;

    const handleResizeStart = (
        e: React.MouseEvent,
        item: Booking | Reservation,
        edge: "start" | "end"
    ) => {
        e.preventDefault();
        if (!isResizable(item)) {
            setError("Cannot modify a checked-out booking");
            return;
        }

        setIsResizing(true);
        const initialX = e.clientX;
        const initialDate =
            edge === "start"
                ? parseISO(item.start_date)
                : parseISO(item.end_date);

        const handleMouseMove = createResizeHandler(
            e,
            item,
            edge,
            initialX,
            initialDate
        );

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const createResizeHandler =
        (
            e: React.MouseEvent,
            item: Booking | Reservation,
            edge: "start" | "end",
            initialX: number,
            initialDate: Date
        ) =>
        (e: MouseEvent) => {
            const deltaX = e.clientX - initialX;
            const daysDelta = Math.round(deltaX / 120); // 120px per day
            const newDate = addDays(initialDate, daysDelta);
            const formattedDate = format(newDate, "yyyy-MM-dd");

            if (
                (edge === "start" && newDate >= parseISO(item.end_date)) ||
                (edge === "end" && newDate <= parseISO(item.start_date))
            ) {
                return;
            }

            if (
                checkConflicts(
                    item.site_id,
                    item.id,
                    edge === "start" ? formattedDate : item.start_date,
                    edge === "end" ? formattedDate : item.end_date
                )
            ) {
                setError(
                    "Cannot resize: This would overlap with another booking"
                );
                return;
            }

            const updateFn =
                "status" in item && item.status === "pending"
                    ? updateReservation
                    : updateBooking;

            updateFn(item.id, {
                start_date: edge === "start" ? formattedDate : item.start_date,
                end_date: edge === "end" ? formattedDate : item.end_date,
                site_id: item.site_id,
            })
                .then(() => onBookingUpdate?.())
                .catch((error) => {
                    console.error("Error updating booking:", error);
                    setError("Failed to update");
                });
        };

    const handleDrop = async (
        e: React.DragEvent,
        dropDate: Date,
        dropSiteId: number
    ) => {
        e.preventDefault();
        if (!draggedItem) return;
        // Prevent dropping if nothing has changed
        if (
            draggedItem.site_id === dropSiteId &&
            format(dropDate, "yyyy-MM-dd") === draggedItem.start_date
        ) {
            resetDragState();
            return;
        }
        const { start_date, end_date } = draggedItem;
        const originalStart = parseISO(start_date);
        const originalEnd = parseISO(end_date);
        const bookingDuration = differenceInDays(originalEnd, originalStart);
        const newStartDate = format(dropDate, "yyyy-MM-dd");
        const newEndDate = format(
            addDays(dropDate, bookingDuration),
            "yyyy-MM-dd"
        );

        if (
            checkConflicts(dropSiteId, draggedItem.id, newStartDate, newEndDate)
        ) {
            setError("Cannot move: This time slot is already booked");
            return;
        }
        try {
            const updateData = {
                start_date: newStartDate,
                end_date: newEndDate,
                site_id: dropSiteId,
            };

            const updateFn =
                "status" in draggedItem && draggedItem.status === "pending"
                    ? updateReservation
                    : updateBooking;

            await updateFn(draggedItem.id, updateData);
            onBookingUpdate?.();
        } catch (error) {
            console.error("Error updating booking:", error);
            alert("Failed to move. Please try again.");
        }
        resetDragState();
    };
    return (
        <tbody>
            {sites.map((site) => (
                <tr key={site.id} className="group">
                    {days.map((day) => (
                        <td
                            key={day.toString()}
                            className={clsx(
                                "border-b border-r border-gray-200 p-1 h-12 relative select-none",
                                dragOverInfo?.date === day &&
                                    dragOverInfo.siteId === site.id
                                    ? "bg-blue-50"
                                    : "group-hover:bg-gray-50",
                                selectionBox &&
                                    site.id === selectionBox.siteId &&
                                    isWithinInterval(day, {
                                        start: selectionBox.startDate,
                                        end: selectionBox.endDate,
                                    }) &&
                                    "selection-animation"
                            )}
                            onDragOver={(e) => handleDragOver(e, day, site.id)}
                            onDrop={(e) => handleDrop(e, day, site.id)}
                            onMouseDown={(e) =>
                                handleMouseDown(e, day, site.id)
                            }
                            onMouseEnter={(e) =>
                                handleMouseMove(e, day, site.id)
                            }
                        >
                            {getBookingForDate(day, site.id).map(
                                (booking, index) => {
                                    if (
                                        !isSameDay(
                                            parseISO(booking.start_date),
                                            day
                                        )
                                    )
                                        return null;

                                    const width = getBookingWidth(booking);
                                    const isBookingStatus = "status" in booking;
                                    const isPending =
                                        booking.check_in_status === "pending";

                                    return (
                                        <div
                                            key={`${booking.id}-${
                                                site.id
                                            }-${day.toString()}`}
                                            className={clsx(
                                                "absolute rounded p-1 z-10 h-[40px] transition-opacity",
                                                "group/booking",
                                                isBookingStatus
                                                    ? "bg-white border-2 border-green-600 text-black hover:bg-green-50"
                                                    : isPending
                                                    ? "bg-green-100 border-2 border-green-600 text-black hover:bg-green-200"
                                                    : "bg-green-800 text-white hover:bg-green-900",
                                                draggedItem?.id === booking.id
                                                    ? "cursor-grabbing opacity-50"
                                                    : "cursor-grab",
                                                isResizing &&
                                                    "pointer-events-none"
                                            )}
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(booking, e)
                                            }
                                            onDragEnd={handleDragEnd}
                                            onContextMenu={(e) =>
                                                handleContextMenu(e, booking)
                                            }
                                            onDoubleClick={() =>
                                                handleItemClick(
                                                    booking,
                                                    "booking"
                                                )
                                            }
                                            style={{
                                                left: "55%",
                                                width: `${width}px`,
                                                top: "4px",
                                                transform: `translateY(${
                                                    index * -0
                                                }px)`,
                                            }}
                                            title="Drag to move booking"
                                        >
                                            {["start", "end"].map((side) => (
                                                <div
                                                    key={side}
                                                    className={`absolute ${
                                                        side === "start"
                                                            ? "left-0"
                                                            : "right-0"
                                                    } top-0 bottom-0 w-2 cursor-ew-resize resize-handle opacity-0 group-hover/booking:opacity-100 transition-opacity`}
                                                    onMouseDown={(e) => {
                                                        e.stopPropagation();
                                                        handleResizeStart(
                                                            e,
                                                            booking,
                                                            side
                                                        );
                                                    }}
                                                    title={`Drag to change ${
                                                        side === "start"
                                                            ? "start"
                                                            : "end"
                                                    } date`}
                                                >
                                                    <div
                                                        className={`absolute ${
                                                            side === "start"
                                                                ? "left-0"
                                                                : "right-0"
                                                        } top-0 bottom-0 w-1 bg-green-600 opacity-50`}
                                                    />
                                                </div>
                                            ))}
                                            <span
                                                className={clsx(
                                                    "text-sm font-medium line-clamp-2 h-full flex items-center pl-2 select-none",
                                                    !isBookingStatus &&
                                                        isPending &&
                                                        "text-black"
                                                )}
                                            >
                                                {booking.customers?.last_name ||
                                                    ""}
                                            </span>
                                            {isBookingStatus ? null : (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                    {booking.check_in_status ===
                                                    "checked_in" ? (
                                                        <CheckSquare className="h-4 w-4 text-white" />
                                                    ) : booking.check_in_status ===
                                                      "checked_out" ? (
                                                        <LogOut className="h-4 w-4 text-gray-300" />
                                                    ) : (
                                                        <div
                                                            className={clsx(
                                                                "w-2 h-2 rounded-full",
                                                                booking.check_in_status ===
                                                                    "checked_in"
                                                                    ? "bg-blue-400"
                                                                    : booking.check_in_status ===
                                                                      "checked_out"
                                                                    ? "bg-gray-300"
                                                                    : "bg-green-300"
                                                            )}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
};
