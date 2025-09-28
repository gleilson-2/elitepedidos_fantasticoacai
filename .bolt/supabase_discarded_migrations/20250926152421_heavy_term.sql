/*
  # Criar tabela delivery_products

  1. Nova Tabela
    - `delivery_products`
      - `id` (uuid, primary key)
      - `name` (text, nome do produto)
      - `category` (text, categoria do produto)
      - `price` (numeric, preço do produto)
      - `original_price` (numeric, preço original para promoções)
      - `description` (text, descrição do produto)
      - `image_url` (text, URL da imagem)
      - `is_active` (boolean, se o produto está ativo)
      - `is_weighable` (boolean, se o produto é pesável)
      - `price_per_gram` (numeric, preço por grama para produtos pesáveis)
      - `complement_groups` (jsonb, grupos de complementos)
      - `sizes` (jsonb, tamanhos disponíveis)
      - `scheduled_days` (jsonb, dias programados)
      - `availability_type` (text, tipo de disponibilidade)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `delivery_products`
    - Adicionar políticas para leitura pública e modificação autenticada
*/

CREATE TABLE IF NOT EXISTS public.delivery_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text NOT NULL,
    price numeric NOT NULL,
    original_price numeric,
    description text,
    image_url text,
    is_active boolean DEFAULT TRUE NOT NULL,
    is_weighable boolean DEFAULT FALSE NOT NULL,
    price_per_gram numeric,
    complement_groups jsonb DEFAULT '[]'::jsonb,
    sizes jsonb DEFAULT '[]'::jsonb,
    scheduled_days jsonb,
    availability_type text DEFAULT 'always'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.delivery_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.delivery_products
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users" ON public.delivery_products
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.delivery_products
FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.delivery_products
FOR DELETE USING (auth.role() = 'authenticated');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_delivery_products_category ON public.delivery_products(category);
CREATE INDEX IF NOT EXISTS idx_delivery_products_is_active ON public.delivery_products(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_products_name ON public.delivery_products(name);