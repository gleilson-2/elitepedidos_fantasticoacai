/*
  # Criar tabela de movimentações de caixa PDV

  1. Nova Tabela
    - `pdv_cash_entries`
      - `id` (uuid, primary key)
      - `register_id` (uuid, referência ao caixa)
      - `type` (text, tipo: income/expense)
      - `amount` (numeric, valor da movimentação)
      - `description` (text, descrição)
      - `payment_method` (text, método de pagamento)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela `pdv_cash_entries`
    - Adicionar políticas para acesso público e autenticado

  3. Relacionamentos
    - Chave estrangeira para `pdv_cash_registers`
*/

CREATE TABLE IF NOT EXISTS pdv_cash_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id uuid NOT NULL REFERENCES pdv_cash_registers(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  payment_method text DEFAULT 'dinheiro' CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'voucher', 'misto')),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE pdv_cash_entries ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Permitir leitura pública de movimentações"
  ON pdv_cash_entries
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados"
  ON pdv_cash_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização para usuários autenticados"
  ON pdv_cash_entries
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_register_id ON pdv_cash_entries(register_id);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_type ON pdv_cash_entries(type);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_created_at ON pdv_cash_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_pdv_cash_entries_payment_method ON pdv_cash_entries(payment_method);