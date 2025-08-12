import { useMemo } from 'react';
import { useProducts, useSales, useClients, useFinancial } from '@/hooks/useData';

interface UnifiedMetricsProps {
  company_id: string; // UUID string
  date_from?: string;
  date_to?: string;
}

export const useUnifiedMetrics = ({ company_id, date_from, date_to }: UnifiedMetricsProps) => {
  // Buscar dados usando hooks existentes
  const { data: sales = [] } = useSales(undefined, company_id);
  const { data: financial_entries = [] } = useFinancial(undefined, company_id);

  // Função para filtrar por data
  const filterByDateRange = (data: any[], dateField: string) => {
    if (!data || !Array.isArray(data)) return [];
    if (!date_from && !date_to) return data;
    
    return data.filter(item => {
      const itemValue = item[dateField];
      if (!itemValue) return false;
      
      const itemDate = new Date(itemValue);
      const from_date = date_from ? new Date(date_from) : new Date('1900-01-01');
      const to_date = date_to ? new Date(date_to + 'T23:59:59') : new Date('2100-12-31');
      
      if (isNaN(itemDate.getTime())) {
        return false;
      }
      
      return itemDate >= from_date && itemDate <= to_date;
    });
  };

  // Calcular métricas unificadas
  const metrics = useMemo(() => {
    // Filtrar vendas por data
    const filtered_sales = filterByDateRange(sales, 'sale_date');
    
    // Filtrar entradas financeiras por data
    const filtered_financial_entries = filterByDateRange(financial_entries, 'created_at');
    
    // Calcular total de vendas automáticas
    const total_vendas = filtered_sales.reduce((sum: number, sale: any) => 
      sum + (Number(sale.total_price) || 0), 0
    );
    
    // Calcular total de receitas (entradas financeiras de income)
    const total_receitas = filtered_financial_entries
      .filter((entry: any) => entry.type === 'income')
      .reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);
    
    // Calcular despesas
    const total_despesas = filtered_financial_entries
      .filter((entry: any) => entry.type === 'expense')
      .reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);
    
    // Total combinado (vendas + receitas)
    const total_combinado = total_vendas + total_receitas;
    
    return {
      // Valores principais
      total_vendas,
      total_receitas,
      total_despesas,
      total_combinado,
      
      // Contadores
      vendas_count: filtered_sales.length,
      receitas_count: filtered_financial_entries.filter((e: any) => e.type === 'income').length,
      despesas_count: filtered_financial_entries.filter((e: any) => e.type === 'expense').length,
      
      // Dados originais filtrados
      filtered_sales,
      filtered_financial_entries,
      
      // Para debugging
      debug: {
        total_vendas,
        total_receitas,
        total_combinado,
        vendas: filtered_sales.length,
        receitas: filtered_financial_entries.filter((e: any) => e.type === 'income').length,
        company_id,
        filtro_data: `${date_from} até ${date_to}`
      }
    };
  }, [sales, financial_entries, date_from, date_to, company_id]);

  return metrics;
};