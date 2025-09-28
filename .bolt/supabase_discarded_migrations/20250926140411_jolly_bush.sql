/*
  # Create PDV helper functions

  1. Functions
    - `get_pdv_cash_summary` - Get cash register summary with sales data
    - `close_pdv_cash_register` - Close cash register with calculations
    - `get_cash_register_history` - Get historical cash register data
    - `handle_customer_balance` - Handle customer balance updates (already exists)

  2. Security
    - Functions are accessible to authenticated users
*/

-- Function to get PDV cash summary
CREATE OR REPLACE FUNCTION get_pdv_cash_summary(p_register_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  register_data record;
  sales_total numeric := 0;
  delivery_total numeric := 0;
  other_income_total numeric := 0;
  total_expense numeric := 0;
  expected_balance numeric := 0;
BEGIN
  -- Get register data
  SELECT * INTO register_data
  FROM pdv_cash_registers
  WHERE id = p_register_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Register not found');
  END IF;
  
  -- Calculate sales total (PDV sales)
  SELECT COALESCE(SUM(amount), 0) INTO sales_total
  FROM pdv_cash_entries
  WHERE register_id = p_register_id
    AND type = 'income'
    AND description LIKE 'Venda #%';
  
  -- Calculate delivery total
  SELECT COALESCE(SUM(amount), 0) INTO delivery_total
  FROM pdv_cash_entries
  WHERE register_id = p_register_id
    AND type = 'income'
    AND description LIKE 'Delivery #%';
  
  -- Calculate other income
  SELECT COALESCE(SUM(amount), 0) INTO other_income_total
  FROM pdv_cash_entries
  WHERE register_id = p_register_id
    AND type = 'income'
    AND description NOT LIKE 'Venda #%'
    AND description NOT LIKE 'Delivery #%';
  
  -- Calculate total expenses
  SELECT COALESCE(SUM(amount), 0) INTO total_expense
  FROM pdv_cash_entries
  WHERE register_id = p_register_id
    AND type = 'expense';
  
  -- Calculate expected balance
  expected_balance := register_data.opening_amount + sales_total + delivery_total + other_income_total - total_expense;
  
  -- Build result
  result := json_build_object(
    'success', true,
    'data', json_build_object(
      'opening_amount', register_data.opening_amount,
      'sales_total', sales_total,
      'delivery_total', delivery_total,
      'other_income_total', other_income_total,
      'total_income', sales_total + delivery_total + other_income_total,
      'total_expense', total_expense,
      'expected_balance', expected_balance,
      'actual_balance', COALESCE(register_data.closing_amount, expected_balance),
      'difference', COALESCE(register_data.closing_amount, expected_balance) - expected_balance,
      'sales_count', (
        SELECT COUNT(*)
        FROM pdv_cash_entries
        WHERE register_id = p_register_id
          AND type = 'income'
          AND description LIKE 'Venda #%'
      ),
      'delivery_count', (
        SELECT COUNT(*)
        FROM pdv_cash_entries
        WHERE register_id = p_register_id
          AND type = 'income'
          AND description LIKE 'Delivery #%'
      ),
      'total_all_sales', sales_total + delivery_total,
      'sales', json_build_object()
    )
  );
  
  RETURN result;
END;
$$;

-- Function to close PDV cash register
CREATE OR REPLACE FUNCTION close_pdv_cash_register(p_register_id uuid, p_closing_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  register_data record;
  summary_data json;
  expected_balance numeric;
  difference_amount numeric;
BEGIN
  -- Get register data
  SELECT * INTO register_data
  FROM pdv_cash_registers
  WHERE id = p_register_id AND closed_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Active register not found');
  END IF;
  
  -- Get summary to calculate expected balance
  summary_data := get_pdv_cash_summary(p_register_id);
  
  IF (summary_data->>'success')::boolean = false THEN
    RETURN summary_data;
  END IF;
  
  expected_balance := (summary_data->'data'->>'expected_balance')::numeric;
  difference_amount := p_closing_amount - expected_balance;
  
  -- Update register with closing data
  UPDATE pdv_cash_registers
  SET 
    closing_amount = p_closing_amount,
    closed_at = now(),
    difference = difference_amount
  WHERE id = p_register_id;
  
  RETURN json_build_object(
    'success', true,
    'data', json_build_object(
      'register_id', p_register_id,
      'closing_amount', p_closing_amount,
      'expected_balance', expected_balance,
      'difference', difference_amount,
      'closed_at', now()
    )
  );
END;
$$;

-- Function to get cash register history
CREATE OR REPLACE FUNCTION get_cash_register_history(start_date date, end_date date, limit_count integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  opening_amount numeric,
  closing_amount numeric,
  opened_at timestamptz,
  closed_at timestamptz,
  difference numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.opening_amount,
    r.closing_amount,
    r.opened_at,
    r.closed_at,
    r.difference
  FROM pdv_cash_registers r
  WHERE r.opened_at::date BETWEEN start_date AND end_date
  ORDER BY r.opened_at DESC
  LIMIT limit_count;
END;
$$;