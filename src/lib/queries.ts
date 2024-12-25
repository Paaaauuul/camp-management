import { supabase } from './supabase';
import { Site, Booking } from '../types';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
};

export async function getSites() {
  try {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name')
      .order('id');
    
    if (error) throw error;
    if (!data) throw new Error('No sites data received');
    
    return data as Site[];
  } catch (error) {
    handleSupabaseError(error, 'fetch sites');
    return [];
  }
}

export async function getCustomerById(customerId: number) {
  try {
    if (!customerId) throw new Error('Customer ID is required');

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch customer');
    return null;
  }
}

export async function createCustomer(customerData: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'create customer');
    return null;
  }
}

export async function updateCustomer(customerId: number, updates: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}) {
  try {
    if (!customerId) throw new Error('Customer ID is required');

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', customerId)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    handleSupabaseError(error, 'update customer');
    return null;
  }
}

export async function getReservations(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        site_id,
        start_date,
        end_date,
        customer_id,
        created_at,
        status,
        customers (
          first_name,
          last_name
        )
      `)
      .eq('status', 'pending')
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch reservations');
    return [];
  }
}

export async function getBookings(startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        site_id,
        start_date,
        end_date,
        customer_id,
        created_at,
        check_in_status,
        check_in_date,
        check_out_date,
        customers (
          first_name,
          last_name
        )
      `)
      .gte('start_date', startDate)
      .lte('end_date', endDate)
      .order('start_date');
    
    if (error) throw error;
    if (!data) throw new Error('No bookings data received');
    
    return data;
  } catch (error) {
    handleSupabaseError(error, 'fetch bookings');
    return [];
  }
}

export async function updateBooking(bookingId: number, updates: {
  start_date: string;
  end_date: string;
  site_id: number;
}) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    handleSupabaseError(error, 'update booking');
    return null;
  }
}

export async function updateBookingDetails(bookingId: number, updates: {
  start_date?: string;
  end_date?: string;
  site_id?: number;
  amount_owed?: number;
  amount_paid?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'update booking details');
    return null;
  }
}

export async function createBooking(bookingData: {
  site_id: number;
  customer_id: number;
  start_date: string;
  end_date: string;
}) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create booking: ${message}`);
  }
}

export async function createReservation(reservationData: {
  site_id: number;
  customer_id: number;
  start_date: string;
  end_date: string;
  amount: number;
}) {
  try {
    if (!reservationData.site_id || !reservationData.customer_id) {
      throw new Error('Missing required reservation data');
    }

    const { data, error } = await supabase
      .from('reservations')
      .insert([{
        site_id: reservationData.site_id,
        customer_id: reservationData.customer_id,
        start_date: reservationData.start_date,
        end_date: reservationData.end_date,
        amount_owed: reservationData.amount,
        status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw new Error(`Database error: ${error.message}`);
    if (!data) throw new Error('No data returned from reservation creation');
    
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to create reservation: ${message}`);
  }
}

export async function updateBookingCheckInStatus(bookingId: number, status: 'checked_in' | 'checked_out') {
  try {
    if (!bookingId) throw new Error('Booking ID is required');
    if (!status) throw new Error('Status is required');

    const { data, error } = await supabase
      .rpc('update_booking_check_in_status', {
        booking_id: bookingId,
        new_status: status
      });
    
    if (error) {
      // Handle specific error cases
      if (error.code === 'NTFND') {
        throw new Error('Booking not found');
      }
      if (error.code === 'INVST') {
        throw new Error(error.message);
      }
      throw new Error(`Failed to update check-in status: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No response from server');
    }
    
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(message);
  }
}

export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        bookings:bookings(
          id,
          start_date,
          end_date
        )
      `)
      .order('last_name, first_name');
    
    if (error) throw error;
    
    // Transform the data to include booking statistics
    return (data || []).map(customer => ({
      ...customer,
      times_booked: customer.bookings?.length || 0,
      last_stayed: customer.bookings?.length 
        ? customer.bookings.reduce((latest: string, booking: any) => {
            return booking.end_date > latest ? booking.end_date : latest;
          }, customer.bookings[0].end_date)
        : null
    }));
  } catch (error) {
    handleSupabaseError(error, 'fetch customers');
    return [];
  }
}

export async function updateReservation(reservationId: number, updates: {
  start_date: string;
  end_date: string;
  site_id: number;
  amount_owed?: number;
  amount_paid?: number;
}) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', reservationId)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    handleSupabaseError(error, 'update reservation');
    return null;
  }
}

export async function markReservationAsPaid(reservationId: number) {
  try {
    const { data, error } = await supabase
      .rpc('mark_reservation_as_paid', { reservation_id: reservationId });
    
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error, 'mark reservation as paid');
    return null;
  }
}

export async function getSitePricing(siteId: number) {
  try {
    const { data, error } = await supabase
      .from('site_pricing')
      .select('price_per_night')
      .eq('site_id', siteId)
      .single();
    
    if (error) throw error;
    return data?.price_per_night || 0;
  } catch (error) {
    handleSupabaseError(error, 'fetch site pricing');
    return 0;
  }
}

export async function getTodayBookings() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        site_id,
        start_date,
        end_date,
        check_in_status,
        check_in_date,
        check_out_date,
        sites (
          name
        ),
        customers (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .or(`start_date.eq.${today},end_date.eq.${today}`);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch today bookings');
    return [];
  }
}

export async function getCurrentCampers() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        site_id,
        start_date,
        end_date,
        check_in_status,
        check_in_date,
        check_out_date,
        sites (
          name
        ),
        customers (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('check_in_status', 'checked_in')
      .order('check_in_date');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error, 'fetch current campers');
    return [];
  }
}