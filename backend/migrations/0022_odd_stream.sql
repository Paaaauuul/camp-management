/*
  # Fix Site Types Migration

  1. Changes
    - Remove existing constraints
    - Update existing sites with proper values
    - Re-add constraints
    
  2. Security
    - Maintain existing RLS policies
*/

-- First remove the problematic constraints if they exist
DO $$ BEGIN
  ALTER TABLE sites DROP CONSTRAINT IF EXISTS valid_amp_service;
  ALTER TABLE sites DROP CONSTRAINT IF EXISTS valid_dimensions;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Update all existing sites to be RV sites with proper values
UPDATE sites
SET
  site_type = 'rv',
  has_water = true,
  has_electricity = true,
  has_sewer = true,
  max_length = 40,
  max_width = 12,
  amp_service = 30,
  pad_type = 'gravel',
  description = 'Standard RV site with full hookups';

-- Now add the constraints back
ALTER TABLE sites
ADD CONSTRAINT valid_amp_service
CHECK (
  (site_type = 'tent' AND amp_service IS NULL) OR
  (site_type IN ('rv', 'mobile_home') AND amp_service IN (30, 50))
);

ALTER TABLE sites
ADD CONSTRAINT valid_dimensions
CHECK (
  (site_type = 'tent' AND max_length IS NULL AND max_width IS NULL) OR
  (site_type IN ('rv', 'mobile_home') AND max_length IS NOT NULL AND max_width IS NOT NULL)
);

-- Create some example tent sites
INSERT INTO sites (name, site_type, has_water, has_electricity, pad_type, description)
VALUES 
  ('T1', 'tent', true, true, 'grass', 'Tent site with water and electric'),
  ('T2', 'tent', true, true, 'grass', 'Tent site with water and electric'),
  ('T3', 'tent', false, false, 'grass', 'Primitive tent site');

-- Create some example mobile home sites
INSERT INTO sites (
  name, 
  site_type, 
  has_water, 
  has_electricity, 
  has_sewer,
  max_length,
  max_width,
  amp_service,
  pad_type,
  description
)
VALUES 
  ('MH1', 'mobile_home', true, true, true, 60, 15, 50, 'concrete', 'Large mobile home site with full hookups'),
  ('MH2', 'mobile_home', true, true, true, 60, 15, 50, 'concrete', 'Large mobile home site with full hookups');