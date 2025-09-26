/*
  # Create promotions table

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `product_id` (uuid) - reference to product
      - `product_name` (text) - product name for display
      - `original_price` (numeric) - original product price
      - `promotional_price` (numeric) - discounted price
      - `start_time` (timestamp) - when promotion starts
      - `end_time` (timestamp) - when promotion ends
      - `title` (text) - promotion title
      - `description` (text) - promotion description
      - `is_active` (boolean) - whether promotion is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `promotions` table
    - Add policy for public read access
    - Add policy for authenticated users to manage promotions
*/

CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  product_name text NOT NULL,
  original_price numeric NOT NULL CHECK (original_price >= 0),
  promotional_price numeric NOT NULL CHECK (promotional_price >= 0),
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT valid_promotion_period CHECK (end_time > start_time),
  CONSTRAINT valid_promotional_price CHECK (promotional_price < original_price)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_product_id ON promotions(product_id);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_time_range ON promotions(start_time, end_time);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON promotions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON promotions
  FOR DELETE
  TO authenticated
  USING (true);