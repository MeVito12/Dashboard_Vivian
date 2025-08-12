import { useProducts, useSales, useClients, useAppointments, useFinancial, useTransfers, useMoneyTransfers, useBranches, useCreateProduct, useCreateSale, useCreateClient, useCreateAppointment, useCreateFinancial, useCreateTransfer, useCreateMoneyTransfer, useCreateBranch, useCreateCartSale } from "@/hooks/useData";
import { useBranches as useBranchesHook } from "@/hooks/useBranches";
import { capitalizeWords } from "@/lib/utils";
import { useState } from 'react';
import { Pagination, usePagination } from "@/components/ui/pagination";
import { useAuth } from '@/contexts/AuthContext';
import { formatDateBR } from '@/utils/dateFormat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Search, Download, Mail, MessageCircle, Send, Settings, CreditCard, CheckCircle, Zap, Activity as ActivityIcon, ShoppingCart, Users, BarChart3, TrendingUp, DollarSign, Plus, Eye, Printer } from 'lucide-react';
import { format } from 'date-fns/format';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useCategory, categories } from '@/contexts/CategoryContext';
import PrintOptions from '@/components/PrintOptions';

import React from 'react';

const AtividadeSection = () => {
  const { selectedCategory } = useCategory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState('vendas');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados para impressão térmica
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSaleData, setPrintSaleData] = useState<any>(null);
  
  // Configurar datas automáticas (últimos 7 dias por padrão)
  const getDefaultDates = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      from: sevenDaysAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDates();
  const [dateFrom, setDateFrom] = useState<string>(defaultDates.from);
  const [dateTo, setDateTo] = useState<string>(defaultDates.to);

  const { user } = useAuth();
  const { selectedBranch } = useBranchesHook();
  const company_id = (user as any)?.company_id;
  // Padroniza leitura da categoria de negócio (camelCase) com fallback ao localStorage
  const businessCategory = (user as any)?.businessCategory ?? localStorage.getItem('userBusinessCategory') ?? 'general';
  
  // Dados das abas usando hooks reais
  const { data: sales = [] } = useSales(undefined, company_id);
  const { data: clients = [] } = useClients(undefined, company_id);
  const { data: products = [] } = useProducts(undefined, company_id);
  const { data: financialEntries = [] } = useFinancial(undefined, company_id);
  const { data: appointments = [] } = useAppointments(undefined, company_id);

  // Gerar atividades baseadas nos dados reais da empresa
  const systemActivities = React.useMemo(() => {
    const activities: any[] = [];
    
    // Adicionar vendas como atividades
    sales.forEach((sale: any) => {
      const product = products.find((p: any) => p.id === sale.product_id);
      const client = sale.client_id ? clients.find((c: any) => c.id === sale.client_id) : null;
      const clientName = client ? client.name : 'Cliente avulso';
      
      activities.push({
        id: `sale-${sale.id}`,
        action: 'Venda processada',
        description: `${product?.name || 'Produto'} - ${clientName} - R$ ${Number(sale.total_price || 0).toFixed(2)}`,
        timestamp: new Date(sale.sale_date || sale.created_at),
        status: 'success',
        user: capitalizeWords(user?.name || 'Sistema'),
        type: 'sale',
        category: businessCategory,
        time: new Date(sale.sale_date || sale.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Adicionar agendamentos como atividades
    appointments.forEach((appointment: any) => {
      activities.push({
        id: `appointment-${appointment.id}`,
        action: 'Agendamento confirmado',
        description: `${appointment.title} - ${appointment.status === 'completed' ? 'Realizado' : 'Agendado'}`,
        timestamp: new Date(appointment.appointment_date),
        status: appointment.status === 'completed' ? 'success' : 'pending',
        user: capitalizeWords(user?.name || 'Sistema'),
        type: 'appointment',
        category: businessCategory,
        time: appointment.start_time || '00:00'
      });
    });

    // Adicionar entradas financeiras manuais como atividades
    financialEntries.filter((entry: any) => entry.type === 'income' && (!entry.reference_type || entry.reference_type !== 'sale')).forEach((entry: any) => {
      activities.push({
        id: `manual-${entry.id}`,
        action: 'Receita registrada',
        description: `${entry.description} - R$ ${Number(entry.amount || 0).toFixed(2)}`,
        timestamp: new Date(entry.created_at),
        status: entry.status === 'paid' ? 'success' : 'pending',
        user: capitalizeWords(user?.name || 'Sistema'),
        type: 'financial',
        category: businessCategory,
        time: new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Adicionar algumas atividades de produto apenas se existirem produtos
    if (products.length > 0) {
      const recentProducts = products.slice(-3); // Últimos 3 produtos adicionados
      recentProducts.forEach((product: any) => {
        activities.push({
          id: `product-${product.id}`,
          action: 'Produto adicionado',
          description: `${product.name} cadastrado no estoque`,
          timestamp: new Date(product.created_at),
          status: 'success',
          user: capitalizeWords(user?.name || 'Sistema'),
          type: 'product',
          category: businessCategory,
          time: new Date(product.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
      });
    }

    // Ordenar por data mais recente
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, appointments, financialEntries, products, clients, user]);

  const stats = {
    total: systemActivities.length + (sales || []).length,
    success: systemActivities.filter(a => a.status === 'success').length + (sales || []).length,
    error: systemActivities.filter(a => a.status === 'error').length,
    pending: systemActivities.filter(a => a.status === 'pending').length,
    integrations: 5
  };

  const filteredActivities = systemActivities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Paginação para atividades
  const {
    currentItems: paginatedActivities,
    currentPage: activitiesCurrentPage,
    totalPages: activitiesTotalPages,
    totalItems: activitiesTotalItems,
    itemsPerPage: activitiesItemsPerPage,
    setCurrentPage: setActivitiesCurrentPage
  } = usePagination(filteredActivities, 10);

  // Tabs da seção
  const tabs = [
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'atividades', label: 'Logs', icon: ActivityIcon }
  ];

  // Métricas específicas da aba ativa
  const getTabMetrics = () => {
    if (activeTab === 'vendas') {
      return {
        metric1: { label: 'Vendas Hoje', value: `${(sales || []).length}`, change: `R$ ${(sales || []).reduce((sum: number, sale: any) => sum + (Number(sale.total_price) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'green' },
        metric2: { label: 'Total Vendas', value: (sales || []).length.toString(), change: 'Transações realizadas', icon: BarChart3, color: 'orange' }
      };
    } else if (activeTab === 'clientes') {
      return {
        metric1: { label: 'Clientes Ativos', value: (clients || []).length, change: 'Total cadastrados', icon: Users, color: 'purple' },
        metric2: { label: 'Taxa de Retenção', value: '85%', change: 'Média mensal', icon: TrendingUp, color: 'blue' }
      };
    } else if (activeTab === 'atividades') {
      return {
        metric1: { label: 'Total de Atividades', value: stats.total, change: 'Últimas 24h', icon: CheckCircle, color: 'blue' },
        metric2: { label: 'Sucessos', value: stats.success, change: `Taxa: ${Math.round((stats.success / stats.total) * 100)}%`, icon: CheckCircle, color: 'emerald' }
      };
    } else {
      return {
        metric1: { label: 'Relatórios Gerados', value: '47', change: 'Este mês', icon: BarChart3, color: 'blue' },
        metric2: { label: 'Exportações', value: '12', change: 'Esta semana', icon: Download, color: 'green' }
      };
    }
  };

  const metrics = getTabMetrics();

  // Funções para renderizar o conteúdo de cada aba
  const renderActivities = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Logs ({stats.total})
          </h3>
        </div>

        {/* Filtros abaixo do cabeçalho */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar atividades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data final"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn btn-outline"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="standard-list-container">
          <div className="standard-list-content">
            {paginatedActivities.map((activity) => (
              <div key={activity.id} className="standard-list-item group">
                <div className="list-item-main">
                  <div className="list-item-title">{activity.action}</div>
                  <div className="list-item-subtitle">{activity.description}</div>
                  <div className="list-item-meta flex items-center gap-2">
                    <span className={`list-status-badge ${
                      activity.status === 'success' ? 'status-success' :
                      activity.status === 'error' ? 'status-danger' :
                      activity.status === 'warning' ? 'status-warning' :
                      'status-info'
                    }`}>
                      {activity.status === 'success' ? 'Sucesso' :
                       activity.status === 'error' ? 'Erro' :
                       activity.status === 'warning' ? 'Aviso' : 'Info'}
                    </span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                    <span>•</span>
                    <span className="text-xs text-gray-500">Por: {activity.user}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="list-item-actions">
                    <button
                      onClick={() => {
                        console.log("Ver detalhes:", activity);
                      }}
                      className="list-action-button view"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Paginação para atividades */}
          {activitiesTotalPages > 1 && (
            <Pagination
              currentPage={activitiesCurrentPage}
              totalPages={activitiesTotalPages}
              onPageChange={setActivitiesCurrentPage}
              totalItems={activitiesTotalItems}
              itemsPerPage={activitiesItemsPerPage}
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderSales = () => {
    // Filtrar vendas por data e empresa
    const filteredSales = (sales || []).filter((sale: any) => {
      if (sale.company_id !== company_id) return false;
      if (dateFrom && sale.sale_date && sale.sale_date < dateFrom) return false;
      if (dateTo && sale.sale_date && sale.sale_date > dateTo + 'T23:59:59') return false;
      return true;
    });

    // Filtrar vendas manuais por data e empresa
    const manualSales = (financialEntries || []).filter((entry: any) => {
      if (entry.company_id !== company_id) return false;
      if (entry.type !== 'income') return false;
      if (!entry.description?.includes('Venda')) return false;
      if (dateFrom && entry.created_at && entry.created_at < dateFrom) return false;
      if (dateTo && entry.created_at && entry.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });
    
    const salesTotal = filteredSales.reduce((sum: number, sale: any) => {
      const amount = Number(sale.total_price || 0);
      return sum + amount;
    }, 0);
    const manualSalesTotal = manualSales.reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);
    const grandTotal = salesTotal + manualSalesTotal;

    return (
      <div className="animate-fade-in">
        <div className="main-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Vendas ({filteredSales.length + manualSales.length})
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total:</p>
              <p className="text-lg font-bold text-green-600">
                R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

        {/* Filtros abaixo do cabeçalho */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar vendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data final"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn btn-outline"
          >
            Limpar Filtros
          </button>
        </div>
        
        <div className="standard-list-container">
          <div className="standard-list-content">
            {/* Vendas automáticas */}
            {filteredSales.map((sale: any) => {
              const client = (clients || []).find((c: any) => c.id === sale.client_id);
              const product = (products || []).find((p: any) => p.id === sale.product_id);
              
              return (
                <div key={`sale-${sale.id}`} className="standard-list-item group">
                  <div className="list-item-main">
                    <div className="list-item-title">{client?.name || (sale.client_id ? `Cliente #${sale.client_id}` : 'Cliente avulso')}</div>
                    <div className="list-item-subtitle">{product?.name || `Produto #${sale.product_id}`} x{sale.quantity || 0}</div>
                    <div className="list-item-meta">
                      {sale.sale_date ? formatDateBR(sale.sale_date) : 'Data não disponível'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="list-status-badge status-success">Concluída</span>
                    
                    {/* Botão de impressão térmica - aparece no hover */}
                    <div className="list-item-actions">
                      <button
                        onClick={() => {
                          const saleForPrint = {
                            id: sale.id,
                            products: [{
                              name: product?.name || `Produto #${sale.product_id}`,
                              quantity: sale.quantity || 1,
                              price: Number(sale.unit_price || 0),
                              total: Number(sale.total_price || 0)
                            }],
                            total: Number(sale.total_price || 0),
                            paymentMethod: sale.payment_method || 'Não informado',
                            saleDate: sale.sale_date || new Date().toISOString(),
                            client: client
                          };
                          setPrintSaleData(saleForPrint);
                          setShowPrintModal(true);
                        }}
                        className="list-action-button print"
                        title="Imprimir comprovante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R$ {Number(sale.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Vendas manuais (entradas financeiras) */}
            {manualSales.map((entry: any) => {
              const client = (clients || []).find((c: any) => c.id === entry.client_id);
              return (
                <div key={`manual-${entry.id}`} className="standard-list-item group">
                  <div className="list-item-main">
                    <div className="list-item-title">{client?.name || 'Cliente avulso'}</div>
                    <div className="list-item-subtitle">{entry.description}</div>
                    <div className="list-item-meta">
                      {entry.created_at ? formatDateBR(entry.created_at) : 'Data não disponível'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="list-status-badge status-success">Concluída</span>
                    
                    {/* Botão de impressão térmica - aparece no hover */}
                    <div className="list-item-actions">
                      <button
                        onClick={() => {
                          const saleForPrint = {
                            id: entry.id,
                            products: [{
                              name: entry.description,
                              quantity: 1,
                              price: Number(entry.amount || 0),
                              total: Number(entry.amount || 0)
                            }],
                            total: Number(entry.amount || 0),
                            paymentMethod: 'Não informado',
                            saleDate: entry.created_at || new Date().toISOString(),
                            client: client
                          };
                          setPrintSaleData(saleForPrint);
                          setShowPrintModal(true);
                        }}
                        className="list-action-button print"
                        title="Imprimir comprovante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">R$ {Number(entry.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderClients = () => {
    // Filtrar clientes por empresa
    const filteredClients = (clients || []).filter((client: any) => client.company_id === company_id);

    // Filtrar vendas por data e empresa
    const filteredSales = (sales || []).filter((sale: any) => {
      if (sale.company_id !== company_id) return false;
      if (dateFrom && sale.sale_date && sale.sale_date < dateFrom) return false;
      if (dateTo && sale.sale_date && sale.sale_date > dateTo + 'T23:59:59') return false;
      return true;
    });

    // Filtrar vendas manuais por data e empresa
    const manualSales = (financialEntries || []).filter((entry: any) => {
      if (entry.company_id !== company_id) return false;
      if (entry.type !== 'income') return false;
      if (!entry.description?.includes('Venda')) return false;
      if (dateFrom && entry.created_at && entry.created_at < dateFrom) return false;
      if (dateTo && entry.created_at && entry.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });

    // Calcular total gasto por cliente (vendas automáticas + manuais)
    const clientsWithTotal = filteredClients.map((client: any) => {
      const clientSales = filteredSales.filter((sale: any) => sale.client_id === client.id);
      const clientManualSales = manualSales.filter((entry: any) => entry.client_id === client.id);
      
      const salesTotal = clientSales.reduce((sum: number, sale: any) => sum + (Number(sale.total_price) || 0), 0);
      const manualSalesTotal = clientManualSales.reduce((sum: number, entry: any) => sum + (Number(entry.amount) || 0), 0);
      const totalSpent = salesTotal + manualSalesTotal;
      
      return { ...client, totalSpent };
    });

    const grandTotalSpent = clientsWithTotal.reduce((sum: number, client: any) => sum + client.totalSpent, 0);

    return (
      <div className="animate-fade-in">
        <div className="main-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Clientes ({clientsWithTotal.length})
            </h3>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total gasto:</p>
              <p className="text-lg font-bold text-blue-600">
                R$ {grandTotalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

        {/* Filtros abaixo do cabeçalho */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data final"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn btn-outline"
          >
            Limpar Filtros
          </button>
        </div>
        
        <div className="standard-list-container">
          <div className="standard-list-content">
            {clientsWithTotal.map((client: any) => (
              <div key={client.id} className="standard-list-item group">
                <div className="list-item-main">
                  <div className="list-item-title">{capitalizeWords(client.name)}</div>
                  <div className="list-item-subtitle">{client.email}</div>
                  <div className="list-item-meta">{client.phone}</div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="list-status-badge status-success">Ativo</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">R$ {Number(client.totalSpent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderReports = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Relatórios
          </h3>
        </div>

        {/* Filtros abaixo do cabeçalho */}
        <div className="flex flex-wrap gap-4 items-center mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar relatórios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data inicial"
          />
          <input
            type="date"
            value={dateTo || ''}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Data final"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setDateFrom('');
              setDateTo('');
            }}
            className="btn btn-outline"
          >
            Limpar Filtros
          </button>
        </div>
        
        <div className="standard-list-container">
          <div className="standard-list-content">
            <div className="text-center py-8">
              <p className="text-gray-600">Relatórios disponíveis em breve.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Função para renderizar o conteúdo da aba selecionada
  const renderTabContent = () => {
    switch (activeTab) {
      case 'vendas':
        return renderSales();
      case 'clientes':
        return renderClients();
      case 'relatorios':
        return renderReports();
      case 'atividades':
        return renderActivities();
      default:
        return renderSales();
    }
  };

  return (
    <div className="app-section">
      <div className="section-header">
        <h1 className="section-title">Atividade</h1>
        <p className="section-subtitle">
          Monitore atividades, vendas, clientes e relatórios do seu negócio
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {Object.entries(metrics).slice(0, 2).map(([key, metric]) => (
          <div key={key} className="metric-card-standard">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                <p className={`text-xs mt-1 text-${metric.color}-600`}>{metric.change}</p>
              </div>
              <div className={`p-3 rounded-full bg-${metric.color}-100`}>
                <metric.icon className={`h-6 w-6 text-${metric.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navegação por abas - Padrão EstoqueSection */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba selecionada */}
      {renderTabContent()}

      {/* Modal de Impressão Térmica */}
      {showPrintModal && printSaleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col ml-48">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Imprimir Comprovante - Venda #{printSaleData.id}
              </h3>
              <button 
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <PrintOptions
                sale={printSaleData}
                company={{
                  name: user?.company?.name || "Sistema de Gestão",
                  cnpj: user?.company?.cnpj || "00.000.000/0001-00",
                  address: user?.company?.address || "Endereço não informado",
                  phone: user?.company?.phone || "(00) 00000-0000"
                }}
                branch={{
                  name: selectedBranch?.name || "Filial Principal",
                  address: selectedBranch?.address || "Endereço não informado",
                  phone: selectedBranch?.phone || "(00) 00000-0000"
                }}
                includeClient={!!printSaleData.client}
              />
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowPrintModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AtividadeSection;