// Interface para operações de dados com nova hierarquia
import { 
  User, NewUser,
  Company, NewCompany,
  Branch, NewBranch,
  Product, NewProduct, 
  Sale, NewSale,
  Client, NewClient,
  Appointment, NewAppointment,
  FinancialEntry, NewFinancialEntry,
  Transfer, NewTransfer,
  MoneyTransfer, NewMoneyTransfer,
  UserPermission
} from "@shared/schema";
import { Logger } from "@shared/logger";
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "@shared/messages";
import { HTTP_STATUS } from "@shared/http-status";

export interface Storage {
  // ====================================
  // HIERARQUIA EMPRESARIAL
  // ====================================
  
  // Usuários
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: NewUser): Promise<User>;
  getMasterUsers(): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  getUsersByCompany(companyId: string): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User | null>;
  updateUser(id: string, user: Partial<NewUser>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
  
  // Empresas
  getCompanies(): Promise<Company[]>;
  getCompaniesByCreator(creatorId: number): Promise<Company[]>;
  getCompanyById(id: number): Promise<Company | null>;
  createCompany(company: NewCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<NewCompany>): Promise<Company | null>;
  deleteCompany(id: number): Promise<boolean>;
  
  // Filiais
  getBranches(companyId?: string): Promise<Branch[]>;
  getBranchesByCompany(companyId: string): Promise<Branch[]>;
  createBranch(branch: NewBranch): Promise<Branch>;
  updateBranch(id: string, branch: Partial<NewBranch>): Promise<Branch | null>;
  deleteBranch(id: string): Promise<boolean>;
  
  // Permissões
  getUserPermissions(userId: number): Promise<UserPermission[]>;
  updateUserPermissions(userId: number, permissions: string[]): Promise<boolean>;
  
  // ====================================
  // OPERAÇÕES DE NEGÓCIO
  // ====================================
  
  // Produtos
  getProducts(branchId?: number, companyId?: number): Promise<Product[]>;
  createProduct(product: NewProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<NewProduct>): Promise<Product | null>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Vendas
  getSales(branchId?: number, companyId?: number): Promise<Sale[]>;
  createSale(sale: NewSale): Promise<Sale>;
  
  // Parcelas
  createInstallment(installment: any): Promise<any>;
  getInstallmentsBySale(saleId: string): Promise<any[]>;
  updateInstallmentStatus(installmentId: string, status: 'pending' | 'paid'): Promise<any>;
  
  // Analytics por filial
  getBranchRevenue(companyId: string): Promise<{branch_id: string, branch_name: string, revenue: number}[]>;
  getBranchExpenses(companyId: string): Promise<{branch_id: string, branch_name: string, expenses: number}[]>;
  
  // Clientes
  getClients(branchId?: number, companyId?: number): Promise<Client[]>;
  createClient(client: NewClient): Promise<Client>;
  updateClient(id: string, client: Partial<NewClient>): Promise<Client | null>;
  deleteClient(id: string): Promise<boolean>;
  
  // Agendamentos
  getAppointments(branchId?: number, companyId?: number): Promise<Appointment[]>;
  createAppointment(appointment: NewAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<NewAppointment>): Promise<Appointment | null>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Financeiro
  getFinancialEntries(branchId?: number, companyId?: number): Promise<FinancialEntry[]>;
  createFinancialEntry(entry: NewFinancialEntry): Promise<FinancialEntry>;
  updateFinancialEntry(id: string, entry: Partial<FinancialEntry>): Promise<FinancialEntry | null>;
  deleteFinancialEntry(id: string): Promise<boolean>;
  
  // Transferências
  getTransfers(companyId?: number): Promise<Transfer[]>;
  createTransfer(transfer: NewTransfer): Promise<Transfer>;
  updateTransfer(id: number, transfer: Partial<NewTransfer>): Promise<Transfer | null>;
  deleteTransfer(id: number): Promise<boolean>;
  
  // Transferências de Dinheiro
  getMoneyTransfers(companyId?: number): Promise<MoneyTransfer[]>;
  createMoneyTransfer(transfer: NewMoneyTransfer): Promise<MoneyTransfer>;
  updateMoneyTransfer(id: string, transfer: Partial<MoneyTransfer>): Promise<MoneyTransfer | null>;
  deleteMoneyTransfer(id: string): Promise<boolean>;
  
  // Categorias
  getCategories(companyId?: number): Promise<any[]>;
  getCategoriesUuidAware(userId: string): Promise<any[]>;
  createCategory(category: any): Promise<any>;
  
  // Subcategorias
  getSubcategories(companyId?: number): Promise<any[]>;
  getSubcategoriesUuidAware(userId: string): Promise<any[]>;
  createSubcategory(subcategory: any): Promise<any>;
}

// ====================================
// IMPLEMENTAÇÃO SUPABASE COM NOVA HIERARQUIA
// ====================================

export class SupabaseStorage implements Storage {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
    // Use service role key for backend operations (full access)
    this.apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;
    
