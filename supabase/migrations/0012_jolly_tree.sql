/*
  # Add check-in status to bookings

  1. Changes
    - Add check_in_status enum type
    - Add check-in related columns to bookings table
    - Add constraints and indexes

  2. New Columns
    - check_in_status: enum ('pending', 'checked_in', 'checked_out')
    - check_in_date: timestamp with time zone
    - check_out_date: timestamp with time zone

  3. Constraints
    - check_out_date must be after check_in_date
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