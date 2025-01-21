import { useState, useEffect } from "react";
import { format } from "date-fns";
import { getSites, getBookings, getReservations } from "@backend/queries";
import { Site, Booking, Reservation } from "../types";
import { useInterval } from "./useInterval";

// Interval for refreshing booking data (5 seconds)
const REFRESH_INTERVAL = 5000;

export function useCalendarData(days: Date[]) {
    // State management
    const [sites, setSites] = useState<Site[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [hasData, setHasData] = useState(false);

    // Function to refresh booking data without reloading sites
    const refreshData = async () => {
        try {
            setError(null);
            const [bookingsData, reservationsData] = await Promise.all([
                getBookings(
                    format(days[0], "yyyy-MM-dd"),
                    format(days[days.length - 1], "yyyy-MM-dd")
                ),
                getReservations(
                    format(days[0], "yyyy-MM-dd"),
                    format(days[days.length - 1], "yyyy-MM-dd")
                ),
            ]);
            setBookings(bookingsData);
            setReservations(reservationsData);
            setLastUpdate(new Date());
            setHasData(true);
        } catch (e) {
            console.error("Error refreshing data:", e);
            setError(e instanceof Error ? e.message : "Failed to load data");
        }
    };

    // Initial data load - fetches both sites and bookings
    useEffect(() => {
        async function initialLoad() {
            try {
                setLoading(true);
                setError(null);

                const [sitesData, bookingsData, reservationsData] =
                    await Promise.all([
                        getSites(),
                        getBookings(
                            format(days[0], "yyyy-MM-dd"),
                            format(days[days.length - 1], "yyyy-MM-dd")
                        ),
                        getReservations(
                            format(days[0], "yyyy-MM-dd"),
                            format(days[days.length - 1], "yyyy-MM-dd")
                        ),
                    ]);

                setSites(sitesData);
                setBookings(bookingsData);
                setReservations(reservationsData);
                setHasData(true);
                setLastUpdate(new Date());
            } catch (e) {
                console.error("Error in initial load:", e);
                setError(
                    e instanceof Error ? e.message : "Failed to load data"
                );
                setSites([]);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        }

        initialLoad();
    }, [days]);

    // Set up periodic refresh of booking data
    useInterval(() => {
        refreshData();
    }, REFRESH_INTERVAL);

    return {
        sites,
        bookings,
        reservations,
        loading,
        error,
        refreshData,
        hasData,
    };
}
