/*
  # Add check-in status to bookings

  1. Changes
    - Add check_in_status enum type for tracking booking check-in states
    - Add check_in_status column to bookings table with default 'pending'
    - Add check_in_date and check_out_date columns to track actual dates

  2. Security
    - Maintain existing RLS policies
*/

-- Create enum for check-in status
CREATE TYPE check_in_status AS ENUM ('pending', 'checked_in', 'checked_out');

-- Add check-in related columns to bookings
ALTER TABLE bookings
ADD COLUMN check_in_status check_in_status NOT NULL DEFAULT 'pending',
ADD COLUMN check_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN check_out_date TIMESTAMP WITH TIME ZONE;

-- Create index for check-in status
CREATE INDEX idx_bookings_check_in_status ON bookings (check_in_status);

-- Add constraint to ensure check-out date is after check-in date
ALTER TABLE bookings
ADD CONSTRAINT check_dates_order 
CHECK (check_out_date IS NULL OR check_in_date IS NULL OR check_out_date > check_in_date);