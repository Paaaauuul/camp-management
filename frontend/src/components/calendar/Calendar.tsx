import React, {
    useState,
    useCallback,
    useMemo,
    useRef,
    useLayoutEffect,
} from "react";
import { format, addDays, startOfToday, subWeeks, addWeeks } from "date-fns";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarGrid } from "./CalendarGrid";
import { SkeletonCalendar } from "./SkeletonCalendar";
import { useCalendarData } from "../../hooks/useCalendarData";
import { SiteGroupProvider } from "../../contexts/SiteGroupContext";

export function Calendar() {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(() =>
        startOfToday()
    );

    // Memoize calendar structure based on selected date
    const { days, startDate, endDate } = useMemo(() => {
        const start = subWeeks(selectedDate, 3);
        const end = addWeeks(selectedDate, 3);
        const totalDays =
            Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;
        return {
            days: Array.from({ length: totalDays }, (_, i) =>
                addDays(start, i)
            ),
            startDate: start,
            endDate: end,
        };
    }, [selectedDate]);

    // Use custom hook for data management
    const {
        sites,
        bookings,
        loading,
        error,
        hasData,
        refreshData,
        reservations,
    } = useCalendarData(days);

    const handleTodayClick = useCallback(() => {
        setSelectedDate(startOfToday());
    }, []);

    const handlePreviousWeek = useCallback(() => {
        setSelectedDate((date) => subWeeks(date, 1));
    }, []);
    const handleNextWeek = useCallback(() => {
        setSelectedDate((date) => addWeeks(date, 1));
    }, []);
    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    useLayoutEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer && !loading) {
            const dayWidth = 120;
            const selectedIndex = days.findIndex(
                (day) =>
                    format(day, "yyyy-MM-dd") ===
                    format(selectedDate, "yyyy-MM-dd")
            );
            if (selectedIndex !== -1) {
                scrollContainer.scrollLeft = dayWidth * (selectedIndex - 1);
            }
        }
    }, [days, loading, selectedDate]);

    if (loading) {
        return <SkeletonCalendar />;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 p-4 rounded-md">
                <div className="flex flex-col space-y-2">
                    <p className="text-red-800 font-medium">
                        Error loading data
                    </p>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="self-start px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-4 overflow-hidden">
            <SiteGroupProvider>
                <CalendarHeader
                    startDate={days[0]}
                    endDate={days[days.length - 1]}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    hasData={hasData}
                    onTodayClick={handleTodayClick}
                    onPreviousWeek={handlePreviousWeek}
                    onNextWeek={handleNextWeek}
                    onReservationCreated={refreshData}
                />
                <CalendarGrid
                    ref={scrollContainerRef}
                    days={days}
                    sites={sites}
                    bookings={bookings}
                    reservations={reservations}
                    onBookingUpdate={() => refreshData()}
                />
            </SiteGroupProvider>
        </div>
    );
}
