/*
  # Create Table Sales Schema

  1. New Tables
    - `store1_tables` - Restaurant tables for store 1
      - `id` (uuid, primary key)
      - `number` (integer, unique table number)
      - `name` (text, table display name)
      - `capacity` (integer, seating capacity)
      - `status` (text, current status: livre/ocupada/aguardando_conta/limpeza)
      - `current_sale_id` (uuid, reference to active sale)
      - `location` (text, optional location description)
      - `is_active` (boolean, whether table is in use)
      - `created_at`, `updated_at` (timestamps)

    - `store1_table_sales` - Sales records for table service
      - `id` (uuid, primary key)
      - `table_id` (uuid, reference to store1_tables)
      - `sale_number` (integer, auto-incrementing sale number)
      - `operator_name` (text, staff member name)
      - `customer_name` (text, customer name)
      - `customer_count` (integer, number of customers)
      - `subtotal`, `discount_amount`, `total_amount` (numeric, pricing)
      - `payment_type` (text, payment method)
      - `change_amount` (numeric, change given)
      - `status` (text, sale status: aberta/fechada/cancelada)
      - `cash_register_id` (uuid, reference to cash register)
      - `notes` (text, optional notes)
      - `opened_at`, `closed_at` (timestamps)
      - `created_at`, `updated_at` (timestamps)

    - `store1_table_sale_items` - Individual items within each sale
      - `id` (uuid, primary key)
      - `sale_id` (uuid, reference to store1_table_sales)
      - `product_code` (text, product identifier)
      - `product_name` (text, product name)
      - `quantity` (numeric, item quantity)
      - `weight_kg` (numeric, optional weight for weighable items)
      - `unit_price`, `price_per_gram` (numeric, pricing options)
      - `discount_amount` (numeric, item discount)
      - `subtotal` (numeric, item total)
      - `notes` (text, optional item notes)
      - `created_at` (timestamp)

    - Similar tables for store 2 (`store2_tables`, `store2_table_sales`, `store2_table_sale_items`)

  2. Sequences
    - `store1_sale_number_seq` - Auto-incrementing sale numbers for store 1
    - `store2_sale_number_seq` - Auto-incrementing sale numbers for store 2

  3. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage table sales
    - Add policies for public read access where appropriate

  4. Sample Data
    - Insert initial table records for both stores for testing
*/

-- Create sequences for sale numbers
CREATE SEQUENCE IF NOT EXISTS store1_sale_number_seq;
CREATE SEQUENCE IF NOT EXISTS store2_sale_number_seq;

-- Create store1_tables table
CREATE TABLE IF NOT EXISTS store1_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id UUID,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create store1_table_sales table
CREATE TABLE IF NOT EXISTS store1_table_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES store1_tables(id) ON DELETE CASCADE,
  sale_number INT NOT NULL UNIQUE DEFAULT nextval('store1_sale_number_seq'),
  operator_name TEXT,
  customer_name TEXT,
  customer_count INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_type TEXT CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id UUID,
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create store1_table_sale_items table
CREATE TABLE IF NOT EXISTS store1_table_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES store1_table_sales(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  weight_kg NUMERIC(10,3),
  unit_price NUMERIC(10,2),
  price_per_gram NUMERIC(10,4),
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create store2_tables table
CREATE TABLE IF NOT EXISTS store2_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id UUID,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create store2_table_sales table
CREATE TABLE IF NOT EXISTS store2_table_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES store2_tables(id) ON DELETE CASCADE,
  sale_number INT NOT NULL UNIQUE DEFAULT nextval('store2_sale_number_seq'),
  operator_name TEXT,
  customer_name TEXT,
  customer_count INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_type TEXT CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id UUID,
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create store2_table_sale_items table
CREATE TABLE IF NOT EXISTS store2_table_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES store2_table_sales(id) ON DELETE CASCADE,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  weight_kg NUMERIC(10,3),
  unit_price NUMERIC(10,2),
  price_per_gram NUMERIC(10,4),
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add foreign key constraints after all tables are created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_store1_current_sale'
  ) THEN
    ALTER TABLE store1_tables
    ADD CONSTRAINT fk_store1_current_sale
    FOREIGN KEY (current_sale_id) REFERENCES store1_table_sales(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_store2_current_sale'
  ) THEN
    ALTER TABLE store2_tables
    ADD CONSTRAINT fk_store2_current_sale
    FOREIGN KEY (current_sale_id) REFERENCES store2_table_sales(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_store1_tables_status ON store1_tables(status);
CREATE INDEX IF NOT EXISTS idx_store1_tables_number ON store1_tables(number);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_table_id ON store1_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_status ON store1_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_opened_at ON store1_table_sales(opened_at);
CREATE INDEX IF NOT EXISTS idx_store1_table_sale_items_sale_id ON store1_table_sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_store2_tables_status ON store2_tables(status);
CREATE INDEX IF NOT EXISTS idx_store2_tables_number ON store2_tables(number);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_table_id ON store2_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_status ON store2_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_opened_at ON store2_table_sales(opened_at);
CREATE INDEX IF NOT EXISTS idx_store2_table_sale_items_sale_id ON store2_table_sale_items(sale_id);

-- Enable RLS on all tables
ALTER TABLE store1_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_table_sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for store1_tables
CREATE POLICY "Allow public read access to store1_tables"
  ON store1_tables
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated access to store1_tables"
  ON store1_tables
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store1_tables"
  ON store1_tables
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store1_table_sales
CREATE POLICY "Allow authenticated access to store1_table_sales"
  ON store1_table_sales
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store1_table_sales"
  ON store1_table_sales
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store1_table_sale_items
CREATE POLICY "Allow authenticated access to store1_table_sale_items"
  ON store1_table_sale_items
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store1_table_sale_items"
  ON store1_table_sale_items
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store2_tables
CREATE POLICY "Allow public read access to store2_tables"
  ON store2_tables
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated access to store2_tables"
  ON store2_tables
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store2_tables"
  ON store2_tables
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store2_table_sales
CREATE POLICY "Allow authenticated access to store2_table_sales"
  ON store2_table_sales
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store2_table_sales"
  ON store2_table_sales
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store2_table_sale_items
CREATE POLICY "Allow authenticated access to store2_table_sale_items"
  ON store2_table_sale_items
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public operations on store2_table_sale_items"
  ON store2_table_sale_items
  FOR ALL
  TO public
  USING (true);

-- Insert sample data for store1_tables
INSERT INTO store1_tables (number, name, capacity, location) VALUES
(1, 'Mesa 1', 4, 'Área Principal'),
(2, 'Mesa 2', 4, 'Área Principal'),
(3, 'Mesa 3', 6, 'Área Principal'),
(4, 'Mesa 4', 2, 'Área VIP'),
(5, 'Mesa 5', 4, 'Área Externa'),
(6, 'Mesa 6', 8, 'Área Família')
ON CONFLICT (number) DO NOTHING;

-- Insert sample data for store2_tables
INSERT INTO store2_tables (number, name, capacity, location) VALUES
(1, 'Mesa 1', 4, 'Área Principal'),
(2, 'Mesa 2', 4, 'Área Principal'),
(3, 'Mesa 3', 6, 'Área Principal'),
(4, 'Mesa 4', 2, 'Área VIP'),
(5, 'Mesa 5', 4, 'Área Externa'),
(6, 'Mesa 6', 8, 'Área Família')
ON CONFLICT (number) DO NOTHING;