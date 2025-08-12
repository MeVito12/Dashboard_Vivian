import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAllClientStatus() {
  console.log('🔄 Iniciando atualização de status de inadimplência...');
  
  try {
    // Buscar todos os clientes que têm vendas
    const { data: clientsWithSales, error: clientsError } = await supabase
      .from('sales')
      .select('client_id')
      .not('client_id', 'is', null);

    if (clientsError) {
      console.error('❌ Erro ao buscar clientes:', clientsError);
      return;
    }

    const uniqueClientIds = [...new Set(clientsWithSales.map(s => s.client_id))];
    console.log(`📊 Encontrados ${uniqueClientIds.length} clientes com vendas`);

    let updatedCount = 0;
    let regularCount = 0;
    let debtorCount = 0;
    let defaulterCount = 0;

    for (const clientId of uniqueClientIds) {
      try {
        // Buscar parcelas vencidas do cliente
        const { data: overdueInstallments, error: installmentsError } = await supabase
          .from('installments')
          .select(`
            *,
            sales!inner(client_id)
          `)
          .eq('sales.client_id', clientId)
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString().split('T')[0]);

        if (installmentsError) {
          console.error(`❌ Erro ao buscar parcelas do cliente ${clientId}:`, installmentsError);
          continue;
        }

        let debtStatus = 'regular';
        let overdueAmount = 0;
        let overdueCount = 0;
        let firstOverdueDate = null;

        if (overdueInstallments && overdueInstallments.length > 0) {
          // Calcular valores em atraso
          overdueAmount = overdueInstallments.reduce((sum, installment) => sum + installment.amount, 0);
          overdueCount = overdueInstallments.length;
          
          // Encontrar a primeira data de vencimento
          const sortedDates = overdueInstallments
            .map(i => new Date(i.due_date))
            .sort((a, b) => a.getTime() - b.getTime());
          
          firstOverdueDate = sortedDates[0];
          
          // Calcular status baseado no tempo da primeira parcela vencida
          const daysSinceFirstOverdue = Math.floor((Date.now() - firstOverdueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceFirstOverdue >= 90) { // 3 meses = 90 dias
            debtStatus = 'defaulter'; // Inadimplente
            defaulterCount++;
          } else {
            debtStatus = 'debtor'; // Devedor
            debtorCount++;
          }
        } else {
          regularCount++;
        }

        // Atualizar o cliente
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            debt_status: debtStatus,
            debt_status_updated_at: new Date().toISOString(),
            overdue_amount: overdueAmount,
            overdue_installments_count: overdueCount,
            first_overdue_date: firstOverdueDate ? firstOverdueDate.toISOString().split('T')[0] : null
          })
          .eq('id', clientId);

        if (updateError) {
          console.error(`❌ Erro ao atualizar cliente ${clientId}:`, updateError);
        } else {
          updatedCount++;
        }

      } catch (error) {
        console.error(`❌ Erro ao processar cliente ${clientId}:`, error);
      }
    }

    console.log('✅ Atualização concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Clientes atualizados: ${updatedCount}`);
    console.log(`   - Regulares: ${regularCount}`);
    console.log(`   - Devedores: ${debtorCount}`);
    console.log(`   - Inadimplentes: ${defaulterCount}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllClientStatus();
}

export { updateAllClientStatus };