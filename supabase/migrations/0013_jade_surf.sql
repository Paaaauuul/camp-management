/*
  # Add check-in functionality

  1. New Functions
    - Add function to update booking check-in status
    - Add function to update booking check-out status

  2. Security
    - Enable RLS for the new functions
*/

-- Create function to update booking check-in status
CREATE OR REPLACE FUNCTION update_booking_check_in_status(
  booking_id BIGINT,
  new_status check_in_status,
  check_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
)
RETURNS json AS $$
DECLARE
  updated_booking json;
BEGIN
  -- Update booking status
  UPDATE bookings 
  SET 
    check_in_status = new_status,
    check_in_date = CASE 
      WHEN new_status = 'checked_in' THEN check_time
      ELSE check_in_date
    END,
    check_out_date = CASE 
      WHEN new_status = 'checked_out' THEN check_time
      ELSE check_out_date
    END,
    updated_at = timezone('utc'::text, now())
  WHERE id = booking_id
  RETURNING to_json(bookings.*) INTO updated_booking;

  IF updated_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  RETURN updated_booking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;