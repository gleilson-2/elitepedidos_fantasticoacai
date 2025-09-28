/*
  # Sistema de Mesas - Tabelas para Lojas 1 e 2

  1. Novas Tabelas
    - `store1_tables` - Mesas da loja 1
    - `store1_table_sales` - Vendas das mesas da loja 1
    - `store1_table_sale_items` - Itens das vendas das mesas da loja 1
    - `store2_tables` - Mesas da loja 2
    - `store2_table_sales` - Vendas das mesas da loja 2
    - `store2_table_sale_items` - Itens das vendas das mesas da loja 2

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para operações CRUD

  3. Índices
    - Otimização para consultas frequentes
*/

-- =============================================
-- LOJA 1 - SISTEMA DE MESAS
-- =============================================

-- Tabela de mesas da loja 1
CREATE TABLE IF NOT EXISTS public.store1_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id uuid,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para store1_tables
CREATE INDEX IF NOT EXISTS idx_store1_tables_status ON public.store1_tables(status);
CREATE INDEX IF NOT EXISTS idx_store1_tables_number ON public.store1_tables(number);
CREATE INDEX IF NOT EXISTS idx_store1_tables_active ON public.store1_tables(is_active);

-- RLS para store1_tables
ALTER TABLE public.store1_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store1_tables" ON public.store1_tables
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de vendas das mesas da loja 1
CREATE TABLE IF NOT EXISTS public.store1_table_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES public.store1_tables(id) ON DELETE SET NULL,
  sale_number serial NOT NULL,
  operator_name text,
  customer_name text,
  customer_count integer NOT NULL DEFAULT 1,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_type text CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id uuid,
  notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para store1_table_sales
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_table_id ON public.store1_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_status ON public.store1_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_date ON public.store1_table_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_store1_table_sales_number ON public.store1_table_sales(sale_number);

-- RLS para store1_table_sales
ALTER TABLE public.store1_table_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store1_table_sales" ON public.store1_table_sales
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de itens das vendas das mesas da loja 1
CREATE TABLE IF NOT EXISTS public.store1_table_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.store1_table_sales(id) ON DELETE CASCADE,
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

-- Índices para store1_table_sale_items
CREATE INDEX IF NOT EXISTS idx_store1_table_sale_items_sale_id ON public.store1_table_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_store1_table_sale_items_product_code ON public.store1_table_sale_items(product_code);

-- RLS para store1_table_sale_items
ALTER TABLE public.store1_table_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store1_table_sale_items" ON public.store1_table_sale_items
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- LOJA 2 - SISTEMA DE MESAS
-- =============================================

-- Tabela de mesas da loja 2
CREATE TABLE IF NOT EXISTS public.store2_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL UNIQUE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'ocupada', 'aguardando_conta', 'limpeza')),
  current_sale_id uuid,
  location text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para store2_tables
CREATE INDEX IF NOT EXISTS idx_store2_tables_status ON public.store2_tables(status);
CREATE INDEX IF NOT EXISTS idx_store2_tables_number ON public.store2_tables(number);
CREATE INDEX IF NOT EXISTS idx_store2_tables_active ON public.store2_tables(is_active);

-- RLS para store2_tables
ALTER TABLE public.store2_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store2_tables" ON public.store2_tables
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de vendas das mesas da loja 2
CREATE TABLE IF NOT EXISTS public.store2_table_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES public.store2_tables(id) ON DELETE SET NULL,
  sale_number serial NOT NULL,
  operator_name text,
  customer_name text,
  customer_count integer NOT NULL DEFAULT 1,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  payment_type text CHECK (payment_type IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'cancelada')),
  cash_register_id uuid,
  notes text,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para store2_table_sales
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_table_id ON public.store2_table_sales(table_id);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_status ON public.store2_table_sales(status);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_date ON public.store2_table_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_store2_table_sales_number ON public.store2_table_sales(sale_number);

-- RLS para store2_table_sales
ALTER TABLE public.store2_table_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store2_table_sales" ON public.store2_table_sales
  FOR ALL USING (true) WITH CHECK (true);

-- Tabela de itens das vendas das mesas da loja 2
CREATE TABLE IF NOT EXISTS public.store2_table_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.store2_table_sales(id) ON DELETE CASCADE,
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

-- Índices para store2_table_sale_items
CREATE INDEX IF NOT EXISTS idx_store2_table_sale_items_sale_id ON public.store2_table_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_store2_table_sale_items_product_code ON public.store2_table_sale_items(product_code);

-- RLS para store2_table_sale_items
ALTER TABLE public.store2_table_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store2_table_sale_items" ON public.store2_table_sale_items
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- DADOS INICIAIS - MESAS PADRÃO
-- =============================================

-- Inserir mesas padrão para loja 1 (se não existirem)
INSERT INTO public.store1_tables (number, name, capacity, status) 
VALUES 
  (1, 'Mesa 1', 4, 'livre'),
  (2, 'Mesa 2', 4, 'livre'),
  (3, 'Mesa 3', 6, 'livre'),
  (4, 'Mesa 4', 2, 'livre'),
  (5, 'Mesa 5', 4, 'livre'),
  (6, 'Mesa 6', 8, 'livre')
ON CONFLICT (number) DO NOTHING;

-- Inserir mesas padrão para loja 2 (se não existirem)
INSERT INTO public.store2_tables (number, name, capacity, status) 
VALUES 
  (1, 'Mesa 1', 4, 'livre'),
  (2, 'Mesa 2', 4, 'livre'),
  (3, 'Mesa 3', 6, 'livre'),
  (4, 'Mesa 4', 2, 'livre'),
  (5, 'Mesa 5', 4, 'livre'),
  (6, 'Mesa 6', 8, 'livre')
ON CONFLICT (number) DO NOTHING;

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para store1_tables
DROP TRIGGER IF EXISTS update_store1_tables_updated_at ON public.store1_tables;
CREATE TRIGGER update_store1_tables_updated_at
    BEFORE UPDATE ON public.store1_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para store1_table_sales
DROP TRIGGER IF EXISTS update_store1_table_sales_updated_at ON public.store1_table_sales;
CREATE TRIGGER update_store1_table_sales_updated_at
    BEFORE UPDATE ON public.store1_table_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para store2_tables
DROP TRIGGER IF EXISTS update_store2_tables_updated_at ON public.store2_tables;
CREATE TRIGGER update_store2_tables_updated_at
    BEFORE UPDATE ON public.store2_tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers para store2_table_sales
DROP TRIGGER IF EXISTS update_store2_table_sales_updated_at ON public.store2_table_sales;
CREATE TRIGGER update_store2_table_sales_updated_at
    BEFORE UPDATE ON public.store2_table_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();