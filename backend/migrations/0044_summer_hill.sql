-- Drop existing constraints that use subqueries
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_bookings;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS no_overlapping_reservations;

-- Create function to check for overlapping dates
CREATE OR REPLACE FUNCTION prevent_date_overlap()
RETURNS TRIGGER AS $$
DECLARE
  overlap_exists BOOLEAN;
BEGIN
  -- For bookings table
  IF TG_TABLE_NAME = 'bookings' THEN
    SELECT EXISTS (
      SELECT 1 FROM bookings
      WHERE site_id = NEW.site_id
      AND id != COALESCE(NEW.id, -1)
      AND start_date < NEW.end_date
      AND end_date > NEW.start_date
    ) INTO overlap_exists;

    IF overlap_exists THEN
      RAISE EXCEPTION 'Booking dates overlap with existing booking';
    END IF;
  END IF;

  -- For reservations table
  IF TG_TABLE_NAME = 'reservations' THEN
    -- Only check for pending reservations
    IF NEW.status = 'pending' THEN
      SELECT EXISTS (
        SELECT 1 FROM reservations
        WHERE site_id = NEW.site_id
        AND id != COALESCE(NEW.id, -1)
        AND status = 'pending'
        AND start_date < NEW.end_date
        AND end_date > NEW.start_date
      ) INTO overlap_exists;

      IF overlap_exists THEN
        RAISE EXCEPTION 'Reservation dates overlap with existing pending reservation';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS check_booking_overlap ON bookings;
CREATE TRIGGER check_booking_overlap
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION prevent_date_overlap();

DROP TRIGGER IF EXISTS check_reservation_overlap ON reservations;
CREATE TRIGGER check_reservation_overlap
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_date_overlap();

-- Create indexes to improve overlap checking performance
CREATE INDEX IF NOT EXISTS idx_bookings_site_dates 
ON bookings(site_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reservations_site_dates 
ON reservations(site_id, start_date, end_date)
WHERE status = 'pending';