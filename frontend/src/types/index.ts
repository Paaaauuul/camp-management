export interface Site {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: number;
  site_id: number;
  start_date: string;
  end_date: string;
  customer_id: number;
  created_at: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount?: number;
}

export interface Booking {
  id: number;
  site_id: number;
  start_date: string;
  end_date: string;
  customer_id: number;
  created_at: string;
  check_in_status: 'pending' | 'checked_in' | 'checked_out';
  check_in_date?: string;
  check_out_date?: string;
}

export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}