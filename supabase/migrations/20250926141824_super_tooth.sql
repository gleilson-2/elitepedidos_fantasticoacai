/*
  # Criar tabelas de vendas PDV

  1. Novas Tabelas
    - `pdv_sales` (vendas principais)
    - `pdv_sale_items` (itens das vendas)

  2. Segurança
    - Habilitar RLS nas tabelas
    - Adicionar políticas para acesso público e autenticado

  3. Relacionamentos
    - Chaves estrangeiras apropriadas
*/

-- Tabela de vendas PDV
CREATE TABLE IF NOT EXISTS pdv_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number text UNIQUE NOT NULL,
  operator_id uuid REFERENCES pdv_operators(id),
  customer_name text,
  customer_phone text,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_type text DEFAULT 'none' CHECK (discount_type IN ('none', 'percentage', 'amount')),
  discount_value numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  change_for numeric,
  change_amount numeric DEFAULT 0,
  channel text DEFAULT 'pdv' CHECK (channel IN ('pdv', 'delivery', 'pickup')),
  is_cancelled boolean DEFAULT false,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES pdv_operators(id),
  cancel_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens das vendas
CREATE TABLE IF NOT EXISTS pdv_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES pdv_sales(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES pdv_products(id),
  product_code text NOT NULL,
  product_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  weight numeric,
  unit_price numeric,
  price_per_gram numeric,
  discount numeric DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pdv_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdv_sale_items ENABLE ROW LEVEL SECURITY;

-- Políticas para pdv_sales
CREATE POLICY "Permitir leitura pública de vendas"
  ON pdv_sales
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_sales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON pdv_sales
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Políticas para pdv_sale_items
CREATE POLICY "Permitir leitura pública de itens"
  ON pdv_sale_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_sale_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdv_sales_sale_number ON pdv_sales(sale_number);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_operator_id ON pdv_sales(operator_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_created_at ON pdv_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_channel ON pdv_sales(channel);
CREATE INDEX IF NOT EXISTS idx_pdv_sales_cancelled ON pdv_sales(is_cancelled);

CREATE INDEX IF NOT EXISTS idx_pdv_sale_items_sale_id ON pdv_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_pdv_sale_items_product_id ON pdv_sale_items(product_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pdv_sales_updated_at
    BEFORE UPDATE ON pdv_sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para gerar número de venda sequencial
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS text AS $$
DECLARE
    next_number integer;
    sale_number text;
BEGIN
    -- Buscar o próximo número sequencial
    SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM '[0-9]+') AS integer)), 0) + 1
    INTO next_number
    FROM pdv_sales
    WHERE sale_number ~ '^[0-9]+$';
    
    -- Formatar com zeros à esquerda
    sale_number := LPAD(next_number::text, 6, '0');
    
    RETURN sale_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar número de venda automaticamente
CREATE OR REPLACE FUNCTION set_sale_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_number IS NULL OR NEW.sale_number = '' THEN
        NEW.sale_number := generate_sale_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_pdv_sale_number
    BEFORE INSERT ON pdv_sales
    FOR EACH ROW
    EXECUTE FUNCTION set_sale_number();