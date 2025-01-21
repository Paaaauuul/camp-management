import { useState, useEffect } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import {
    getSites,
    getBookings,
    getReservations,
    getSitePricing,
} from "@backend/queries";
import { createCustomerWithReservation } from "@backend/reservation";
import { Site, Booking, Reservation } from "../types";

interface UseReservationFormProps {
    initialData?: {
        startDate: Date;
        endDate: Date;
        siteId: number;
    };
    onClose: () => void;
    onReservationCreated?: () => void;
}

interface CustomerForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    amount: string;
}

export function useReservationForm({
    initialData,
    onClose,
    onReservationCreated,
}: UseReservationFormProps) {
    // State hooks must be called in the same order on every render
    const [formData, setFormData] = useState<CustomerForm>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        amount: "0",
    });
    const [dates, setDates] = useState(() => ({
        startDate: initialData?.startDate,
        endDate: initialData?.endDate,
    }));
    const [sites, setSites] = useState<Site[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [selectedSiteId, setSelectedSiteId] = useState<number | null>(
        () => initialData?.siteId || null
    );
    const [pricePerNight, setPricePerNight] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calculate total amount when dates or site changes
    useEffect(() => {
        async function calculateAmount() {
            if (!selectedSiteId || !dates.startDate || !dates.endDate) {
                setFormData((prev) => ({ ...prev, amount: "0" }));
                return;
            }

            try {
                const price = await getSitePricing(selectedSiteId);
                setPricePerNight(price);

                const nights = differenceInDays(dates.endDate, dates.startDate);
                const total = price * nights;

                setFormData((prev) => ({
                    ...prev,
                    amount: total.toFixed(2),
                }));
            } catch (error) {
                console.error("Error calculating price:", error);
                setError("Failed to calculate price");
            }
        }

        calculateAmount();
    }, [selectedSiteId, dates.startDate, dates.endDate]);

    // Fetch sites and bookings when date range changes
    useEffect(() => {
        async function fetchData() {
            if (!dates.startDate || !dates.endDate) return;

            try {
                setLoading(true);
                setError(null);

                const [sitesData, bookingsData, reservationsData] =
                    await Promise.all([
                        getSites(),
                        getBookings(
                            format(dates.startDate, "yyyy-MM-dd"),
                            format(dates.endDate, "yyyy-MM-dd")
                        ),
                        getReservations(
                            format(dates.startDate, "yyyy-MM-dd"),
                            format(dates.endDate, "yyyy-MM-dd")
                        ),
                    ]);

                setSites(sitesData);
                setBookings(bookingsData);
                setReservations(reservationsData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load available sites");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [dates.startDate, dates.endDate]);

    const validateForm = () => {
        if (!formData.firstName || !formData.lastName) {
            setError("Please enter customer name");
            return false;
        }
        if (!formData.email) {
            setError("Please enter customer email");
            return false;
        }
        if (!formData.phone) {
            setError("Please enter customer phone");
            return false;
        }
        if (!dates.startDate || !dates.endDate) {
            setError("Please select dates");
            return false;
        }
        if (!selectedSiteId) {
            setError("Please select a site");
            return false;
        }
        return true;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDateChange = (field: "startDate" | "endDate", date: Date) => {
        setDates((prev) => ({
            ...prev,
            [field]: date,
        }));
    };

    const handleSiteSelect = (siteId: number) => {
        setSelectedSiteId(siteId);
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsSubmitting(true);
            setError(null);

            await createCustomerWithReservation(
                {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                },
                {
                    siteId: selectedSiteId!,
                    startDate: dates.startDate!,
                    endDate: dates.endDate!,
                    amount: parseFloat(formData.amount) || 0,
                }
            );

            onReservationCreated?.();
            onClose();
        } catch (error) {
            console.error("Error creating reservation:", error);
            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to create reservation"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
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
        handleSubmit,
    };
}
