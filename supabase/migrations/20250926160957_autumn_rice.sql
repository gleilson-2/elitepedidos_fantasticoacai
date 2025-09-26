/*
  # Criar tabela pesagem_temp para integração da balança

  1. Nova Tabela
    - `pesagem_temp`
      - `id` (serial, primary key)
      - `peso` (numeric, peso da balança)
      - `criado_em` (timestamp, data/hora da pesagem)

  2. Segurança
    - Habilitar RLS na tabela `pesagem_temp`
    - Adicionar política para permitir acesso público completo
*/

CREATE TABLE IF NOT EXISTS pesagem_temp (
  id SERIAL PRIMARY KEY,
  peso NUMERIC NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE pesagem_temp ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso público completo
CREATE POLICY "Permitir acesso público completo"
  ON pesagem_temp
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Criar índice para otimizar consultas por data
CREATE INDEX IF NOT EXISTS idx_pesagem_temp_criado_em 
  ON pesagem_temp (criado_em DESC);