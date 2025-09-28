/*
  # Criar tabela de operadores PDV

  1. Nova Tabela
    - `pdv_operators`
      - `id` (uuid, primary key)
      - `name` (text, nome do operador)
      - `code` (text, código único)
      - `is_active` (boolean, operador ativo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `last_login` (timestamp, último login)

  2. Segurança
    - Habilitar RLS na tabela `pdv_operators`
    - Adicionar políticas para acesso público e autenticado
*/

CREATE TABLE IF NOT EXISTS pdv_operators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Habilitar RLS
ALTER TABLE pdv_operators ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de operadores"
  ON pdv_operators
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_operators
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON pdv_operators
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdv_operators_code ON pdv_operators(code);
CREATE INDEX IF NOT EXISTS idx_pdv_operators_active ON pdv_operators(is_active);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pdv_operators_updated_at
    BEFORE UPDATE ON pdv_operators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir operador padrão
INSERT INTO pdv_operators (name, code, is_active) 
VALUES ('Administrador', 'ADMIN', true)
ON CONFLICT (code) DO NOTHING;