    if (!this.baseUrl || !this.apiKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
  }
  // ===== Boolean access map (Option B: user_access table) =====
  async getUserAccess(userId: number): Promise<Record<string, boolean>> {
    const rows = await this.request(`user_access?user_id=eq.${userId}&select=*`);
    const row = rows?.[0];
    if (!row) return {};
    const {
      user_id, // eslint-disable-line @typescript-eslint/no-unused-vars
      dashboard,
      graficos,
      atividade,
      agendamentos,
      estoque,
      vendas,
      atendimento,
      financeiro,
      controle,
      cadastros,
      ...rest
    } = row || {};
    const map: Record<string, boolean> = {};
    if (dashboard !== undefined) map.dashboard = !!dashboard;
    if (graficos !== undefined) map.graficos = !!graficos;
    if (atividade !== undefined) map.atividade = !!atividade;
    if (agendamentos !== undefined) map.agendamentos = !!agendamentos;
    if (estoque !== undefined) map.estoque = !!estoque;
    if (vendas !== undefined) map.vendas = !!vendas;
    if (atendimento !== undefined) map.atendimento = !!atendimento;
    if (financeiro !== undefined) map.financeiro = !!financeiro;
    if (controle !== undefined) map.controle = !!controle;
    if (cadastros !== undefined) map.cadastros = !!cadastros;
    // ignore rest
    return map;
  }

