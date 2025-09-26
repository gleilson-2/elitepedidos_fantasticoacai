/*
  # Criar tabela de produtos para delivery

  1. Nova Tabela
    - `delivery_products`
      - `id` (uuid, primary key)
      - `name` (text, nome do produto)
      - `category` (text, categoria do produto)
      - `price` (numeric, preço do produto)
      - `original_price` (numeric, preço original)
      - `description` (text, descrição)
      - `image_url` (text, URL da imagem)
      - `is_active` (boolean, produto ativo)
      - `is_weighable` (boolean, produto pesável)
      - `price_per_gram` (numeric, preço por grama)
      - `complement_groups` (jsonb, grupos de complementos)
      - `sizes` (jsonb, tamanhos disponíveis)
      - `scheduled_days` (jsonb, dias programados)
      - `availability_type` (text, tipo de disponibilidade)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `delivery_products`
    - Adicionar políticas para leitura pública e escrita autenticada
*/

CREATE TABLE IF NOT EXISTS delivery_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'outros',
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  description text DEFAULT '',
  image_url text,
  is_active boolean DEFAULT true,
  is_weighable boolean DEFAULT false,
  price_per_gram numeric,
  complement_groups jsonb DEFAULT '[]'::jsonb,
  sizes jsonb DEFAULT '[]'::jsonb,
  scheduled_days jsonb DEFAULT '{}'::jsonb,
  availability_type text DEFAULT 'always',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE delivery_products ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de produtos"
  ON delivery_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON delivery_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON delivery_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão para usuários autenticados"
  ON delivery_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_active ON delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_name ON delivery_products(name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_delivery_products_updated_at
    BEFORE UPDATE ON delivery_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();