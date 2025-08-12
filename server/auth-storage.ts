import { AuthUser, hashPassword, comparePassword } from './auth.js';

export interface AuthStorage {
  // Autenticação
  loginUser(email: string, password: string): Promise<AuthUser | null>;
  getUserCompany(userId: string): Promise<{ id: string; name: string; subdomain: string } | null>;
  createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    company_id?: string;
    branch_id?: string;
    role?: string;
    business_category?: string;
  }): Promise<AuthUser>;
  getUserById(id: string): Promise<AuthUser | null>;
  getUserByEmail(email: string): Promise<AuthUser | null>;
  
  // Empresas
  createCompany(companyData: {
    name: string;
    business_category: string;
    cnpj?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    created_by: string;
  }): Promise<any>;
  
  // Filiais
  createBranch(branchData: {
    company_id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    is_main?: boolean;
    manager_id?: string;
  }): Promise<any>;
}

export class SupabaseAuthStorage implements AuthStorage {
  private supabaseUrl: string;
  private supabaseServiceKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL!;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não configuradas');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.supabaseServiceKey,
        'Authorization': `Bearer ${this.supabaseServiceKey}`,
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${error}`);
    }

    return response.json();
  }

  async getUserCompany(userId: string): Promise<{ id: string; name: string; subdomain: string } | null> {
    try {
      // Primeiro, buscar o perfil do usuário para obter o company_id
      const profiles = await this.request(`profiles?id=eq.${userId}&select=company_id`);
      
      if (!profiles || profiles.length === 0) {
        console.log('❌ Perfil não encontrado para o usuário:', userId);
        return null;
      }
      
      const companyId = profiles[0].company_id;
      if (!companyId) {
        console.log('❌ Usuário não está associado a nenhuma empresa:', userId);
        return null;
      }
      
      // Buscar os dados da empresa
      const companies = await this.request(`companies?id=eq.${companyId}&select=id,name,subdomain`);
      
      if (!companies || companies.length === 0) {
        console.log('❌ Empresa não encontrada para o ID:', companyId);
        return null;
      }
      
      const company = companies[0];
      return {
        id: company.id,
        name: company.name,
        subdomain: company.subdomain
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar empresa do usuário:', error);
      return null;
    }
  }

  async loginUser(email: string, password: string): Promise<AuthUser | null> {
    try {
      console.log('🔍 Tentando login com Supabase Auth:', email);
      
      // Usar a API de autenticação do Supabase
      const authResponse = await fetch(`${this.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.supabaseServiceKey,
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!authResponse.ok) {
        console.log('❌ Falha na autenticação Supabase para:', email);
        return null;
      }

      const authData = await authResponse.json();
      console.log('✅ Autenticação Supabase bem-sucedida:', email);
      
      // Buscar dados do usuário na tabela profiles
      const profiles = await this.request(`profiles?email=eq.${email}&select=*`);
      
      if (!profiles || profiles.length === 0) {
        console.log('❌ Profile não encontrado para:', email);
        return null;
      }

      const profile = profiles[0];
      console.log('✅ Profile encontrado:', { id: profile.id, email: profile.email });

      return {
        id: profile.id,
        email: profile.email,
        name: profile.nome || profile.name,
        company_id: profile.company_id,
        branch_id: profile.branch_id,
        role: profile.role,
        business_category: profile.business_category
      };

    } catch (error) {
      console.error('❌ Erro no login:', error);
      return null;
    }
  }

  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    company_id?: string;
    branch_id?: string;
    role?: string;
    business_category?: string;
    subdomain?: string;
  }): Promise<AuthUser> {
    const passwordHash = await hashPassword(userData.password);
    
    console.log('🔐 Criando usuário na tabela profiles:', userData.email);
    
    // Criar na tabela profiles
    const profiles = await this.request('profiles', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password_hash: passwordHash,
        name: userData.name,
        phone: userData.phone,
        company_id: userData.company_id,
        branch_id: userData.branch_id,
        role: userData.role || 'user',
        business_category: userData.business_category,
      }),
    });

    if (!profiles || profiles.length === 0) {
      throw new Error('Falha ao criar usuário');
    }

    const created = profiles[0];
    console.log('✅ Usuário criado na tabela profiles:', created.id);

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      company_id: created.company_id,
      branch_id: created.branch_id,
      role: created.role,
      business_category: created.business_category
    };
  }

  async createUserWithCompany(userData: {
    email: string;
    password: string;
    name: string;
    subdomain: string;
    phone?: string;
  }): Promise<{ user: AuthUser; company: any; branch: any }> {
    console.log('🏢 Criando usuário com empresa automática:', userData.email, 'subdomain:', userData.subdomain);
    
    // Importar storage para operações de empresa
    const { SupabaseStorage } = await import('./storage.js');
    const storage = new SupabaseStorage();
    
    // Buscar ou criar empresa pelo subdomínio
    let company = await storage.getCompanyBySubdomain(userData.subdomain);
    
    if (!company) {
      console.log('🆕 Criando nova empresa para subdomínio:', userData.subdomain);
      company = await storage.createCompanyFromSubdomain(userData.subdomain);
    }
    
    // Buscar filial matriz da empresa
    const branches = await this.request(`branches?company_id=eq.${company.id}&is_main=eq.true&select=*`);
    const mainBranch = branches?.[0];
    
    if (!mainBranch) {
      throw new Error('Filial matriz não encontrada para a empresa');
    }
    
    // Criar usuário associado à empresa e filial
    const user = await this.createUser({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
      company_id: company.id,
      branch_id: mainBranch.id,
      role: 'admin', // Primeiro usuário da empresa é admin
      business_category: company.business_category
    });
    
    console.log('✅ Usuário criado com empresa:', {
      user: user.email,
      company: company.name,
      branch: mainBranch.name
    });
    
    return { user, company, branch: mainBranch };
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    try {
      // Buscar na tabela profiles
      const profiles = await this.request(`profiles?id=eq.${id}&select=*`);
      
      if (!profiles || profiles.length === 0) {
        return null;
      }

      const profile = profiles[0];
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.full_name || profile.display_name || profile.email?.split('@')[0],
        company_id: profile.company_id,
        branch_id: profile.branch_id,
        role: profile.role || 'user',
        business_category: profile.business_category
      };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      // Buscar na tabela profiles
      const profiles = await this.request(`profiles?email=eq.${email}&select=*`);
      
      if (!profiles || profiles.length === 0) {
        return null;
      }

      const profile = profiles[0];
      return {
        id: profile.id,
        email: profile.email,
        name: profile.name || profile.full_name || profile.display_name || profile.email?.split('@')[0],
        company_id: profile.company_id,
        branch_id: profile.branch_id,
        role: profile.role || 'user',
        business_category: profile.business_category
      };
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      return null;
    }
  }

  async createCompany(companyData: {
    name: string;
    business_category: string;
    cnpj?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    created_by: string;
  }): Promise<any> {
    const [created] = await this.request('companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
    return created;
  }

  async createBranch(branchData: {
    company_id: string;
    name: string;
    code: string;
    address?: string;
    phone?: string;
    email?: string;
    is_main?: boolean;
    manager_id?: string;
  }): Promise<any> {
    const [created] = await this.request('branches', {
      method: 'POST',
      body: JSON.stringify(branchData),
    });
    return created;
  }
}