/*
  # Create delivery_products table

  1. New Tables
    - `delivery_products`
      - `id` (uuid, primary key)
      - `name` (text) - product name
      - `category` (text) - product category
      - `price` (numeric) - current price
      - `original_price` (numeric, optional) - original price for promotions
      - `description` (text) - product description
      - `image_url` (text, optional) - product image URL
      - `is_active` (boolean) - whether product is available
      - `is_weighable` (boolean) - whether product is sold by weight
      - `price_per_gram` (numeric, optional) - price per gram for weighable products
      - `complement_groups` (jsonb) - complement groups configuration
      - `sizes` (jsonb) - size options
      - `scheduled_days` (jsonb) - availability schedule
      - `availability_type` (text) - availability type
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `delivery_products` table
    - Add policy for public read access
    - Add policy for authenticated users to manage products
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('acai', 'combo', 'milkshake', 'vitamina', 'sorvetes', 'bebidas', 'complementos', 'sobremesas', 'outros')),
  price numeric NOT NULL CHECK (price >= 0),
  original_price numeric CHECK (original_price >= 0),
  description text NOT NULL DEFAULT '',
  image_url text,
  is_active boolean DEFAULT true NOT NULL,
  is_weighable boolean DEFAULT false NOT NULL,
  price_per_gram numeric CHECK (price_per_gram >= 0),
  complement_groups jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  scheduled_days jsonb DEFAULT '{}'::jsonb,
  availability_type text DEFAULT 'always',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_active ON delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_name ON delivery_products(name);

ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON delivery_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON delivery_products
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete access for authenticated users"
  ON delivery_products
  FOR DELETE
  TO authenticated
  USING (true);