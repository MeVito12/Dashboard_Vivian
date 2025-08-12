-- Adicionar campos de status de inadimplência aos clientes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS debt_status VARCHAR(20) DEFAULT 'regular' CHECK (debt_status IN ('regular', 'debtor', 'defaulter')),
ADD COLUMN IF NOT EXISTS debt_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS overdue_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overdue_installments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_overdue_date DATE;

-- Comentários para documentação
COMMENT ON COLUMN clients.debt_status IS 'Status de inadimplência: regular, debtor (devedor), defaulter (inadimplente)';
COMMENT ON COLUMN clients.debt_status_updated_at IS 'Data da última atualização do status';
COMMENT ON COLUMN clients.overdue_amount IS 'Valor total em atraso';
COMMENT ON COLUMN clients.overdue_installments_count IS 'Quantidade de parcelas em atraso';
COMMENT ON COLUMN clients.first_overdue_date IS 'Data da primeira parcela vencida';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_debt_status ON clients(debt_status);
CREATE INDEX IF NOT EXISTS idx_clients_overdue_date ON clients(first_overdue_date);

-- Função para atualizar status de inadimplência automaticamente
CREATE OR REPLACE FUNCTION update_client_debt_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta função será chamada quando uma parcela for atualizada
    -- Recalcular o status do cliente baseado nas parcelas
    
    WITH client_debt_info AS (
        SELECT 
            s.client_id,
            COUNT(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN 1 END) as overdue_count,
            SUM(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.amount ELSE 0 END) as overdue_amount,
            MIN(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.due_date END) as first_overdue_date,
            CASE 
                WHEN MIN(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.due_date END) IS NULL THEN 'regular'
                WHEN MIN(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.due_date END) < CURRENT_DATE - INTERVAL '90 days' THEN 'defaulter'
                WHEN COUNT(CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN 1 END) > 0 THEN 'debtor'
                ELSE 'regular'
            END as new_status
        FROM sales s
        JOIN installments i ON s.id = i.sale_id
        WHERE s.client_id = COALESCE(NEW.client_id, OLD.client_id)
        GROUP BY s.client_id
    )
    UPDATE clients 
    SET 
        debt_status = cdi.new_status,
        debt_status_updated_at = NOW(),
        overdue_amount = COALESCE(cdi.overdue_amount, 0),
        overdue_installments_count = COALESCE(cdi.overdue_count, 0),
        first_overdue_date = cdi.first_overdue_date
    FROM client_debt_info cdi
    WHERE clients.id = cdi.client_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar status quando parcelas forem modificadas
DROP TRIGGER IF EXISTS trigger_update_client_debt_status ON installments;
CREATE TRIGGER trigger_update_client_debt_status
    AFTER INSERT OR UPDATE OR DELETE ON installments
    FOR EACH ROW
    EXECUTE FUNCTION update_client_debt_status();

-- Triggers separados para INSERT, UPDATE e DELETE em sales
DROP TRIGGER IF EXISTS trigger_update_client_debt_status_sales_insert ON sales;
CREATE TRIGGER trigger_update_client_debt_status_sales_insert
    AFTER INSERT ON sales
    FOR EACH ROW
    WHEN (NEW.client_id IS NOT NULL)
    EXECUTE FUNCTION update_client_debt_status();

DROP TRIGGER IF EXISTS trigger_update_client_debt_status_sales_update ON sales;
CREATE TRIGGER trigger_update_client_debt_status_sales_update
    AFTER UPDATE ON sales
    FOR EACH ROW
    WHEN (OLD.client_id IS DISTINCT FROM NEW.client_id OR NEW.client_id IS NOT NULL OR OLD.client_id IS NOT NULL)
    EXECUTE FUNCTION update_client_debt_status();

DROP TRIGGER IF EXISTS trigger_update_client_debt_status_sales_delete ON sales;
CREATE TRIGGER trigger_update_client_debt_status_sales_delete
    AFTER DELETE ON sales
    FOR EACH ROW
    WHEN (OLD.client_id IS NOT NULL)
    EXECUTE FUNCTION update_client_debt_status();