/*
  # Create Table Sales Schema

  1. New Tables
    - `store1_tables` - Restaurant tables for store 1
    - `store1_table_sales` - Sales records for table service in store 1  
    - `store1_table_sale_items` - Individual items within table sales for store 1
    - `store2_tables` - Restaurant tables for store 2
    - `store2_table_sales` - Sales records for table service in store 2
    - `store2_table_sale_items` - Individual items within table sales for store 2

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated access to sales tables
    - Add policies for public read access to tables (for status display)

  3. Features
    - Auto-incrementing sale numbers
    - Foreign key relationships between tables, sales, and items
    - Support for different table statuses (livre, ocupada, aguardando_conta, limpeza)
    - Integration with existing cash register system
*/

-- Create sequence for store1 table sale numbers
CREATE SEQUENCE IF NOT EXISTS store1_table_sales_sale_number_seq;

-- Create sequence for store2 table sale numbers  
CREATE SEQUENCE IF NOT EXISTS store2_table_sales_sale_number_seq;

-- Create store1_table_sales table first (referenced by store1_tables)
CREATE TABLE IF NOT EXISTS store1_table_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid,
  sale_number integer DEFAULT nextval('store1_table_sales_sale_number_seq'),
  operator_name text,
  customer_name text,
  customer_count integer DEFAULT 1,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_type text CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id uuid REFERENCES pdv_cash_registers(id),
  notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store1_table_sale_items table
CREATE TABLE IF NOT EXISTS store1_table_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES store1_table_sales(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 1,
  weight_kg numeric(10,3),
  unit_price numeric(10,2),
  price_per_gram numeric(10,4),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create store1_tables table (references store1_table_sales)
CREATE TABLE IF NOT EXISTS store1_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id uuid REFERENCES store1_table_sales(id),
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store2_table_sales table
CREATE TABLE IF NOT EXISTS store2_table_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid,
  sale_number integer DEFAULT nextval('store2_table_sales_sale_number_seq'),
  operator_name text,
  customer_name text,
  customer_count integer DEFAULT 1,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_type text CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id uuid REFERENCES pdv2_cash_registers(id),
  notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store2_table_sale_items table
CREATE TABLE IF NOT EXISTS store2_table_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES store2_table_sales(id) ON DELETE CASCADE,
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity numeric(10,3) NOT NULL DEFAULT 1,
  weight_kg numeric(10,3),
  unit_price numeric(10,2),
  price_per_gram numeric(10,4),
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  subtotal numeric(10,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create store2_tables table (references store2_table_sales)
CREATE TABLE IF NOT EXISTS store2_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id uuid REFERENCES store2_table_sales(id),
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_store1_tables_status ON store1_tables(status);
CREATE INDEX IF NOT EXISTS idx_store1_tables_number ON store1_tables(number);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_table_id ON store1_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_status ON store1_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store1_table_sale_items_sale_id ON store1_table_sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_store2_tables_status ON store2_tables(status);
CREATE INDEX IF NOT EXISTS idx_store2_tables_number ON store2_tables(number);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_table_id ON store2_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_status ON store2_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store2_table_sale_items_sale_id ON store2_table_sale_items(sale_id);

-- Enable Row Level Security
ALTER TABLE store1_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store1_table_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_table_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE store2_table_sale_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for store1 tables
CREATE POLICY "Allow public read access to store1_tables"
  ON store1_tables
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to store1_tables"
  ON store1_tables
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public access to store1_table_sales"
  ON store1_table_sales
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to store1_table_sale_items"
  ON store1_table_sale_items
  FOR ALL
  TO public
  USING (true);

-- Create RLS policies for store2 tables
CREATE POLICY "Allow public read access to store2_tables"
  ON store2_tables
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated write access to store2_tables"
  ON store2_tables
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Allow public access to store2_table_sales"
  ON store2_table_sales
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to store2_table_sale_items"
  ON store2_table_sale_items
  FOR ALL
  TO public
  USING (true);

-- Insert some sample tables for store1
INSERT INTO store1_tables (number, name, capacity, location) VALUES
  (1, 'Mesa 1', 4, 'Área Principal'),
  (2, 'Mesa 2', 4, 'Área Principal'),
  (3, 'Mesa 3', 6, 'Área Principal'),
  (4, 'Mesa 4', 2, 'Área VIP'),
  (5, 'Mesa 5', 4, 'Área Externa'),
  (6, 'Mesa 6', 4, 'Área Externa'),
  (7, 'Mesa 7', 8, 'Área de Grupos'),
  (8, 'Mesa 8', 4, 'Área Principal')
ON CONFLICT (number) DO NOTHING;

-- Insert some sample tables for store2
INSERT INTO store2_tables (number, name, capacity, location) VALUES
  (1, 'Mesa 1', 4, 'Área Principal'),
  (2, 'Mesa 2', 4, 'Área Principal'),
  (3, 'Mesa 3', 6, 'Área Principal'),
  (4, 'Mesa 4', 2, 'Área VIP'),
  (5, 'Mesa 5', 4, 'Área Externa'),
  (6, 'Mesa 6', 4, 'Área Externa')
ON CONFLICT (number) DO NOTHING;