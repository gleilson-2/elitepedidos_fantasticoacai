/*
  # Criar tabela de produtos PDV

  1. Nova Tabela
    - `pdv_products`
      - `id` (uuid, primary key)
      - `code` (text, código único do produto)
      - `name` (text, nome do produto)
      - `category` (text, categoria)
      - `is_weighable` (boolean, produto pesável)
      - `unit_price` (numeric, preço unitário)
      - `price_per_gram` (numeric, preço por grama)
      - `image_url` (text, URL da imagem)
      - `stock_quantity` (integer, quantidade em estoque)
      - `min_stock` (integer, estoque mínimo)
      - `is_active` (boolean, produto ativo)
      - `barcode` (text, código de barras)
      - `description` (text, descrição)
      - `display_order` (integer, ordem de exibição)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `pdv_products`
    - Adicionar políticas para acesso público e autenticado
*/

CREATE TABLE IF NOT EXISTS pdv_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  is_weighable boolean DEFAULT false,
  unit_price numeric,
  price_per_gram numeric,
  image_url text,
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  barcode text,
  description text DEFAULT '',
  display_order integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pdv_products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de produtos PDV"
  ON pdv_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON pdv_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados"
  ON pdv_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdv_products_code ON pdv_products(code);
CREATE INDEX IF NOT EXISTS idx_pdv_products_category ON pdv_products(category);
CREATE INDEX IF NOT EXISTS idx_pdv_products_active ON pdv_products(is_active);
CREATE INDEX IF NOT EXISTS idx_pdv_products_barcode ON pdv_products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pdv_products_display_order ON pdv_products(display_order);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pdv_products_updated_at
    BEFORE UPDATE ON pdv_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir alguns produtos de demonstração
INSERT INTO pdv_products (code, name, category, is_weighable, unit_price, description, display_order) VALUES
('ACAI300ML', 'Açaí Premium 300ml', 'acai', false, 15.90, 'Açaí tradicional 300ml', 1),
('ACAI500ML', 'Açaí Premium 500ml', 'acai', false, 22.90, 'Açaí tradicional 500ml', 2),
('ACAI1KG', 'Açaí Premium 1kg (Pesável)', 'acai', true, null, 'Açaí tradicional vendido por peso', 3)
ON CONFLICT (code) DO NOTHING;

-- Atualizar preço por grama para produtos pesáveis
UPDATE pdv_products 
SET price_per_gram = 0.04499 
WHERE code = 'ACAI1KG' AND is_weighable = true;