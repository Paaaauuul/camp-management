/*
  # Create site pricing table

  1. New Tables
    - `site_pricing`
      - `id` (bigint, primary key)
      - `site_id` (bigint, references sites.id)
      - `price_per_night` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `site_pricing` table
    - Add policy for public read access
*/

-- Create site pricing table
CREATE TABLE IF NOT EXISTS site_pricing (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  site_id BIGINT REFERENCES sites(id) NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL DEFAULT 35.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(site_id)
);

-- Insert default pricing for all existing sites
INSERT INTO site_pricing (site_id, price_per_night)
SELECT id, 35.00
FROM sites
ON CONFLICT (site_id) DO NOTHING;

-- Enable RLS
ALTER TABLE site_pricing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access"
  ON site_pricing FOR SELECT
  USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_site_pricing_updated_at
  BEFORE UPDATE ON site_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();