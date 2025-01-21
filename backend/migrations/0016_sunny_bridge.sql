/*
  # Add check-in functionality

  1. Security
    - Add RLS policy for updating check-in status
    - Add security definer to RPC function

  2. Functions
    - Create RPC function for updating check-in status
    - Add proper error handling and validation
*/

-- Enable RLS on bookings if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for updating bookings
CREATE POLICY "Enable update for all users" ON bookings
  FOR UPDATE USING (true);

-- Create or replace the check-in function with better error handling
CREATE OR REPLACE FUNCTION update_booking_check_in_status(
  booking_id BIGINT,
  new_status check_in_status,
  check_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
)
RETURNS json AS $$
DECLARE
  booking_record bookings;
  updated_booking json;
BEGIN
  -- First check if booking exists
  SELECT * INTO booking_record
  FROM bookings
  WHERE id = booking_id;

  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Booking not found' USING ERRCODE = 'NTFND';
  END IF;

  -- Validate status transitions
  IF booking_record.check_in_status = 'checked_out' AND new_status != 'checked_out' THEN
    RAISE EXCEPTION 'Cannot change status of checked out booking' USING ERRCODE = 'INVST';
  END IF;

  -- Update booking status with validation
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

  RETURN updated_booking;
EXCEPTION
  WHEN OTHERS THEN
    -- Include error code in message for better client handling
    RAISE EXCEPTION 'Failed to update booking status: %', SQLERRM
    USING ERRCODE = SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;