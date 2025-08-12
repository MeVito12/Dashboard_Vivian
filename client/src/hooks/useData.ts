// Hook consolidado para operações de dados
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SessionManager } from '@/utils/sessionManager';

import type { 
  Product, NewProduct,
  Category, NewCategory,
  Subcategory, NewSubcategory,
  Sale, NewSale, 
  Client, NewClient,
  Appointment, NewAppointment,
  FinancialEntry, NewFinancialEntry,
  Transfer, NewTransfer,
  MoneyTransfer, NewMoneyTransfer,
  Branch, NewBranch
} from '@shared/schema';

// Função para obter usuário logado (padronizado via SessionManager)
const getCurrentUser = () => {
  try {
    const user = SessionManager.getSession();
    return user || null;
  } catch {
    return null;
  }
};

// Products - Usando sistema UUID com headers
export const useProducts = (branch_id?: string, company_id?: string) => {
  return useQuery<Product[]>({
    queryKey: ['/api/products', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: NewProduct) => apiRequest('/api/products', { method: 'POST', body: JSON.stringify(product) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/products'] })
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, product }: { id: string, product: Partial<NewProduct> }) => 
      apiRequest(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(product) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/products'] })
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/products'] })
  });
};

// Categories - Usando sistema UUID com headers
export const useCategories = (company_id?: string) => {
  return useQuery<Category[]>({
    queryKey: ['/api/categories', company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: NewCategory) => apiRequest('/api/categories', { method: 'POST', body: JSON.stringify(category) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/categories'] })
  });
};

// Subcategories - Usando sistema UUID com headers
export const useSubcategories = (company_id?: string) => {
  return useQuery<Subcategory[]>({
    queryKey: ['/api/subcategories', company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateSubcategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subcategory: NewSubcategory) => apiRequest('/api/subcategories', { method: 'POST', body: JSON.stringify(subcategory) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    }
  });
};

// Sales - Usando sistema UUID com headers  
export const useSales = (branch_id?: string, company_id?: string) => {
  return useQuery<Sale[]>({
    queryKey: ['/api/sales', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sale: NewSale) => apiRequest('/api/sales', { method: 'POST', body: JSON.stringify(sale) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial'] });
    }
  });
};

// Clients - Usando sistema UUID com headers
export const useClients = (branch_id?: string, company_id?: string) => {
  return useQuery<Client[]>({
    queryKey: ['/api/clients', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (client: NewClient) => apiRequest('/api/clients', { method: 'POST', body: JSON.stringify(client) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, client }: { id: string, client: Partial<NewClient> }) => 
      apiRequest(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(client) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/clients/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/clients'] })
  });
};

// Appointments - Usando sistema UUID com headers
export const useAppointments = (branch_id?: string, company_id?: string) => {
  return useQuery<Appointment[]>({
    queryKey: ['/api/appointments', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appointment: NewAppointment) => apiRequest('/api/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/appointments'] })
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      apiRequest(`/api/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/appointments'] })
  });
};

// Financial - Usando sistema UUID com headers
export const useFinancial = (branch_id?: string, company_id?: string) => {
  return useQuery<FinancialEntry[]>({
    queryKey: ['/api/financial', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateFinancial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entry: NewFinancialEntry) => apiRequest('/api/financial', { method: 'POST', body: JSON.stringify(entry) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/financial'] })
  });
};

export const useUpdateFinancial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entry }: { id: string, entry: Partial<FinancialEntry> }) => 
      apiRequest(`/api/financial/${id}`, { method: 'PATCH', body: JSON.stringify(entry) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/financial'] })
  });
};

export const useDeleteFinancial = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/financial/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/financial'] })
  });
};

// Transfers - Usando sistema UUID com headers
export const useTransfers = (branch_id?: string, company_id?: string) => {
  return useQuery<Transfer[]>({
    queryKey: ['/api/transfers', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transfer: NewTransfer) => apiRequest('/api/transfers', { method: 'POST', body: JSON.stringify(transfer) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/transfers'] })
  });
};

// Money Transfers - Usando sistema UUID com headers
export const useMoneyTransfers = (branch_id?: string, company_id?: string) => {
  return useQuery<MoneyTransfer[]>({
    queryKey: ['/api/money-transfers', branch_id, company_id],
    // A queryFn padrão do queryClient já lida com headers automaticamente
  });
};

export const useCreateMoneyTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transfer: NewMoneyTransfer) => apiRequest('/api/money-transfers', { method: 'POST', body: JSON.stringify(transfer) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/money-transfers'] })
  });
};

export const useUpdateMoneyTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, transfer }: { id: string, transfer: Partial<MoneyTransfer> }) => 
      apiRequest(`/api/money-transfers/${id}`, { method: 'PATCH', body: JSON.stringify(transfer) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/money-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial'] }); // Invalidar também entradas financeiras
    }
  });
};

// Função para simplificar operações de venda do carrinho 
export const useCreateCartSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleData: any) => {
      const response = await fetch('/api/sales/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar venda');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/financial'] });
    }
  });
};

// Branches
export const useBranches = (company_id?: string) => {
  const user = getCurrentUser();
  const effective_company_id = company_id || (user?.company_id as any);
  
  const params = new URLSearchParams();
  if (effective_company_id) params.append('company_id', String(effective_company_id));
  
  return useQuery<Branch[]>({
    queryKey: ['/api/branches', effective_company_id],
    queryFn: () => fetch(`/api/branches?${params}`).then(res => res.json()),
    enabled: !!effective_company_id
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branch: NewBranch) => apiRequest('/api/branches', { method: 'POST', body: JSON.stringify(branch) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/branches'] })
  });
};

// Branch Revenue Analytics - Receitas por filial
export const useBranchRevenue = (company_id?: string) => {
  const user = getCurrentUser();
  const effective_company_id = company_id || (user?.company_id as any);
  
  return useQuery<{branch_id: string, branch_name: string, revenue: number}[]>({
    queryKey: ['/api/analytics/branch-revenue', effective_company_id],
    enabled: !!effective_company_id
  });
};

// Branch Expenses Analytics - Gastos por filial
export const useBranchExpenses = (company_id?: string) => {
  const user = getCurrentUser();
  const effective_company_id = company_id || (user?.company_id as any);
  
  return useQuery<{branch_id: string, branch_name: string, expenses: number}[]>({
    queryKey: ['/api/analytics/branch-expenses', effective_company_id],
    enabled: !!effective_company_id
  });
};

// CUPONS
export const useCoupons = (company_id?: string) => {
  const user = getCurrentUser();
  const effective_company_id = company_id || (user?.company_id as any);
  
  const params = new URLSearchParams();
  if (effective_company_id) params.append('company_id', String(effective_company_id));
  
  return useQuery({
    queryKey: ['/api/coupons', effective_company_id],
    queryFn: () => fetch(`/api/coupons?${params}`).then(res => res.json()),
    enabled: !!effective_company_id
  });
};

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => apiRequest('/api/coupons', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/coupons'] })
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async (couponCode: string) => {
      const response = await fetch(`/api/coupons/validate/${couponCode}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Cupom inválido');
      }
      return response.json();
    }
  });
};

export const useApplyCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { couponId: string; saleAmount: number }) => {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: data.couponId, // Envia como coupon_id para a API
          sale_amount: data.saleAmount
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao aplicar cupom');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/coupons'] });
    }
  });
};