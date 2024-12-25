-- Create function to get available sites
CREATE OR REPLACE FUNCTION get_available_sites(p_start_date DATE, p_end_date DATE)
RETURNS SETOF sites AS $$
BEGIN
  RETURN QUERY
  SELECT s.*
  FROM sites s
  WHERE NOT EXISTS (
    -- Check for overlapping bookings
    SELECT 1 FROM bookings b
    WHERE b.site_id = s.id
    AND b.start_date < p_end_date
    AND b.end_date > p_start_date
  )
  AND NOT EXISTS (
    -- Check for overlapping pending reservations
    SELECT 1 FROM reservations r
    WHERE r.site_id = s.id
    AND r.status = 'pending'
    AND r.start_date < p_end_date
    AND r.end_date > p_start_date
  )
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_available_sites(DATE, DATE) TO authenticated;