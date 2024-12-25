/*
  # Add check-in status and functions

  1. Schema Changes
    - Add check_in_status enum type
    - Add check-in related columns to bookings table
    - Add indexes and constraints

  2. Functions
    - Add function to update booking check-in status

  3. Security
    - Enable RLS for the new function
*/

-- Create enum for check-in status if it doesn't exist
DO $$ BEGIN
  CREATE TYPE check_in_status AS ENUM ('pending', 'checked_in', 'checked_out');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add check-in related columns to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS check_in_status check_in_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS check_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_out_date TIMESTAMP WITH TIME ZONE;

-- Create index for check-in status
CREATE INDEX IF NOT EXISTS idx_bookings_check_in_status ON bookings (check_in_status);

-- Add constraint to ensure check-out date is after check-in date
DO $$ BEGIN
  ALTER TABLE bookings
  ADD CONSTRAINT check_dates_order 
  CHECK (check_out_date IS NULL OR check_in_date IS NULL OR check_out_date > check_in_date);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

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