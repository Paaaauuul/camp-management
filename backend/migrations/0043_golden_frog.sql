-- Create function to check for overlapping bookings
CREATE OR REPLACE FUNCTION check_booking_overlap(
  p_site_id BIGINT,
  p_start_date DATE,
  p_end_date DATE,
  p_exclude_id BIGINT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check bookings
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE site_id = p_site_id
    AND id != COALESCE(p_exclude_id, -1)
    AND start_date < p_end_date
    AND end_date > p_start_date
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check pending reservations
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE site_id = p_site_id
    AND id != COALESCE(p_exclude_id, -1)
    AND status = 'pending'
    AND start_date < p_end_date
    AND end_date > p_start_date
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to prevent overlapping bookings
ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_bookings
CHECK (
  NOT EXISTS (
    SELECT 1 FROM bookings b2
    WHERE b2.id != id
    AND b2.site_id = site_id
    AND b2.start_date < end_date
    AND b2.end_date > start_date
  )
);

-- Add constraint to prevent overlapping reservations
ALTER TABLE reservations
ADD CONSTRAINT no_overlapping_reservations
CHECK (
  NOT EXISTS (
    SELECT 1 FROM reservations r2
    WHERE r2.id != id
    AND r2.site_id = site_id
    AND r2.status = 'pending'
    AND r2.start_date < end_date
    AND r2.end_date > start_date
  )
);