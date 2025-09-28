/*
  # Create PDV (Point of Sale) tables

  1. New Tables
    - `pdv_operators`
      - `id` (uuid, primary key)
      - `name` (text) - operator name
      - `code` (text, unique) - operator code for login
      - `is_active` (boolean) - whether operator is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp, optional)

    - `pdv_cash_registers`
      - `id` (uuid, primary key)
      - `opening_amount` (numeric) - initial cash amount
      - `closing_amount` (numeric, optional) - final cash amount
      - `opened_at` (timestamp) - when register was opened
      - `closed_at` (timestamp, optional) - when register was closed
      - `difference` (numeric, optional) - difference between expected and actual

    - `pdv_cash_entries`
      - `id` (uuid, primary key)
      - `register_id` (uuid) - reference to cash register
      - `type` (text) - 'income' or 'expense'
      - `amount` (numeric) - entry amount
      - `description` (text) - entry description
      - `payment_method` (text) - payment method used
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all PDV tables
    - Add policies for public read access and authenticated write access
*/

-- PDV Operators table
CREATE TABLE IF NOT EXISTS pdv_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  last_login timestamptz
);

CREATE INDEX IF NOT EXISTS idx_pdv_operators_code ON pdv_operators(code);
CREATE INDEX IF NOT EXISTS idx_pdv_operators_active ON pdv_operators(is_active);

ALTER TABLE pdv_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON pdv_operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON pdv_operators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON pdv_operators
  FOR UPDATE
  TO authenticated
  USING (true);

-- PDV Cash Registers table
CREATE TABLE IF NOT EXISTS pdv_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_amount numeric NOT NULL DEFAULT 0 CHECK (opening_amount >= 0),
  closing_amount numeric CHECK (closing_amount >= 0),
  opened_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz,
  difference numeric DEFAULT 0,
  CONSTRAINT valid_register_period CHECK (closed_at IS NULL OR closed_at > opened_at)
);

CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_opened_at ON pdv_cash_registers(opened_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_status ON pdv_cash_registers(closed_at) WHERE closed_at IS NULL;

ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON pdv_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON pdv_cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON pdv_cash_registers
  FOR UPDATE
  TO authenticated
  USING (true);

-- PDV Cash Entries table
CREATE TABLE IF NOT EXISTS pdv_cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES pdv_cash_registers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  payment_method text DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'voucher', 'misto')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_register_id ON pdv_cash_entries(register_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_type ON pdv_cash_entries(type);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_created_at ON pdv_cash_entries(created_at);

ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON pdv_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON pdv_cash_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON pdv_cash_entries
  FOR UPDATE
  TO authenticated
  USING (true);