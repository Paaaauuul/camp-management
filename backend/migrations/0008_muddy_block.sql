/*
  # Fix guest_name references and update trigger

  1. Changes
    - Remove any remaining guest_name references
    - Update trigger function to handle reservation confirmation properly
    - Add proper error handling

  2. Security
    - Maintains existing RLS policies
*/

-- Drop and recreate the trigger function without guest_name references
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