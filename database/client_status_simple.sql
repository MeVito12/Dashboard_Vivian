-- Versão simplificada para Supabase - Adicionar campos de status de inadimplência aos clientes
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS debt_status VARCHAR(20) DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS debt_status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS overdue_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overdue_installments_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_overdue_date DATE;

-- Adicionar constraint para debt_status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_debt_status_check' 
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_debt_status_check 
        CHECK (debt_status IN ('regular', 'debtor', 'defaulter'));
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_debt_status ON clients(debt_status);
CREATE INDEX IF NOT EXISTS idx_clients_overdue_date ON clients(first_overdue_date);

-- Comentários para documentação
COMMENT ON COLUMN clients.debt_status IS 'Status de inadimplência: regular, debtor (devedor), defaulter (inadimplente)';
COMMENT ON COLUMN clients.debt_status_updated_at IS 'Data da última atualização do status';
COMMENT ON COLUMN clients.overdue_amount IS 'Valor total em atraso';
COMMENT ON COLUMN clients.overdue_installments_count IS 'Quantidade de parcelas em atraso';
COMMENT ON COLUMN clients.first_overdue_date IS 'Data da primeira parcela vencida';