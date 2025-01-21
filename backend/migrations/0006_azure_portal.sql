/*
  # Fix reservation trigger and booking creation

  1. Changes
    - Update handle_reservation_payment() function to remove guest_name dependency
    - Add created_at and updated_at to booking creation
    - Add proper error handling

  2. Security
    - Maintains existing RLS policies
*/

-- Update the trigger function to handle reservation confirmation without guest_name
CREATE OR REPLACE FUNCTION handle_reservation_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a reservation is marked as confirmed (payment received)
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Create a new booking
    INSERT INTO bookings (
      site_id,
      customer_id,
      start_date,
      end_date,
      amount,
      payment_status,
      reservation_id,
      created_at,
      updated_at
    ) VALUES (
      NEW.site_id,
      NEW.customer_id,
      NEW.start_date,
      NEW.end_date,
      NEW.amount,
      'paid',
      NEW.id,
      timezone('utc'::text, now()),
      timezone('utc'::text, now())
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create booking: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;