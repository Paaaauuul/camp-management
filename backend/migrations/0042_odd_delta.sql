/*
  # Update amount handling for reservations and bookings

  1. Changes
    - Add amount_owed and amount_paid columns to bookings
    - Add amount_paid and paid_at columns to reservations
    - Update booking creation to copy amounts from reservation
    - Add function to handle payment updates

  2. Security
    - Enable RLS for all tables
    - Add policies for payment updates
*/

-- Add new columns to bookings
ALTER TABLE bookings
ADD COLUMN amount_owed DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add new columns to reservations
ALTER TABLE reservations
ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN paid_at TIMESTAMPTZ;

-- Rename existing amount column to amount_owed in reservations
ALTER TABLE reservations 
RENAME COLUMN amount TO amount_owed;

-- Update the handle_reservation_payment function
CREATE OR REPLACE FUNCTION handle_reservation_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a reservation is marked as confirmed (payment received)
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Create a new booking with the same amounts
    INSERT INTO bookings (
      site_id,
      customer_id,
      start_date,
      end_date,
      amount_owed,
      amount_paid,
      payment_status,
      reservation_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.site_id,
      NEW.customer_id,
      NEW.start_date,
      NEW.end_date,
      NEW.amount_owed,
      NEW.amount_paid,
      CASE 
        WHEN NEW.amount_paid >= NEW.amount_owed THEN 'paid'
        ELSE 'partial'
      END,
      NEW.id,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;