/*
  # Remove guest_name column
  
  1. Changes
    - Remove guest_name column from bookings table since we now use customer relationship
    - Remove guest_name column from reservations table
*/

-- Remove guest_name column from bookings if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE bookings DROP COLUMN guest_name;
  END IF;
END $$;

-- Remove guest_name column from reservations if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reservations' AND column_name = 'guest_name'
  ) THEN
    ALTER TABLE reservations DROP COLUMN guest_name;
  END IF;
END $$;