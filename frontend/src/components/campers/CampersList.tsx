import React from "react";
import { format, parseISO } from "date-fns";
import { ChevronRight, Copy } from "lucide-react";
import { CamperDetails } from "../camper-details/CamperDetails";
import { getCustomers } from "@backend/queries";
import { CampersTableSkeleton } from "./CampersTableSkeleton";

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    times_booked: number;
    last_stayed: string | null;
    bookings: Array<{
        id: number;
        start_date: string;
        end_date: string;
    }>;
}

export function CampersList() {
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] =
        React.useState<Customer | null>(null);

    React.useEffect(() => {
        async function loadCustomers() {
            try {
                const data = await getCustomers();
                setCustomers(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load customers"
                );
            } finally {
                setLoading(false);
            }
        }

        loadCustomers();
    }, []);

    const handleCopyPhone = (phone: string) => {
        navigator.clipboard.writeText(phone);
    };

    if (loading) {
        return <CampersTableSkeleton />;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                                Name
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                                Email
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                                Phone
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                                Times booked
                            </th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-900">
                                Spent
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-900">
                                Last stayed
                            </th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => {
                            return (
                                <tr
                                    key={customer.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                    onClick={() =>
                                        setSelectedCustomer(customer)
                                    }
                                >
                                    <td className="py-3 px-4">
                                        {customer.first_name}{" "}
                                        {customer.last_name}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {customer.email}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() =>
                                                handleCopyPhone(customer.phone)
                                            }
                                            className="flex items-center text-gray-600 hover:text-gray-900"
                                            title="Click to copy"
                                        >
                                            {customer.phone}
                                            <Copy className="ml-1.5 h-4 w-4 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {customer.times_booked}
                                    </td>
                                    <td className="py-3 px-4 text-right text-gray-600">
                                        $0.00
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">
                                        {customer.last_stayed
                                            ? format(
                                                  parseISO(
                                                      customer.last_stayed
                                                  ),
                                                  "MM-dd-yyyy"
                                              )
                                            : "-"}
                                    </td>
                                    <td className="py-3 px-4">
                                        <ChevronRight className="h-5 w-5 text-gray-400" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {selectedCustomer && (
                <CamperDetails
                    customer={selectedCustomer}
                    onClose={() => setSelectedCustomer(null)}
                />
            )}
        </div>
    );
}
