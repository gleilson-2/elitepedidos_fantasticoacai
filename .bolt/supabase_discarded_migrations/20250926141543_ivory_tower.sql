/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `customer_address` (text)
      - `customer_neighborhood` (text)
      - `customer_complement` (text)
      - `payment_method` (text)
      - `change_for` (numeric)
      - `neighborhood_id` (uuid)
      - `delivery_fee` (numeric)
      - `estimated_delivery_minutes` (integer)
      - `delivery_type` (text)
      - `scheduled_pickup_date` (date)
      - `scheduled_pickup_time` (text)
      - `items` (jsonb)
      - `total_price` (numeric)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `estimated_delivery` (timestamp)
      - `channel` (text)
      - `cash_register_id` (uuid)

  2. Security
    - Enable RLS on `orders` table
    - Add policies for public access to orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  customer_phone text,
  customer_address text,
  customer_neighborhood text,
  customer_complement text,
  payment_method text,
  change_for numeric DEFAULT 0,
  neighborhood_id uuid,
  delivery_fee numeric DEFAULT 0,
  estimated_delivery_minutes integer,
  delivery_type text DEFAULT 'delivery',
  scheduled_pickup_date date,
  scheduled_pickup_time text,
  items jsonb DEFAULT '[]',
  total_price numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  estimated_delivery timestamptz,
  channel text DEFAULT 'web',
  cash_register_id uuid
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public access for orders management
CREATE POLICY "Enable read access for all users"
  ON orders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_cash_register ON orders(cash_register_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);

-- Add constraints for validation
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'));

ALTER TABLE orders ADD CONSTRAINT orders_delivery_type_check 
  CHECK (delivery_type IN ('delivery', 'pickup', 'dine_in'));

ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'card', 'pix', 'credit', 'debit'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_users_updated_at 
  BEFORE UPDATE ON attendance_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();