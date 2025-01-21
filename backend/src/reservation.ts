import { format } from 'date-fns';
import { createCustomer, createReservation } from './queries';

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ReservationData {
  siteId: number;
  startDate: Date;
  endDate: Date;
  amount: number;
}

export async function createCustomerWithReservation(
  customerData: CustomerData,
  reservationData: ReservationData
) {
  const newCustomer = await createCustomer({
    first_name: customerData.firstName,
    last_name: customerData.lastName,
    email: customerData.email,
    phone: customerData.phone
  });

  if (!newCustomer) {
    throw new Error('Failed to create customer record');
  }

  const reservation = await createReservation({
    site_id: reservationData.siteId,
    customer_id: newCustomer.id,
    start_date: format(reservationData.startDate, 'yyyy-MM-dd'),
    end_date: format(reservationData.endDate, 'yyyy-MM-dd'),
    amount: reservationData.amount
  });

  if (!reservation) {
    throw new Error('Failed to create reservation record');
  }

  return { customer: newCustomer, reservation };
}