/*
  # Create store_hours table

  1. New Tables
    - `store_hours`
      - `id` (uuid, primary key)
      - `day_of_week` (integer, unique) - 0=Sunday, 1=Monday, etc.
      - `is_open` (boolean) - whether store is open on this day
      - `open_time` (text) - opening time in HH:MM format
      - `close_time` (text) - closing time in HH:MM format
      - `temporary_closure_message` (text, optional) - message for temporary closures
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `store_hours` table
    - Add policy for public read access
    - Add policy for authenticated users to update
*/

CREATE TABLE IF NOT EXISTS store_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open boolean DEFAULT true NOT NULL,
  open_time text NOT NULL,
  close_time text NOT NULL,
  temporary_closure_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE store_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON store_hours
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable update access for authenticated users"
  ON store_hours
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON store_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create store_settings table for global store configuration
CREATE TABLE IF NOT EXISTS store_settings (
  id text PRIMARY KEY DEFAULT 'default',
  store_name text DEFAULT 'Elite Açaí',
  cnpj text,
  phone text,
  address text,
  delivery_fee numeric DEFAULT 5.00,
  min_order_value numeric DEFAULT 15.00,
  estimated_delivery_time integer DEFAULT 35,
  is_open_now boolean DEFAULT true,
  global_closure_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON store_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable update access for authenticated users"
  ON store_settings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON store_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);