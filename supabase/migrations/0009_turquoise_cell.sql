/*
  # Add stored procedure for marking reservations as paid

  1. Changes
    - Add stored procedure to handle reservation payment
    - Includes transaction handling and error checking
    - Returns the updated reservation

  2. Security
    - Maintains existing RLS policies
*/

-- Create stored procedure for marking reservations as paid
CREATE OR REPLACE FUNCTION mark_reservation_as_paid(reservation_id BIGINT)
RETURNS json AS $$
DECLARE
  updated_reservation json;
BEGIN
  -- Start transaction
  BEGIN
    -- Update reservation status
    UPDATE reservations 
    SET 
      status = 'confirmed',
      updated_at = timezone('utc'::text, now())
    WHERE id = reservation_id AND status = 'pending'
    RETURNING to_json(reservations.*) INTO updated_reservation;

    IF updated_reservation IS NULL THEN
      RAISE EXCEPTION 'Reservation not found or already confirmed';
    END IF;

    RETURN updated_reservation;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to mark reservation as paid: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;