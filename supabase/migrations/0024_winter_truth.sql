/*
  # Fix Site Types Migration

  1. New Types
    - Create site_type enum
    - Add site type and amenities columns
    - Add constraints for different site types
  
  2. Changes
    - Update existing sites with proper values
    - Add example sites for each type
    
  3. Security
    - Maintain existing RLS policies
*/

-- Create site type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE site_type AS ENUM ('tent', 'rv', 'mobile_home');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to sites table if they don't exist
DO $$ BEGIN
  ALTER TABLE sites
  ADD COLUMN site_type site_type NOT NULL DEFAULT 'rv',
  ADD COLUMN has_water boolean NOT NULL DEFAULT false,
  ADD COLUMN has_electricity boolean NOT NULL DEFAULT false,
  ADD COLUMN has_sewer boolean NOT NULL DEFAULT false,
  ADD COLUMN max_length integer,
  ADD COLUMN max_width integer,
  ADD COLUMN amp_service integer CHECK (amp_service IN (30, 50)),
  ADD COLUMN pad_type text,
  ADD COLUMN description text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- Create index for site type if it doesn't exist
DO $$ BEGIN
  CREATE INDEX idx_sites_type ON sites (site_type);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update existing sites with proper values
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
  description = 'Standard RV site with full hookups'
WHERE site_type = 'rv' OR site_type IS NULL;

-- Add constraints if they don't exist
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create example tent sites
INSERT INTO sites (name, site_type, has_water, has_electricity, pad_type, description)
VALUES 
  ('T1', 'tent', true, true, 'grass', 'Tent site with water and electric'),
  ('T2', 'tent', true, true, 'grass', 'Tent site with water and electric'),
  ('T3', 'tent', false, false, 'grass', 'Primitive tent site')
ON CONFLICT (name) DO NOTHING;

-- Create example mobile home sites
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
  ('MH2', 'mobile_home', true, true, true, 60, 15, 50, 'concrete', 'Large mobile home site with full hookups')
ON CONFLICT (name) DO NOTHING;