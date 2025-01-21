/*
  # Add timestamps to bookings table

  1. Changes
    - Add created_at and updated_at columns to bookings table
    - Add trigger for updating updated_at timestamp
    - Update existing rows with current timestamp

  2. Security
    - Maintains existing RLS policies
*/

-- Add timestamp columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows with current timestamp
UPDATE bookings 
SET 
  created_at = timezone('utc'::text, now()),
  updated_at = timezone('utc'::text, now())
WHERE created_at IS NULL OR updated_at IS NULL;