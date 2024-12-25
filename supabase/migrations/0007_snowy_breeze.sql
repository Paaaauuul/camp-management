/*
  # Fix reservation trigger and booking creation

  1. Changes
    - Update handle_reservation_payment() function to properly handle booking creation
    - Add proper error handling
    - Ensure all required fields are set

  2. Security
    - Maintains existing RLS policies
*/

-- Drop and recreate the trigger function with proper error handling
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
    -- Log the error details
    RAISE WARNING 'Error in handle_reservation_payment: %', SQLERRM;
    -- Re-raise the exception with a clear message
    RAISE EXCEPTION 'Failed to create booking: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;