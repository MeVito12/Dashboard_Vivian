-- Script para atualização inicial dos status de inadimplência dos clientes
-- Execute este script após criar os campos na tabela clients

-- Atualizar status de todos os clientes baseado nas parcelas vencidas
WITH client_debt_summary AS (
  SELECT 
    s.client_id,
    COUNT(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
    SUM(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.amount ELSE 0 END) as overdue_amount,
    MIN(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.due_date END) as first_overdue_date
  FROM sales s
  LEFT JOIN installments i ON s.id = i.sale_id
  WHERE s.client_id IS NOT NULL
  GROUP BY s.client_id
),
client_status_calc AS (
  SELECT 
    client_id,
    overdue_count,
    COALESCE(overdue_amount, 0) as overdue_amount,
    first_overdue_date,
    CASE 
      WHEN first_overdue_date IS NULL THEN 'regular'
      WHEN first_overdue_date < CURRENT_DATE - INTERVAL '90 days' THEN 'defaulter'
      WHEN overdue_count > 0 THEN 'debtor'
      ELSE 'regular'
    END as new_debt_status
  FROM client_debt_summary
)
UPDATE clients 
SET 
  debt_status = csc.new_debt_status,
  debt_status_updated_at = NOW(),
  overdue_amount = csc.overdue_amount,
  overdue_installments_count = COALESCE(csc.overdue_count, 0),
  first_overdue_date = csc.first_overdue_date
FROM client_status_calc csc
WHERE clients.id = csc.client_id;

-- Verificar resultados
SELECT 
  debt_status,
  COUNT(*) as client_count,
  SUM(overdue_amount) as total_overdue_amount
FROM clients 
WHERE debt_status IS NOT NULL
GROUP BY debt_status
ORDER BY 
  CASE debt_status 
    WHEN 'regular' THEN 1 
    WHEN 'debtor' THEN 2 
    WHEN 'defaulter' THEN 3 
  END;