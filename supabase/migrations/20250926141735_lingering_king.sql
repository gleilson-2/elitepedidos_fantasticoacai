/*
  # Criar tabela de caixas PDV

  1. Nova Tabela
    - `pdv_cash_registers`
      - `id` (uuid, primary key)
      - `opening_amount` (numeric, valor de abertura)
      - `closing_amount` (numeric, valor de fechamento)
      - `opened_at` (timestamp, data/hora de abertura)
      - `closed_at` (timestamp, data/hora de fechamento)
      - `difference` (numeric, diferença entre esperado e real)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `pdv_cash_registers`
    - Adicionar políticas para acesso público e autenticado
*/

CREATE TABLE IF NOT EXISTS pdv_cash_registers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  difference numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pdv_cash_registers ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de caixas"
  ON pdv_cash_registers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_cash_registers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON pdv_cash_registers
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_opened_at ON pdv_cash_registers(opened_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_closed_at ON pdv_cash_registers(closed_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_registers_open ON pdv_cash_registers(closed_at) WHERE closed_at IS NULL;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pdv_cash_registers_updated_at
    BEFORE UPDATE ON pdv_cash_registers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();