  async upsertUserAccess(userId: number, access: Record<string, boolean>): Promise<boolean> {
    // Remove existente e insere um novo registro consolidado
    await this.request(`user_access?user_id=eq.${userId}`, { method: 'DELETE' });
    const payload = {
      user_id: userId,
      dashboard: access.dashboard ?? null,
      graficos: access.graficos ?? null,
      atividade: access.atividade ?? null,
      agendamentos: access.agendamentos ?? null,
      estoque: access.estoque ?? null,
      vendas: access.vendas ?? null,
      atendimento: access.atendimento ?? null,
      financeiro: access.financeiro ?? null,
      controle: access.controle ?? null,
      cadastros: access.cadastros ?? null,
    } as any;
    await this.request('user_access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return true;
  }

  public async request(path: string, options: RequestInit = {}, companyId?: number): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string>),
    };

    // Adicionar header Prefer conforme método
    if (options.method === 'PATCH') {
      // Evita retorno de representação que pode referenciar colunas inexistentes no cache (ex: 'updated_by')
      headers['Prefer'] = 'return=minimal';
    } else if (options.method && ['POST', 'PUT'].includes(options.method)) {
      headers['Prefer'] = 'return=representation';
    }

    // Se companyId fornecido, definir contexto RLS
    if (companyId) {
      headers['rls-company-id'] = companyId.toString();
    }

    const url = `${this.baseUrl}/rest/v1/${path}`;
    Logger.debug('Requisição Supabase', { 
      method: options.method || 'GET', 
      url,
      hasBody: !!options.body 
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      Logger.error('Falha na requisição Supabase', { 
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url 
      });
      throw new Error(`Falha na requisição da API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Para operações DELETE, o Supabase pode retornar resposta vazia
    const contentType = response.headers.get('content-type');
    if (options.method === 'DELETE' || !contentType?.includes('application/json')) {
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    }

    return response.json();
  }

  // Método para definir contexto RLS via SQL
  private async setRLSContext(companyId: number): Promise<void> {
    if (companyId) {
      await this.request(`rpc/set_config`, {
        method: 'POST',
        body: JSON.stringify({
          setting_name: 'rls.company_id',
          setting_value: companyId.toString(),
          is_local: true
        })
      });
    }
  }

  // ====================================
  // USUÁRIOS
  // ====================================

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      Logger.debug('Buscando usuário por email', { email });
      const users = await this.request(`profiles?email=eq.${email}&select=*`);
      const user = users[0] || null;
      
      // Adaptar campo nome -> name para compatibilidade com schema
      if (user && user.nome) {
        user.name = user.nome;
      }
      // Normalizar papel para minúsculas para evitar divergência 'Master' vs 'master'
      if (user && typeof user.role === 'string') {
        user.role = user.role.toLowerCase();
      }
      
      if (user) {
        Logger.success('Usuário encontrado por email', { userId: user.id, email });
      } else {
        Logger.warn('Usuário não encontrado por email', { email });
      }
      
      return user;
    } catch (error: any) {
      Logger.error('Falha ao buscar usuário por email', { email, error: error.message });
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

  async createUser(user: NewUser): Promise<User> {
    const [created] = await this.request('profiles', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    return created;
  }

  async updateUser(id: string, user: Partial<NewUser>): Promise<User | null> {
    const [updated] = await this.request(`profiles?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
    return updated || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.request(`profiles?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  async getUsersByCompany(companyId: string): Promise<User[]> {
    return this.request(`profiles?company_id=eq.${companyId}&select=*`);
  }

  async getMasterUsers(): Promise<User[]> {
    // Consulta case-insensitive para masters
    const users: User[] = await this.request(`profiles?role=ilike.master&select=*`);
    // Garantir normalização de role
    return users.map(u => ({ ...u, role: (u as any).role ? (u as any).role.toLowerCase() : u.role }));
  }

  async getAllUsers(): Promise<User[]> {
    return this.request(`profiles?select=*`);
  }

  async updateUserRole(id: string, role: string): Promise<User | null> {
    const [updated] = await this.request(`profiles?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return updated || null;
  }

  async getUserById(id: number): Promise<User | null> {
    const users = await this.request(`profiles?id=eq.${id}&select=*`);
    return users[0] || null;
  }

  // ====================================
  // EMPRESAS
  // ====================================

  async getCompanies(): Promise<Company[]> {
    return this.request('companies?select=*&order=name.asc');
  }

  async getCompaniesByCreator(creatorId: number): Promise<Company[]> {
    return this.request(`companies?created_by=eq.${creatorId}&select=*&order=name.asc`);
  }

  async getCompanyById(id: number): Promise<Company | null> {
    const companies = await this.request(`companies?id=eq.${id}&select=*`);
    return companies[0] || null;
  }

  async getCompanyByUuid(id: string): Promise<Company | null> {
    const companies = await this.request(`companies?id=eq.${id}&select=*`);
    return companies[0] || null;
  }

  async createCompany(company: NewCompany): Promise<Company> {
    const [created] = await this.request('companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
    return created;
  }

  async updateCompany(id: number, company: Partial<NewCompany>): Promise<Company | null> {
    const [updated] = await this.request(`companies?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(company),
    });
    return updated || null;
  }

  async deleteCompany(id: number): Promise<boolean> {
    await this.request(`companies?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // ====================================
  // SUBDOMÍNIOS E EMPRESAS
  // ====================================

  async getCompanyBySubdomain(subdomain: string): Promise<any> {
    const companies = await this.request(`companies?subdomain=eq.${subdomain}&select=*`);
    return companies?.[0] || null;
  }

  async createCompanyFromSubdomain(subdomain: string): Promise<any> {
    const companyData = {
      name: this.formatCompanyName(subdomain),
      subdomain: subdomain,
      business_category: 'geral',
      is_active: true,
      created_at: new Date().toISOString()
    };

    const [company] = await this.request('companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });

    // Criar filial matriz automaticamente
    if (company) {
      await this.createMainBranch(company.id, company.name);
    }

    return company;
  }

  async createMainBranch(companyId: string, companyName: string): Promise<any> {
    const branchData = {
      company_id: companyId,
      name: `${companyName} - Matriz`,
      code: 'MATRIZ',
      is_main: true,
      is_active: true
    };

    const [branch] = await this.request('branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });

    return branch;
  }

  private formatCompanyName(subdomain: string): string {
    return subdomain
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // ====================================
  // FILIAIS
  // ====================================

  async getBranches(companyId?: string): Promise<Branch[]> {
    const filter = companyId && companyId.trim() !== '' ? `company_id=eq.${companyId}&` : '';
    return this.request(`branches?${filter}select=*&order=name.asc`);
  }

  async getBranchesByCompany(companyId: string): Promise<Branch[]> {
    return this.request(`branches?company_id=eq.${companyId}&select=*&order=name.asc`);
  }

  async createBranch(branch: NewBranch): Promise<Branch> {
    const [created] = await this.request('branches', {
      method: 'POST',
      body: JSON.stringify(branch),
    });
    return created;
  }

  async updateBranch(id: string, branch: Partial<NewBranch>): Promise<Branch | null> {
    const [updated] = await this.request(`branches?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(branch),
    });
    return updated || null;
  }

  async deleteBranch(id: string): Promise<boolean> {
    await this.request(`branches?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // ====================================
  // PERMISSÕES
  // ====================================

  async getUserPermissions(userId: number): Promise<UserPermission[]> {
    return this.request(`user_permissions?user_id=eq.${userId}&select=*`);
  }

  async updateUserPermissions(userId: number, permissions: string[]): Promise<boolean> {
    // Delete existing permissions
    await this.request(`user_permissions?user_id=eq.${userId}`, { method: 'DELETE' });
    
    // Insert new permissions
    const permissionObjects = permissions.map(permission => ({
      user_id: userId,
      permission,
      created_at: new Date().toISOString(),
    }));
    
    await this.request('user_permissions', {
      method: 'POST',
      body: JSON.stringify(permissionObjects),
    });
    
    return true;
  }



  // ====================================
  // PRODUTOS
  // ====================================

  async getProducts(branchId?: number, companyId?: number): Promise<Product[]> {
    let filter = '';
    if (companyId) filter += `company_id=eq.${companyId}&`;
    if (branchId) filter += `branch_id=eq.${branchId}&`;
    
    return this.request(`products?${filter}select=*&order=name.asc`);
  }

  // Método otimizado para buscar produtos por usuário
  async getProductsUuidAware(userId: string): Promise<Product[]> {
    console.log('🚀 [getProductsUuidAware] INICIANDO - userId:', userId);
    Logger.time('getProductsUuidAware');
    Logger.info('Buscando produtos para usuário', { userId });
    
    // Validação de entrada
    if (!this.isValidUuid(userId)) {
      console.log('❌ [getProductsUuidAware] UUID INVÁLIDO:', userId);
      Logger.warn('ID de usuário inválido fornecido', { userId });
      return [];
    }
    console.log('✅ [getProductsUuidAware] UUID válido');

    try {
      // Buscar dados do usuário
      console.log('🔍 [getProductsUuidAware] Buscando dados do usuário...');
      const user = await this.getUserByUuid(userId);
      console.log('👤 [getProductsUuidAware] Dados do usuário:', user);
      
      if (!user?.company_id) {
        console.log('❌ [getProductsUuidAware] USUÁRIO SEM EMPRESA:', { user, company_id: user?.company_id });
        Logger.warn('Usuário não encontrado ou sem empresa vinculada', { userId, user });
        return [];
      }

      console.log('✅ [getProductsUuidAware] Usuário com empresa válida:', user.company_id);
      Logger.debug('Usuário encontrado', { 
        email: user.email, 
        companyId: user.company_id 
      });

      // Buscar produtos da empresa
      const query = `products?company_id=eq.${user.company_id}&select=*&order=name`;
      console.log('🔍 [getProductsUuidAware] Query de produtos:', query);
      
      const products = await this.request(query);
      console.log('📦 [getProductsUuidAware] Produtos encontrados:', products?.length || 0);
      console.log('📊 [getProductsUuidAware] Primeiros produtos:', products?.slice(0, 2));

      Logger.success('Produtos carregados com sucesso', { 
        count: products?.length || 0,
        companyId: user.company_id
      });

      return products || [];

    } catch (error) {
      console.log('❌ [getProductsUuidAware] ERRO:', error);
      Logger.error('Falha ao buscar produtos do usuário', error);
      throw new Error(ERROR_MESSAGES.LOAD_ERROR);
    } finally {
      Logger.timeEnd('getProductsUuidAware');
    }
  }

  // Método auxiliar para validação de UUID
  private isValidUuid(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof uuid === 'string' && uuidRegex.test(uuid);
  }

  // Método auxiliar para buscar usuário por UUID
  async getUserByUuid(userId: string): Promise<User | null> {
    console.log('🔍 [getUserByUuid] Buscando usuário:', userId);
    
    const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email,name`);
    console.log('📊 [getUserByUuid] Resultado da query:', users);
    
    const user = users?.[0] || null;
    console.log('👤 [getUserByUuid] Usuário encontrado:', user);
    
    return user;
  }

  async createProduct(product: NewProduct): Promise<Product> {
    Logger.info('Criando produto no storage', { 
      product,
      productKeys: Object.keys(product),
      categoryIdType: typeof product.category_id,
      companyIdType: typeof product.company_id,
      createdByType: typeof product.created_by
    });
    
    try {
      const [created] = await this.request('products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      
      Logger.success('Produto criado no banco', { created });
      return created;
    } catch (error: any) {
      Logger.error('Erro ao criar produto no storage', { 
        product, 
        error: error.message,
        errorDetails: error
      });
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<NewProduct>): Promise<Product | null> {
    const resp = await this.request(`products?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    });
    // Com Prefer: return=minimal, resp pode ser null/undefined
    const updated = Array.isArray(resp) ? resp[0] : null;
    if (updated) return updated as Product;
    // Buscar o registro atualizado para retornar ao cliente
    const rows = await this.request(`products?id=eq.${id}&select=*`);
    return Array.isArray(rows) ? (rows[0] as Product) : null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    Logger.info('Iniciando exclusão de produto', { productId: id });
    
    try {
      // Usar método request mas ignorar resposta JSON para DELETE
      const url = `${this.baseUrl}/rest/v1/products?id=eq.${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        Logger.error('Falha ao deletar produto', { 
          productId: id,
          status: response.status,
          error: errorText 
        });
        throw new Error(`Falha na exclusão: ${response.status} ${response.statusText} - ${errorText}`);
      }

      Logger.success('Produto deletado com sucesso', { productId: id });
      return true;
    } catch (error) {
      Logger.error('Erro ao deletar produto', { productId: id, error });
      throw new Error(ERROR_MESSAGES.DELETE_ERROR);
    }
  }

  // ====================================
  // VENDAS
  // ====================================

  async getSales(branchId?: number, companyId?: number): Promise<Sale[]> {
    let filter = '';
    if (companyId) filter += `company_id=eq.${companyId}&`;
    if (branchId) filter += `branch_id=eq.${branchId}&`;
    
    return this.request(`sales?${filter}select=*&order=sale_date.desc`);
  }

  async createSale(sale: NewSale): Promise<Sale> {
    const [created] = await this.request('sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
    return created;
  }

  // ====================================
  // PARCELAS
  // ====================================

  async createInstallment(installment: any): Promise<any> {
    const [created] = await this.request('installments', {
      method: 'POST',
      body: JSON.stringify(installment),
    });
    return created;
  }

  async getInstallmentsBySale(saleId: string): Promise<any[]> {
    return this.request(`installments?sale_id=eq.${saleId}&order=installment_number.asc`);
  }

  async updateInstallmentStatus(installmentId: string, status: 'pending' | 'paid'): Promise<any> {
    const [updated] = await this.request(`installments?id=eq.${installmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, paid_at: status === 'paid' ? new Date().toISOString() : null }),
    });
    return updated;
  }

  // ====================================
  // ANALYTICS POR FILIAL
  // ====================================

  async getBranchRevenue(companyId: string): Promise<{branch_id: string, branch_name: string, revenue: number}[]> {
    try {
      // Buscar receitas por filial (vendas + entradas financeiras do tipo income)
      const query = `
        SELECT 
          b.id as branch_id,
          b.name as branch_name,
          COALESCE(
            (SELECT SUM(s.total_amount) FROM sales s WHERE s.branch_id = b.id AND s.company_id = '${companyId}') +
            (SELECT SUM(f.amount) FROM financial_entries f WHERE f.branch_id = b.id AND f.company_id = '${companyId}' AND f.type = 'income'),
            0
          ) as revenue
        FROM branches b
        WHERE b.company_id = '${companyId}' AND b.is_active = true
        ORDER BY revenue DESC
      `;
      
      // Como não temos RPC, vamos fazer queries separadas e combinar
      const branches = await this.request(`branches?company_id=eq.${companyId}&is_active=eq.true&select=id,name`);
      
      const branchRevenue = await Promise.all(
        branches.map(async (branch: any) => {
          // Buscar vendas da filial
          const sales = await this.request(`sales?branch_id=eq.${branch.id}&company_id=eq.${companyId}&select=total_amount`);
          const salesRevenue = sales.reduce((sum: number, sale: any) => sum + (sale.total_amount || 0), 0);
          
          // Buscar entradas financeiras da filial
          const financialEntries = await this.request(`financial_entries?branch_id=eq.${branch.id}&company_id=eq.${companyId}&type=eq.income&select=amount`);
          const financialRevenue = financialEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
          
          return {
            branch_id: branch.id,
            branch_name: branch.name,
            revenue: salesRevenue + financialRevenue
          };
        })
      );
      
      return branchRevenue.sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      console.error('Erro ao buscar receitas por filial:', error);
      return [];
    }
  }

  async getBranchExpenses(companyId: string): Promise<{branch_id: string, branch_name: string, expenses: number}[]> {
    try {
      // Buscar gastos por filial (saídas financeiras do tipo expense)
      const branches = await this.request(`branches?company_id=eq.${companyId}&is_active=eq.true&select=id,name`);
      
      const branchExpenses = await Promise.all(
        branches.map(async (branch: any) => {
          // Buscar saídas financeiras da filial
          const financialEntries = await this.request(`financial_entries?branch_id=eq.${branch.id}&company_id=eq.${companyId}&type=eq.expense&select=amount`);
          const expenses = financialEntries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
          
          return {
            branch_id: branch.id,
            branch_name: branch.name,
            expenses: expenses
          };
        })
      );
      
      return branchExpenses.sort((a, b) => b.expenses - a.expenses);
    } catch (error) {
      console.error('Erro ao buscar gastos por filial:', error);
      return [];
    }
  }

  // ====================================
  // CLIENTES
  // ====================================

  async getClients(branchId?: number, companyId?: number): Promise<Client[]> {
    let filter = '';
    if (companyId) filter += `company_id=eq.${companyId}&`;
    if (branchId) filter += `branch_id=eq.${branchId}&`;
    
    return this.request(`clients?${filter}select=*&order=name.asc`);
  }

  async createClient(client: NewClient): Promise<Client> {
    const [created] = await this.request('clients', {
      method: 'POST',
      body: JSON.stringify(client),
    });
    return created;
  }

  async updateClient(id: string, client: Partial<NewClient>): Promise<Client | null> {
    const [updated] = await this.request(`clients?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(client),
    });
    return updated || null;
  }

  async deleteClient(id: string): Promise<boolean> {
    try {
      console.log(`[STORAGE] 🗑️ Deletando cliente ID: ${id}`);
      await this.request(`clients?id=eq.${id}`, { method: 'DELETE' });
      console.log(`[STORAGE] ✅ Cliente ${id} deletado com sucesso`);
      return true;
    } catch (error) {
      console.error(`[STORAGE] ❌ Erro ao deletar cliente ${id}:`, error);
      throw error;
    }
  }

  // ====================================
  // AGENDAMENTOS
  // ====================================

  async getAppointments(branchId?: number, companyId?: number): Promise<Appointment[]> {
    let filter = '';
    if (companyId) filter += `company_id=eq.${companyId}&`;
    if (branchId) filter += `branch_id=eq.${branchId}&`;
    
    return this.request(`appointments?${filter}select=*&order=appointment_date.asc`);
  }

  async createAppointment(appointment: NewAppointment): Promise<Appointment> {
    const [created] = await this.request('appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
    return created;
  }

  async updateAppointment(id: number, appointment: Partial<NewAppointment>): Promise<Appointment | null> {
    const [updated] = await this.request(`appointments?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(appointment),
    });
    return updated || null;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    await this.request(`appointments?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // ====================================
  // FINANCEIRO
  // ====================================

  async getFinancialEntries(branchId?: number, companyId?: number): Promise<FinancialEntry[]> {
    let filter = '';
    if (companyId) filter += `company_id=eq.${companyId}&`;
    if (branchId) filter += `branch_id=eq.${branchId}&`;
    
    return this.request(`financial_entries?${filter}select=*&order=created_at.desc`);
  }

  async createFinancialEntry(entry: NewFinancialEntry): Promise<FinancialEntry> {
    Logger.info('Criando entrada financeira', { 
      type: entry.type,
      amount: entry.amount,
      description: entry.description 
    });
    
    try {
      const processedEntry = {
        ...entry,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const [created] = await this.request('financial_entries', {
        method: 'POST',
        body: JSON.stringify(processedEntry),
      });

      Logger.success('Entrada financeira criada com sucesso', { 
        entryId: created.id,
        type: created.type,
        amount: created.amount
      });

      return created;
    } catch (error) {
      Logger.error('Falha ao criar entrada financeira', { entry, error });
      throw new Error(ERROR_MESSAGES.SAVE_ERROR);
    }
  }

  async updateFinancialEntry(id: string, entry: Partial<FinancialEntry>): Promise<FinancialEntry | null> {
    const [updated] = await this.request(`financial_entries?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(entry),
    });
    return updated || null;
  }

  async deleteFinancialEntry(id: string): Promise<boolean> {
    await this.request(`financial_entries?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  async revertFinancialEntry(id: number): Promise<FinancialEntry | null> {
    const [updated] = await this.request(`financial_entries?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status: 'pending',
        paid_date: null,
        updated_at: new Date().toISOString()
      }),
    });
    return updated || null;
  }

  // ====================================
  // TRANSFERÊNCIAS
  // ====================================

  async getTransfers(companyId?: number): Promise<Transfer[]> {
    const filter = companyId ? `company_id=eq.${companyId}&` : '';
    
    // JOIN manual - PostgREST syntax complexa
    const transfersQuery = `transfers?${filter}select=*&order=transfer_date.desc`;
    const productsQuery = 'products?select=id,name';
    
    try {
      // Buscar dados separadamente
      const [transfers, products] = await Promise.all([
        this.request(transfersQuery),
        this.request(productsQuery)
      ]);
      
      console.log('[STORAGE DEBUG] Transfers found:', transfers?.length || 0);
      console.log('[STORAGE DEBUG] Products found:', products?.length || 0);
      console.log('[STORAGE DEBUG] First transfer productId:', transfers[0]?.productId);
      console.log('[STORAGE DEBUG] First product:', products[0]);
      
      if (!transfers || !Array.isArray(transfers)) {
        console.log('[STORAGE] No transfers found');
        return [];
      }
      
      if (!products || !Array.isArray(products)) {
        console.log('[STORAGE] No products found - returning transfers without names');
        return transfers.map((t: any) => ({ 
          ...t, 
          productName: `Produto ID: ${t.productId}` 
        }));
      }
      
      // JOIN manual
      const result = transfers.map((transfer: any) => {
        const product = products.find((p: any) => p.id === transfer.productId);
        const productName = product?.name || `Produto ID: ${transfer.productId}`;
        
        console.log(`[STORAGE] Transfer ${transfer.id}: productId=${transfer.productId} -> ${productName}`);
        
        return {
          ...transfer,
          productName
        };
      });
      
      console.log('[STORAGE] Returning', result.length, 'transfers with productName');
      return result;
    } catch (error) {
      console.error('[STORAGE ERROR] Error in getTransfers:', error);
      return [];
    }
  }

  async createTransfer(transfer: NewTransfer): Promise<Transfer> {
    // Todas as tabelas agora usam UUID - não precisa mapeamento
    const processedTransfer = { ...transfer };
    
    const [created] = await this.request('transfers', {
      method: 'POST',
      body: JSON.stringify(processedTransfer),
    });
    return created;
  }

  async updateTransfer(id: number, transfer: Partial<NewTransfer>): Promise<Transfer | null> {
    const [updated] = await this.request(`transfers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(transfer),
    });
    return updated || null;
  }

  async deleteTransfer(id: number): Promise<boolean> {
    await this.request(`transfers?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // ====================================
  // TRANSFERÊNCIAS DE DINHEIRO
  // ====================================

  async getMoneyTransfers(companyId?: number): Promise<MoneyTransfer[]> {
    const filter = companyId ? `company_id=eq.${companyId}&` : '';
    return this.request(`money_transfers?${filter}select=*&order=transfer_date.desc`);
  }

  async createMoneyTransfer(transfer: NewMoneyTransfer): Promise<MoneyTransfer> {
    const [created] = await this.request('money_transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
    return created;
  }

  async updateMoneyTransfer(id: string, transfer: Partial<MoneyTransfer>): Promise<MoneyTransfer | null> {
    // Primeiro, buscar a transferência atual para verificar mudanças de status
    const currentTransfers = await this.request(`money_transfers?id=eq.${id}&select=*`);
    if (!currentTransfers || currentTransfers.length === 0) {
      throw new Error('Transferência não encontrada');
    }
    
    const currentTransfer = currentTransfers[0];
    
    // Atualizar a transferência
    const [updated] = await this.request(`money_transfers?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(transfer),
    });
    
    // Se a transferência foi marcada como concluída, criar entrada financeira de saída
    if (transfer.status === 'completed' && currentTransfer.status !== 'completed') {
      console.log(`💰 Transferência ${id} concluída - criando entrada financeira de saída`);
      
      try {
        // Criar entrada financeira negativa (saída) para a filial de origem
        const financialEntry = {
          type: 'expense' as const,
          amount: currentTransfer.amount,
          description: `Transferência enviada para filial - ${currentTransfer.description || 'Transferência entre filiais'}`,
          status: 'paid' as const,
          category: 'transferencias',
          reference_id: currentTransfer.id,
          reference_type: 'money_transfer',
          company_id: currentTransfer.company_id,
          branch_id: currentTransfer.from_branch_id, // Filial de origem
          created_by: currentTransfer.created_by,
          entry_date: new Date().toISOString()
        };
        
        await this.createFinancialEntry(financialEntry);
        console.log(`✅ Entrada financeira de saída criada para transferência ${id}`);
        
        // Também criar entrada positiva (receita) para a filial de destino
        const incomeEntry = {
          type: 'income' as const,
          amount: currentTransfer.amount,
          description: `Transferência recebida de filial - ${currentTransfer.description || 'Transferência entre filiais'}`,
          status: 'paid' as const,
          category: 'transferencias',
          reference_id: currentTransfer.id,
          reference_type: 'money_transfer',
          company_id: currentTransfer.company_id,
          branch_id: currentTransfer.to_branch_id, // Filial de destino
          created_by: currentTransfer.created_by,
          entry_date: new Date().toISOString()
        };
        
        await this.createFinancialEntry(incomeEntry);
        console.log(`✅ Entrada financeira de entrada criada para transferência ${id}`);
        
      } catch (finError) {
        console.error(`❌ Erro ao criar entradas financeiras para transferência ${id}:`, finError);
        // Não falhar a atualização da transferência se houver erro nas entradas financeiras
      }
    }
    
    return updated || null;
  }

  async deleteMoneyTransfer(id: string): Promise<boolean> {
    await this.request(`money_transfers?id=eq.${id}`, { method: 'DELETE' });
    return true;
  }

  // ====================================
  // MÉTODOS UUID-AWARE PARA TODAS AS ENTIDADES
  // ====================================

  // Método removido - todas as tabelas agora usam UUID



  async getSalesUuidAware(userId: string): Promise<Sale[]> {
    Logger.time('getSalesUuidAware');
    Logger.info('Buscando vendas para usuário', { userId });
    
    if (!this.isValidUuid(userId)) {
      Logger.warn('ID de usuário inválido para busca de vendas', { userId });
      return [];
    }

    try {
      const user = await this.getUserByUuid(userId);
      if (!user?.company_id) {
        Logger.warn('Usuário não encontrado ou sem empresa para busca de vendas', { userId });
        return [];
      }

      Logger.debug('Buscando vendas da empresa', { 
        companyId: user.company_id,
        userEmail: user.email 
      });

      const sales = await this.request(
        `sales?company_id=eq.${user.company_id}&select=*&order=sale_date.desc`
      );

      Logger.success('Vendas carregadas com sucesso', { 
        count: sales?.length || 0,
        companyId: user.company_id
      });

      return sales || [];
    } catch (error) {
      Logger.error('Falha ao buscar vendas do usuário', { userId, error });
      throw new Error(ERROR_MESSAGES.LOAD_ERROR);
    } finally {
      Logger.timeEnd('getSalesUuidAware');
    }
  }

  async getClientsUuidAware(userId: string): Promise<Client[]> {
    try {
      console.log(`[STORAGE UUID] 🔍 Buscando clientes para userId: ${userId}`);
      
      // CORREÇÃO SISTÊMICA: Buscar o company_id do usuário logado
      const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email`);
      
      if (!users || users.length === 0) {
        console.log(`[STORAGE UUID] ❌ Usuário não encontrado: ${userId}`);
        return [];
      }

      const user = users[0];
      const companyId = user.company_id;
      console.log(`[STORAGE UUID] ✅ Usuário: ${user.email}, empresa: ${companyId}`);

      // Buscar clientes APENAS da empresa do usuário logado (usando UUID)
      const clients = await this.request(`clients?company_id=eq.${companyId}&select=*&order=name.asc`);

      console.log(`[STORAGE UUID] 🎯 RESULTADO FINAL: ${clients?.length || 0} clientes encontrados`);
      return clients || [];
    } catch (error) {
      console.error('[STORAGE UUID] Erro ao buscar clientes UUID-aware:', error);
      return [];
    }
  }

  async getTransfersUuidAware(userId: string): Promise<Transfer[]> {
    try {
      console.log(`[STORAGE UUID] 🔍 Buscando transferências para userId: ${userId}`);
      
      // CORREÇÃO SISTÊMICA: Buscar o company_id do usuário logado
      const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email`);
      
      if (!users || users.length === 0) {
        console.log(`[STORAGE UUID] ❌ Usuário não encontrado: ${userId}`);
        return [];
      }

      const user = users[0];
      const companyId = user.company_id;
      console.log(`[STORAGE UUID] ✅ Usuário: ${user.email}, empresa: ${companyId}`);

      // Buscar transferências APENAS da empresa do usuário logado (usando UUID)
      const transfers = await this.request(`transfers?company_id=eq.${companyId}&select=*&order=transfer_date.desc`);

      console.log(`[STORAGE UUID] 🎯 RESULTADO FINAL: ${transfers?.length || 0} transferências encontradas`);
      return transfers || [];
    } catch (error) {
      console.error('[STORAGE UUID] Erro ao buscar transferências UUID-aware:', error);
      return [];
    }
  }

  async getFinancialEntriesUuidAware(userId: string): Promise<FinancialEntry[]> {
    try {
      console.log(`[STORAGE UUID] 🔍 Buscando entradas financeiras para userId: ${userId}`);
      
      // CORREÇÃO SISTÊMICA: Buscar o company_id do usuário logado
      const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email`);
      
      if (!users || users.length === 0) {
        console.log(`[STORAGE UUID] ❌ Usuário não encontrado: ${userId}`);
        return [];
      }

      const user = users[0];
      const companyId = user.company_id;
      console.log(`[STORAGE UUID] ✅ Usuário: ${user.email}, empresa: ${companyId}`);

      // Buscar entradas financeiras APENAS da empresa do usuário logado (usando UUID)
      const entries = await this.request(`financial_entries?company_id=eq.${companyId}&select=*&order=created_at.desc`);

      console.log(`[STORAGE UUID] 🎯 RESULTADO FINAL: ${entries?.length || 0} entradas financeiras encontradas`);
      return entries || [];
    } catch (error) {
      console.error('[STORAGE UUID] Erro ao buscar entradas financeiras UUID-aware:', error);
      return [];
    }
  }

  async getAppointmentsUuidAware(userId: string): Promise<Appointment[]> {
    try {
      console.log(`[STORAGE UUID] 🔍 Buscando agendamentos para userId: ${userId}`);
      
      // CORREÇÃO SISTÊMICA: Buscar o company_id do usuário logado
      const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email`);
      
      if (!users || users.length === 0) {
        console.log(`[STORAGE UUID] ❌ Usuário não encontrado: ${userId}`);
        return [];
      }

      const user = users[0];
      const companyId = user.company_id;
      console.log(`[STORAGE UUID] ✅ Usuário: ${user.email}, empresa: ${companyId}`);

      // Buscar agendamentos APENAS da empresa do usuário logado (usando UUID)
      const appointments = await this.request(`appointments?company_id=eq.${companyId}&select=*&order=appointment_date.asc`);

      console.log(`[STORAGE UUID] 🎯 RESULTADO FINAL: ${appointments?.length || 0} agendamentos encontrados`);
      return appointments || [];
    } catch (error) {
      console.error('[STORAGE UUID] Erro ao buscar agendamentos UUID-aware:', error);
      return [];
    }
  }

  // ====================================
  // CUPONS
  // ====================================

  async getCoupons(companyId?: string): Promise<any[]> {
    const filter = companyId && companyId.trim() !== '' ? `company_id=eq.${companyId}&` : '';
    return this.request(`coupons?${filter}select=*&order=created_at.desc`);
  }

  async createCoupon(coupon: any): Promise<any> {
    const [created] = await this.request('coupons', {
      method: 'POST',
      body: JSON.stringify({
        ...coupon,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }),
    });
    return created;
  }

  async validateCoupon(code: string): Promise<any | null> {
    const coupons = await this.request(`coupons?code=eq.${code}&select=*`);
    return coupons.length > 0 ? coupons[0] : null;
  }

  async applyCoupon(couponId: number, saleAmount: number): Promise<any> {
    // Incrementar contador de uso do cupom
    const [updated] = await this.request(`coupons?id=eq.${couponId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        uses_count: `uses_count + 1`,
        updated_at: new Date().toISOString()
      }),
    });
    
    return { success: true, coupon: updated };
  }

  // ====================================
  // CATEGORIAS
  // ====================================

  async getCategories(companyId?: number): Promise<any[]> {
    try {
      const filter = companyId ? `company_id=eq.${companyId}&` : '';
      console.log('🔍 Buscando categorias com filtro:', filter);
      const result = await this.request(`categories?${filter}select=*&order=name.asc`);
      console.log('📋 Categorias encontradas:', result?.length || 0);
      return result || [];
    } catch (error) {
      console.error('❌ Erro ao buscar categorias:', error);
      return [];
    }
  }

  // Método otimizado para buscar categorias por usuário
  async getCategoriesUuidAware(userId: string): Promise<any[]> {
    Logger.time('getCategoriesUuidAware');
    Logger.info('Buscando categorias para usuário', { userId });
    
    if (!this.isValidUuid(userId)) {
      Logger.warn('ID de usuário inválido para busca de categorias', { userId });
      return [];
    }

    try {
      const user = await this.getUserByUuid(userId);
      if (!user?.company_id) {
        Logger.warn('Usuário não encontrado ou sem empresa para busca de categorias', { userId });
        return [];
      }

      Logger.debug('Buscando categorias da empresa', { 
        companyId: user.company_id,
        userEmail: user.email 
      });

      const categories = await this.request(
        `categories?company_id=eq.${user.company_id}&select=*&order=name`
      );

      Logger.success('Categorias carregadas com sucesso', { 
        count: categories?.length || 0,
        companyId: user.company_id
      });

      return categories || [];
    } catch (error) {
      Logger.error('Falha ao buscar categorias do usuário', { userId, error });
      throw new Error(ERROR_MESSAGES.LOAD_ERROR);
    } finally {
      Logger.timeEnd('getCategoriesUuidAware');
    }
  }

  async createCategory(category: any): Promise<any> {
    Logger.info('Criando categoria', { 
      name: category.name,
      companyId: category.company_id 
    });
    
    try {
      const result = await this.request('categories', {
        method: 'POST',
        body: JSON.stringify({
          ...category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
      });
      
      const created = Array.isArray(result) ? result[0] : result;
      
      Logger.success('Categoria criada com sucesso', { 
        categoryId: created.id,
        name: created.name,
        companyId: created.company_id
      });
      
      return created;
    } catch (error) {
      Logger.error('Falha ao criar categoria', { category, error });
      throw new Error(ERROR_MESSAGES.SAVE_ERROR);
    }
  }

  // ====================================
  // SUBCATEGORIAS
  // ====================================

  async getSubcategories(companyId?: number): Promise<any[]> {
    try {
      const filter = companyId ? `company_id=eq.${companyId}&` : '';
      console.log('🔍 Buscando subcategorias com filtro:', filter);
      const result = await this.request(`subcategories?${filter}select=*&order=name.asc`);
      console.log('📋 Subcategorias encontradas:', result?.length || 0);
      return result || [];
    } catch (error) {
      console.error('❌ Erro ao buscar subcategorias:', error);
      return [];
    }
  }

  // Método UUID-aware para subcategorias
  async getSubcategoriesUuidAware(userId: string): Promise<any[]> {
    console.log(`[STORAGE UUID] 🔍 Buscando subcategorias para userId: ${userId}`);
    
    if (typeof userId === 'string' && userId.includes('-')) {
      try {
        console.log(`[STORAGE UUID] 📋 Buscando usuário: ${userId}`);
        
        const users = await this.request(`profiles?id=eq.${userId}&select=company_id,email`);
        
        console.log('[STORAGE UUID] 📊 Resposta da busca de usuário:', {
          data: users,
          count: users?.length
        });
          
        if (!users || users.length === 0) {
          console.error('[STORAGE UUID] ❌ Usuário não encontrado');
          return [];
        }
        
        const user = users[0];
        if (user?.company_id) {
          console.log(`[STORAGE UUID] ✅ Usuário encontrado: ${user.email}, empresa: ${user.company_id}`);
          
          const subcategories = await this.request(`subcategories?company_id=eq.${user.company_id}&select=*&order=name`);

          console.log('[STORAGE UUID] 📦 Resposta da busca de subcategorias:', {
            count: subcategories?.length || 0,
            filter: `company_id = ${user.company_id}`
          });

          console.log(`[STORAGE UUID] 🎯 RESULTADO FINAL: ${subcategories?.length || 0} subcategorias encontradas`);
          return subcategories || [];
        } else {
          console.warn(`[STORAGE UUID] ⚠️ Usuário ${userId} não tem company_id definido`);
        }
      } catch (error) {
        console.error('[STORAGE UUID] 💥 Erro geral:', error);
      }
    } else {
      console.warn(`[STORAGE UUID] ❌ UserId inválido: ${userId} (não é UUID)`);
    }
    
    return [];
  }

  async createSubcategory(subcategory: any): Promise<any> {
    try {
      console.log('🏷️ Criando subcategoria:', subcategory);
      
      const result = await this.request('subcategories', {
        method: 'POST',
        body: JSON.stringify({
          ...subcategory,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }),
      });
      
      const created = Array.isArray(result) ? result[0] : result;
      console.log('✅ Subcategoria criada:', created);
      return created;
    } catch (error) {
      console.error('❌ Erro ao criar subcategoria:', error);
      throw error;
    }
  }
}
