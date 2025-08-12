import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, DollarSign } from 'lucide-react';

interface ClientDebtStatusProps {
  client: {
    debt_status?: 'regular' | 'debtor' | 'defaulter';
    overdue_amount?: number;
    overdue_installments_count?: number;
    first_overdue_date?: string;
  };
  showDetails?: boolean;
}

const ClientDebtStatus: React.FC<ClientDebtStatusProps> = ({ client, showDetails = false }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'defaulter':
        return {
          label: 'Inadimplente',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: AlertTriangle,
          iconColor: 'text-red-600'
        };
      case 'debtor':
        return {
          label: 'Devedor',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock,
          iconColor: 'text-yellow-600'
        };
      case 'regular':
      default:
        return {
          label: 'Regular',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        };
    }
  };

  const status = client.debt_status || 'regular';
  const config = getStatusConfig(status);
  const Icon = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysOverdue = (dateString: string) => {
    const overdue = new Date(dateString);
    const today = new Date();
    const diffTime = today.getTime() - overdue.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-2">
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {config.label}
      </Badge>

      {showDetails && status !== 'regular' && (
        <div className="text-xs text-gray-600 space-y-1">
          {client.overdue_amount && client.overdue_amount > 0 && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>Valor em atraso: {formatCurrency(client.overdue_amount)}</span>
            </div>
          )}
          
          {client.overdue_installments_count && client.overdue_installments_count > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {client.overdue_installments_count} parcela{client.overdue_installments_count > 1 ? 's' : ''} vencida{client.overdue_installments_count > 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          {client.first_overdue_date && (
            <div className="text-xs">
              <span>Primeira parcela vencida: {formatDate(client.first_overdue_date)}</span>
              <span className="ml-2 text-red-600">
                ({getDaysOverdue(client.first_overdue_date)} dias)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientDebtStatus;