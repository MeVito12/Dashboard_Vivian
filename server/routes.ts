import type { Express } from "express";
import { createServer, type Server } from "http";
import { SupabaseStorage } from './storage';
import { supabase } from './supabase';
import { subdomainMiddleware, companyMiddleware, SubdomainRequest } from './middleware/subdomain.js';
import { authMiddleware, optionalAuthMiddleware, requireAuth } from './middleware/auth';
import { subdomainAuthMiddleware } from './middleware/subdomain-auth';
import { ProductSchema } from '../shared/schema';
import { companiesRouter } from './routes/companies';

// Logger temporário simples
const Logger = {
  info: (msg: string, data?: any) => console.log(`ℹ️ ${msg}`, data || ''),
  success: (msg: string, data?: any) => console.log(`✅ ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.warn(`⚠️ ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.error(`❌ ${msg}`, data || ''),
  debug: (msg: string, data?: any) => console.log(`🐛 ${msg}`, data || '')
};

// Constantes temporárias
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Não autorizado',
  MISSING_REQUIRED_FIELDS: 'Preencha todos os campos obrigatórios',
  USER_NOT_FOUND: 'Usuário não encontrado',
  LOGIN_FAILED: 'Email ou senha incorretos',
  SERVER_ERROR: 'Erro interno do servidor',
  LOAD_ERROR: 'Erro ao carregar dados',
  SAVE_ERROR: 'Erro ao salvar dados',
  DELETE_ERROR: 'Erro ao excluir item',
  UPDATE_ERROR: 'Erro ao atualizar dados',
  INVALID_DATA: 'Dados inválidos'
};

const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  CREATE_SUCCESS: (item: string) => `${item} criado com sucesso`,
  UPDATE_SUCCESS: (item: string) => `${item} atualizado com sucesso`,
  DELETE_SUCCESS: (item: string) => `${item} excluído com sucesso`
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};


const storage = new SupabaseStorage();

export async function registerRoutes(app: Express): Promise<Server> {
  // Registrar rotas da API de empresas
  app.use('/api/companies', companiesRouter);
  const server = createServer(app);

  // Middlewares
  app.use(subdomainMiddleware);
  app.use(companyMiddleware);

  // Health check
  app.get("/api/health", async (_req, res) => {
    res.json({
      status: "ok",
      database: { status: 'connected', type: 'Supabase PostgreSQL' }
    });
  });



  // Company routes
  app.use('/api/companies', companiesRouter);

  // Listar usuários por empresa (para vendedores)
  app.get("/api/company/users", authMiddleware, async (req, res) => {
    const companyId = req.headers['x-company-id'] as string;
    
    if (!companyId) {
      Logger.warn('Tentativa de listar usuários sem company_id');
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
        error: 'ID da empresa não fornecido' 
      });
    }

    try {
      Logger.info('Buscando usuários da empresa', { companyId });
      const users = await storage.getUsersByCompany(companyId);
      
      // Filtra apenas usuários com papel de vendedor
      const sellers = users.filter(user => 
        user.role?.toLowerCase() === 'vendedor' || 
        user.role?.toLowerCase() === 'vendedor_gerente'
      );
      
      Logger.success('Usuários encontrados', { 
        companyId, 
        total: users.length,
        sellers: sellers.length 
      });
      
      return res.status(HTTP_STATUS.OK).json({
        data: sellers,
        message: 'Usuários encontrados com sucesso'
      });
      
    } catch (error: any) {
      Logger.error('Falha ao buscar usuários da empresa', { 
        companyId, 
        error: error.message 
      });
      
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Permissões por usuário (boolean map)
  app.get("/api/users/:id/permissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "ID inválido" });
      }
      const access = await storage.getUserAccess(id);
      return res.status(HTTP_STATUS.OK).json(access);
    } catch (error: any) {
      Logger.error('Erro ao obter permissões do usuário', { id: req.params.id, error: error?.message });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.LOAD_ERROR });
    }
  });

  app.put("/api/users/:id/permissions", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: "ID inválido" });
      }
      const access = req.body as Record<string, boolean>;
      await storage.upsertUserAccess(id, access || {});
      return res.status(HTTP_STATUS.OK).json({ success: true });
    } catch (error: any) {
      Logger.error('Erro ao atualizar permissões do usuário', { id: req.params.id, error: error?.message });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SAVE_ERROR });
    }
  });

  app.patch("/api/appointments/:id", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const id = req.params.id;
    Logger.info('Requisição para atualizar agendamento', {
      userId,
      appointmentId: id,
      updateData: req.body
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de atualizar agendamento sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      if (!id || id.trim() === '') {
        Logger.warn('ID de agendamento inválido', { id });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'ID de agendamento inválido' });
      }

      const processedUpdate = {
        title: req.body.title,
        appointment_date: req.body.appointment_date,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        type: req.body.type,
        status: req.body.status,
        notes: req.body.notes,
        client_id: req.body.client_id,
        branch_id: req.body.branch_id,
      } as any;

      Object.keys(processedUpdate).forEach((key) => {
        if (processedUpdate[key] === undefined) delete processedUpdate[key];
      });

      const updated = await storage.updateAppointment(id as any, processedUpdate);
      if (!updated) {
        Logger.warn('Agendamento não encontrado para atualização', { appointmentId: id });
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Agendamento não encontrado' });
      }

      Logger.success('Agendamento atualizado com sucesso', { appointmentId: id, userId });
      return res.json({ data: updated, message: SUCCESS_MESSAGES.UPDATE_SUCCESS('Agendamento') });
    } catch (error: any) {
      Logger.error('Erro ao atualizar agendamento', { appointmentId: id, userId, error: error?.message, updateData: req.body });
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.SAVE_ERROR });
    }
  });

  // Autenticação unificada - Sistema UUID otimizado
  app.post("/api/auth/login", subdomainMiddleware, companyMiddleware, async (req: SubdomainRequest, res) => {
    Logger.info('Tentativa de login', { email: req.body.email, subdomain: req.subdomain });

    try {
      const { email, password } = req.body;

      if (!email || !password) {
        Logger.warn('Tentativa de login sem credenciais completas', { email });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
        });
      }

      // Sistema UUID simplificado
      const { SupabaseAuthStorage } = await import('./auth-storage.js');
      const authStorage = new SupabaseAuthStorage();

      const user = await authStorage.loginUser(email, password);
      if (user) {
        // Verifica se o usuário pertence à empresa do subdomínio
        if (req.subdomain && req.subdomain !== 'localhost' && req.company) {
          // Se for admin ou master, permite o acesso a qualquer subdomínio
          if (user.role !== 'admin' && user.role !== 'master') {
            const userCompany = await authStorage.getUserCompany(user.id);
            
            if (userCompany?.id !== req.company.id) {
              Logger.warn('Tentativa de login em subdomínio não autorizado', { 
                email, 
                userCompanyId: userCompany?.id, 
                requestedCompanyId: req.company.id 
              });
              
              return res.status(HTTP_STATUS.FORBIDDEN).json({
                error: 'Acesso não autorizado: usuário não pertence a esta empresa'
              });
            }
          }
        }

        Logger.success('Login realizado com sucesso', {
          userId: user.id,
          email: user.email,
          role: user.role
        });

        // Get complete company data if available
        let companyData = null;
        if (user.company_id) {
          try {
            const { data: company, error } = await supabase
              .from('companies')
              .select('*')
              .eq('id', user.company_id)
              .single();
              
            if (!error && company) {
              companyData = {
                id: company.id,
                name: company.name,
                subdomain: company.subdomain,
                logo_url: company.logo_url,
                created_at: company.created_at
              };
              Logger.info('Company data found for user', { companyId: company.id, companyName: company.name });
            } else if (error) {
              Logger.warn('Error fetching company data', { companyId: user.company_id, error });
            }
          } catch (error) {
            Logger.error('Exception when fetching company data', { error });
          }
        }

        // Prepare user response with all necessary fields
        const userResponse = {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0], // Fallback para o nome
          role: user.role || 'user',
          company_id: user.company_id, // Usando snake_case para consistência
          branch_id: user.branch_id,   // Usando snake_case para consistência
          business_category: user.business_category || '',
          // Include complete company data if available
          company: companyData || (user.company_id ? { 
            id: user.company_id,
            name: req.company?.name || 'Minha Empresa',
            subdomain: req.subdomain || 'minha-empresa'
          } : null),
          // For backward compatibility
          company_name: companyData?.name || req.company?.name,
          company_subdomain: companyData?.subdomain || req.subdomain,
          // Permissions and metadata
          permissions: user.permissions || [],
          // Legacy fields for compatibility
          uuid: user.id,
          company_uuid: user.company_id,
          branch_uuid: user.branch_id,
          isActive: true,
          subdomain: req.subdomain
        };

        Logger.success('Login response prepared', { 
          userId: user.id, 
          companyId: user.company_id,
          hasCompanyData: !!companyData
        });
        
        return res.status(HTTP_STATUS.OK).json({
          user: userResponse,
          success: true,
          authType: 'uuid',
          message: SUCCESS_MESSAGES.LOGIN_SUCCESS
        });
      }

      Logger.warn('Tentativa de login com credenciais inválidas', { email });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: ERROR_MESSAGES.LOGIN_FAILED
      });
    } catch (error: any) {
      Logger.error('Falha no processo de login', { email: req.body.email, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  });

  // Registro automático por subdomínio otimizado
  app.post("/api/auth/register", async (req: SubdomainRequest, res) => {
    Logger.info('Tentativa de registro', {
      email: req.body.email,
      subdomain: req.subdomain
    });

    try {
      const { email, password, name, phone } = req.body;

      if (!email || !password || !name) {
        Logger.warn('Tentativa de registro sem dados obrigatórios', { email });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.MISSING_REQUIRED_FIELDS
        });
      }

      const subdomain = req.subdomain;

      if (!subdomain || subdomain === 'localhost') {
        Logger.warn('Tentativa de registro sem subdomínio válido', { subdomain });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: "Subdomínio não detectado"
        });
      }

      if (subdomain === 'master' || subdomain === 'admin') {
        Logger.warn('Tentativa de registro em subdomínio restrito', { subdomain });
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          error: "Não é possível registrar usuários neste subdomínio"
        });
      }

      const { SupabaseAuthStorage } = await import('./auth-storage.js');
      const authStorage = new SupabaseAuthStorage();

      const result = await authStorage.createUserWithCompany({
        email,
        password,
        name,
        phone,
        subdomain
      });

      Logger.success('Registro realizado com sucesso', {
        userId: result.user.id,
        email: result.user.email,
        companyId: result.company.id,
        subdomain
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
          companyId: result.company.id,
          companyName: result.company.name,
          branchId: result.branch.id,
          branchName: result.branch.name
        },
        company: result.company,
        branch: result.branch,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Conta')
      });
    } catch (error: any) {
      Logger.error('Falha no registro', {
        email: req.body.email,
        subdomain: req.subdomain,
        error
      });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: error.message || ERROR_MESSAGES.SERVER_ERROR
      });
    }
  });

  // Filiais
  app.get("/api/branches", async (req: SubdomainRequest, res) => {
    try {
      const { company_id } = req.query;

      if (!company_id) {
        return res.status(400).json({ error: "company_id é obrigatório" });
      }

      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/branches", async (req: SubdomainRequest, res) => {
    try {
      const branchData = req.body;

      // Validar se não é a primeira filial sendo criada como não-matriz
      if (!branchData.is_main) {
        const existingBranches = await storage.getBranchesByCompany(branchData.company_id); // UUID, não parseInt
        if (existingBranches.length === 0) {
          branchData.is_main = true; // Primeira filial sempre é matriz
        }
      }

      const branch = await storage.createBranch(branchData);

      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/branches/:id", async (req: SubdomainRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updated = await storage.updateBranch(id, updates); // UUID, não parseInt

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/branches/:id", async (req: SubdomainRequest, res) => {
    try {
      const { id } = req.params;

      // Verificar se não é a filial matriz
      // Verificar se não é a filial matriz seria feito no storage
      const success = await storage.deleteBranch(id); // UUID, não parseInt
      if (!success) {
        return res.status(400).json({ error: "Não é possível deletar a filial matriz" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Usuários
  app.get("/api/users", async (req, res) => {
    try {
      const { company_id } = req.query;

      if (company_id) {
        const companyIdStr = company_id as string; // UUID, não parseInt
        if (!companyIdStr || companyIdStr.trim() === '') {
          return res.status(400).json({ error: 'ID da empresa inválido' });
        }
        const users = await storage.getUsersByCompany(companyIdStr);
        res.json(users);
      } else {
        const users = await storage.getAllUsers();
        res.json(users);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const user = await storage.updateUser(id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Empresas
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getCompanies();
      res.json(companies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const company = await storage.createCompany(req.body);
      res.json(company);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Produtos (UUID-aware otimizado)
  app.get("/api/products", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    
    console.log('🌐 [GET /api/products] REQUISIÇÃO RECEBIDA');
    console.log('📋 [GET /api/products] Headers:', { userId, companyId });
    Logger.info('Requisição para buscar produtos', { userId, companyId });

    try {
      if (!userId || userId.trim() === '') {
        console.log('❌ [GET /api/products] USER ID AUSENTE');
        Logger.warn('Tentativa de buscar produtos sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      console.log('🔍 [GET /api/products] Chamando getProductsUuidAware...');
      const products = await storage.getProductsUuidAware(userId);
      console.log('📦 [GET /api/products] Produtos retornados:', products?.length || 0);

      Logger.success('Produtos retornados com sucesso', {
        count: products.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: products,
        count: products.length,
        message: products.length > 0 ? 'Produtos carregados com sucesso' : 'Nenhum produto encontrado'
      });
    } catch (error: any) {
      console.log('❌ [GET /api/products] ERRO:', error);
      Logger.error('Falha ao buscar produtos', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Endpoint de teste para verificar dados recebidos
  app.post("/api/products/test", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('TESTE ATUALIZADO - dados recebidos:', {
      userId,
      body: req.body,
      categoryId: req.body.category_id,
      categoryIdType: typeof req.body.category_id,
      subcategoryId: req.body.subcategory_id,
      subcategoryIdType: typeof req.body.subcategory_id
    });
    
    res.json({
      received: req.body,
      analysis: {
        categoryId: {
          value: req.body.category_id,
          type: typeof req.body.category_id,
          isNaN: isNaN(req.body.category_id),
          isValid: req.body.category_id && req.body.category_id > 0 && !isNaN(req.body.category_id)
        },
        subcategoryId: {
          value: req.body.subcategory_id,
          type: typeof req.body.subcategory_id,
          isNaN: req.body.subcategory_id ? isNaN(req.body.subcategory_id) : 'N/A',
          isValid: !req.body.subcategory_id || (req.body.subcategory_id > 0 && !isNaN(req.body.subcategory_id))
        }
      }
    });
  });

  app.post("/api/products", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar produto', {
      userId,
      productName: req.body.name,
      fullBody: req.body,
      categoryId: req.body.category_id,
      subcategoryId: req.body.subcategory_id
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de criar produto sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Processar dados adaptando para estrutura real do banco
      const processedData = {
        ...req.body,
        category_id: req.body.category_id || undefined, // TEXT no banco
        subcategory_id: req.body.subcategory_id && req.body.subcategory_id !== '' ? req.body.subcategory_id : undefined, // UUID no banco
        price: req.body.price ? parseFloat(req.body.price) : 0,
        stock: req.body.stock ? parseInt(req.body.stock) : 0,
        min_stock: req.body.min_stock ? parseInt(req.body.min_stock) : 0,
        company_id: req.body.company_id || undefined, // UUID no banco
        branch_id: req.body.branch_id || undefined, // UUID no banco
        created_by: req.body.created_by || undefined, // UUID no banco para products
      };

      Logger.info('Dados processados para validação:', { 
        original: req.body,
        processed: processedData 
      });

      // Validação básica sem Zod (temporário)
      if (!processedData.name || !processedData.category_id || !processedData.company_id || !processedData.created_by) {
        Logger.warn('Dados obrigatórios faltando', { processedData });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Dados obrigatórios faltando: name, category_id, company_id, created_by'
        });
      }
      
      // Remover campos undefined para não enviar ao banco
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const product = await storage.createProduct(processedData);

      Logger.success('Produto criado com sucesso', {
        productId: product.id,
        name: product.name,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: product,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Produto')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar produto', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  app.patch("/api/products/:id", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para atualizar produto', {
      userId,
      productId: req.params.id,
      updateData: req.body
    });

    try {
      const id = req.params.id; // UUID, não parseInt

      if (!userId || userId.trim() === '') {
        Logger.warn('Tentativa de atualizar produto sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      if (!id || id === 'undefined' || id === 'null') {
        Logger.warn('ID de produto inválido', { id });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'ID de produto inválido' });
      }

      // Normalizar payload semelhante ao POST /api/products
      const processedUpdate: any = {
        ...req.body,
        category_id: req.body.category_id || undefined, // TEXT no banco
        subcategory_id:
          req.body.subcategory_id && req.body.subcategory_id !== ''
            ? req.body.subcategory_id
            : undefined, // UUID opcional
        price:
          req.body.price !== undefined && req.body.price !== null && `${req.body.price}`.trim() !== ''
            ? parseFloat(req.body.price)
            : undefined,
        stock:
          req.body.stock !== undefined && req.body.stock !== null && `${req.body.stock}`.trim() !== ''
            ? parseInt(req.body.stock)
            : undefined,
        min_stock:
          req.body.min_stock !== undefined && req.body.min_stock !== null && `${req.body.min_stock}`.trim() !== ''
            ? parseInt(req.body.min_stock)
            : undefined,
        company_id: req.body.company_id || undefined, // UUID
        branch_id: req.body.branch_id || undefined // UUID
      };

      // Remover campos undefined para não enviar ao banco
      Object.keys(processedUpdate).forEach((key) => {
        if (processedUpdate[key] === undefined) delete processedUpdate[key];
      });

      Logger.debug('Payload normalizado para atualização de produto', {
        productId: id,
        processedUpdate
      });

      const product = await storage.updateProduct(id, processedUpdate);
      if (!product) {
        Logger.warn('Produto não encontrado para atualização', { productId: id });
        return res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'Produto não encontrado' });
      }

      Logger.success('Produto atualizado com sucesso', {
        productId: id,
        userId,
        updatedFields: Object.keys(processedUpdate)
      });

      res.status(HTTP_STATUS.OK).json({
        data: product,
        message: SUCCESS_MESSAGES.UPDATE_SUCCESS('Produto')
      });
    } catch (error: any) {
      Logger.error('Erro ao atualizar produto', { 
        productId: req.params.id, 
        userId, 
        error: error.message,
        updateData: req.body 
      });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: ERROR_MESSAGES.UPDATE_ERROR });
    }
  });

  app.delete("/api/products/:id", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const productId = req.params.id; // UUID, não parseInt
    Logger.info('Requisição para deletar produto', { userId, productId });

    try {
      if (!userId) {
        Logger.warn('Tentativa de deletar produto sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const success = await storage.deleteProduct(productId);

      if (success) {
        Logger.success('Produto deletado com sucesso', { productId, userId });
        res.status(HTTP_STATUS.OK).json({
          success: true,
          message: SUCCESS_MESSAGES.DELETE_SUCCESS('Produto')
        });
      } else {
        Logger.warn('Tentativa de deletar produto inexistente', { productId });
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: "Produto não encontrado"
        });
      }
    } catch (error: any) {
      Logger.error('Falha ao deletar produto', { productId, userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.DELETE_ERROR
      });
    }
  });

  // Vendas (UUID-aware otimizado)
  app.get("/api/sales", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para buscar vendas', { userId });

    try {
      if (!userId || userId.trim() === '') {
        Logger.warn('Tentativa de buscar vendas sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const sales = await storage.getSalesUuidAware(userId);

      Logger.success('Vendas retornadas com sucesso', {
        count: sales.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: sales,
        count: sales.length,
        message: sales.length > 0 ? 'Vendas carregadas com sucesso' : 'Nenhuma venda encontrada'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar vendas', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/sales", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar venda', {
      userId,
      saleData: req.body
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de criar venda sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const sale = await storage.createSale(req.body);

      // Se há detalhes de parcelas, criar as parcelas
      if (req.body.installmentDetails && req.body.installmentDetails.length > 0) {
        try {
          for (let i = 0; i < req.body.installmentDetails.length; i++) {
            const installment = req.body.installmentDetails[i];
            const installmentData = {
              sale_id: sale.id,
              installment_number: i + 1,
              total_installments: req.body.installmentDetails.length,
              amount: installment.amount,
              due_date: installment.dueDate,
              status: installment.status,
              company_id: req.body.company_id,
              branch_id: req.body.branch_id,
              created_by: req.body.created_by
            };
            
            await storage.createInstallment(installmentData);
          }
          
          Logger.success('Parcelas criadas com sucesso', {
            saleId: sale.id,
            installments: req.body.installmentDetails.length
          });
        } catch (installmentError) {
          Logger.error('Erro ao criar parcelas', {
            saleId: sale.id,
            error: installmentError
          });
        }
      }

      // Criar entrada financeira automática para a venda
      if (sale && sale.total_price) {
        const financialEntry = {
          type: 'income' as const,
          amount: sale.total_price,
          description: `Venda realizada - ${sale.quantity}x produto`,
          status: 'paid' as const,
          category: 'vendas',
          reference_id: sale.id,
          reference_type: 'sale',
          company_id: sale.company_id,
          branch_id: sale.branch_id,
          created_by: sale.created_by
        };

        try {
          await storage.createFinancialEntry(financialEntry);
          Logger.success('Entrada financeira automática criada para venda', {
            saleId: sale.id,
            amount: sale.total_price
          });
        } catch (finError) {
          Logger.error('Falha ao criar entrada financeira automática', {
            saleId: sale.id,
            error: finError
          });
          // Não falhar a venda se houver erro na entrada financeira
        }
      }

      Logger.success('Venda criada com sucesso', {
        saleId: sale.id,
        amount: sale.total_price,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: sale,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Venda')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar venda', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  // ====================================
  // PARCELAS
  // ====================================

  // Parcelas - Listar por venda
  app.get("/api/sales/:saleId/installments", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const { saleId } = req.params;
    
    try {
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const installments = await storage.getInstallmentsBySale(saleId);
      
      res.status(HTTP_STATUS.OK).json({
        data: installments,
        message: 'Parcelas carregadas com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao buscar parcelas', { saleId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Parcelas - Atualizar status
  app.patch("/api/installments/:installmentId/status", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const { installmentId } = req.params;
    const { status } = req.body;
    
    try {
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      if (!['pending', 'paid'].includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Status inválido. Use "pending" ou "paid"'
        });
      }

      const updatedInstallment = await storage.updateInstallmentStatus(installmentId, status);
      
      // Buscar o cliente relacionado à parcela para atualizar seu status
      try {
        const installmentWithSale = await storage.request(
          `installments?id=eq.${installmentId}&select=*,sales!inner(client_id)`
        );
        
        if (installmentWithSale.length > 0 && installmentWithSale[0].sales?.client_id) {
          await storage.updateClientDebtStatus(installmentWithSale[0].sales.client_id);
          Logger.info('Status de inadimplência do cliente atualizado automaticamente', {
            clientId: installmentWithSale[0].sales.client_id,
            installmentId
          });
        }
      } catch (clientUpdateError) {
        Logger.error('Erro ao atualizar status do cliente após pagamento de parcela', {
          installmentId,
          error: clientUpdateError
        });
        // Não falhar a operação principal se houver erro na atualização do cliente
      }
      
      res.status(HTTP_STATUS.OK).json({
        data: updatedInstallment,
        message: `Parcela marcada como ${status === 'paid' ? 'paga' : 'pendente'}`
      });
    } catch (error: any) {
      Logger.error('Erro ao atualizar status da parcela', { installmentId, status, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.UPDATE_ERROR
      });
    }
  });

  // ====================================
  // ANALYTICS - FILIAIS
  // ====================================

  // Analytics - Receitas por filial
  app.get("/api/analytics/branch-revenue", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    
    try {
      if (!userId || !companyId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Buscar receitas por filial (vendas + entradas financeiras)
      const branchRevenue = await storage.getBranchRevenue(companyId);
      
      res.status(HTTP_STATUS.OK).json({
        data: branchRevenue,
        message: 'Receitas por filial carregadas com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao buscar receitas por filial', { companyId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Analytics - Gastos por filial
  app.get("/api/analytics/branch-expenses", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    
    try {
      if (!userId || !companyId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Buscar gastos por filial (saídas financeiras)
      const branchExpenses = await storage.getBranchExpenses(companyId);
      
      res.status(HTTP_STATUS.OK).json({
        data: branchExpenses,
        message: 'Gastos por filial carregados com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao buscar gastos por filial', { companyId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // ====================================
  // SISTEMA DE INADIMPLÊNCIA
  // ====================================

  // Atualizar status de inadimplência de um cliente
  app.post("/api/clients/:clientId/update-debt-status", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const { clientId } = req.params;
    
    try {
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const updatedClient = await storage.updateClientDebtStatus(clientId);
      
      res.status(HTTP_STATUS.OK).json({
        data: updatedClient,
        message: 'Status de inadimplência atualizado com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao atualizar status de inadimplência', { clientId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.UPDATE_ERROR
      });
    }
  });

  // Listar clientes inadimplentes
  app.get("/api/clients/overdue", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    
    try {
      if (!userId || !companyId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const overdueClients = await storage.getOverdueClients(companyId);
      
      res.status(HTTP_STATUS.OK).json({
        data: overdueClients,
        message: 'Clientes inadimplentes carregados com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao buscar clientes inadimplentes', { companyId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Obter informações detalhadas da dívida de um cliente
  app.get("/api/clients/:clientId/debt-info", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const { clientId } = req.params;
    
    try {
      if (!userId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const debtInfo = await storage.getClientDebtInfo(clientId);
      
      if (!debtInfo) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: 'Cliente não encontrado'
        });
      }
      
      res.status(HTTP_STATUS.OK).json({
        data: debtInfo,
        message: 'Informações de dívida carregadas com sucesso'
      });
    } catch (error: any) {
      Logger.error('Erro ao buscar informações de dívida', { clientId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  // Atualizar status de inadimplência em lote (job diário)
  app.post("/api/clients/update-all-debt-status", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const companyId = req.headers['x-company-id'] as string;
    
    try {
      if (!userId || !companyId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Buscar todos os clientes da empresa que têm parcelas
      const clientsWithInstallments = await storage.request(
        `clients?company_id=eq.${companyId}&select=id`
      );

      let updatedCount = 0;
      
      for (const client of clientsWithInstallments) {
        try {
          await storage.updateClientDebtStatus(client.id);
          updatedCount++;
        } catch (error) {
          Logger.error('Erro ao atualizar cliente específico', { clientId: client.id, error });
        }
      }
      
      res.status(HTTP_STATUS.OK).json({
        data: { updatedCount, totalClients: clientsWithInstallments.length },
        message: `Status de inadimplência atualizado para ${updatedCount} clientes`
      });
    } catch (error: any) {
      Logger.error('Erro ao atualizar status em lote', { companyId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.UPDATE_ERROR
      });
    }
  });

  // ====================================
  // CLIENTES
  // ====================================

  // Clientes (apenas Supabase UUID)
  app.get("/api/clients", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;

    try {
      if (!userId || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID é obrigatório no header x-user-id' });
      }

      const clients = await storage.getClientsUuidAware(userId);

      Logger.success('Clientes retornados com sucesso', {
        count: clients.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: clients,
        count: clients.length,
        message: clients.length > 0 ? 'Clientes carregados com sucesso' : 'Nenhum cliente encontrado'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar clientes', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const client = await storage.createClient(req.body);
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/clients/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const client = await storage.updateClient(id, req.body);
      if (!client) {
        return res.status(404).json({ error: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const success = await storage.deleteClient(id);
      if (success) {
        res.json({ success: true, message: "Cliente deletado com sucesso" });
      } else {
        res.status(404).json({ error: "Cliente não encontrado" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agendamentos (apenas Supabase UUID)
  app.get("/api/appointments", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;

    try {
      if (!userId || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID é obrigatório no header x-user-id' });
      }

      const appointments = await storage.getAppointmentsUuidAware(userId);

      Logger.success('Agendamentos retornados com sucesso', {
        count: appointments.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: appointments,
        count: appointments.length,
        message: appointments.length > 0 ? 'Agendamentos carregados com sucesso' : 'Nenhum agendamento encontrado'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar agendamentos', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/appointments", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar agendamento', {
      userId,
      title: req.body.title,
      appointmentDate: req.body.appointment_date,
      fullBody: req.body
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de criar agendamento sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Processar dados adaptando para estrutura real do banco
      const processedData = {
        ...req.body,
        company_id: req.body.company_id || undefined,
        branch_id: req.body.branch_id || undefined,
        created_by: req.body.created_by || undefined, // UUID no banco
        client_id: req.body.client_id || undefined,
      };

      Logger.info('Dados processados para agendamento:', { 
        original: req.body,
        processed: processedData 
      });

      // Validação básica
      if (!processedData.title || !processedData.appointment_date || !processedData.start_time || !processedData.type) {
        Logger.warn('Dados obrigatórios faltando para agendamento', { processedData });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Dados obrigatórios faltando: title, appointment_date, start_time, type'
        });
      }
      
      // Remover campos undefined
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const appointment = await storage.createAppointment(processedData);

      Logger.success('Agendamento criado com sucesso', {
        appointmentId: appointment.id,
        title: appointment.title,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: appointment,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Agendamento')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar agendamento', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  // Financeiro (apenas Supabase UUID)
  app.get("/api/financial", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;

    try {
      if (!userId || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID é obrigatório no header x-user-id' });
      }

      const entries = await storage.getFinancialEntriesUuidAware(userId);

      Logger.success('Entradas financeiras retornadas com sucesso', {
        count: entries.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: entries,
        count: entries.length,
        message: entries.length > 0 ? 'Entradas financeiras carregadas com sucesso' : 'Nenhuma entrada encontrada'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar entradas financeiras', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/financial", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar entrada financeira', {
      userId,
      entryType: req.body.type,
      amount: req.body.amount,
      fullBody: req.body
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de criar entrada financeira sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Processar dados adaptando para estrutura real do banco
      const processedData = {
        ...req.body,
        amount: req.body.amount ? parseFloat(req.body.amount) : 0,
        company_id: req.body.company_id || undefined,
        branch_id: req.body.branch_id || undefined,
        created_by: req.body.created_by || undefined, // UUID no banco
        client_id: req.body.client_id || undefined,
        reference_id: req.body.reference_id || undefined, // UUID, não parseInt
      };

      Logger.info('Dados processados para entrada financeira:', { 
        original: req.body,
        processed: processedData 
      });

      // Validação básica
      if (!processedData.type || !processedData.amount || !processedData.description || !processedData.category) {
        Logger.warn('Dados obrigatórios faltando para entrada financeira', { processedData });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Dados obrigatórios faltando: type, amount, description, category'
        });
      }
      
      // Remover campos undefined
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const entry = await storage.createFinancialEntry(processedData);

      Logger.success('Entrada financeira criada com sucesso', {
        entryId: entry.id,
        type: entry.type,
        amount: entry.amount,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: entry,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Entrada financeira')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar entrada financeira', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  app.patch("/api/financial/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const entry = await storage.updateFinancialEntry(id, req.body);
      if (!entry) {
        return res.status(404).json({ error: "Entrada financeira não encontrada" });
      }
      res.json(entry);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/financial/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const success = await storage.deleteFinancialEntry(id);
      if (success) {
        res.json({ success: true, message: "Entrada financeira deletada com sucesso" });
      } else {
        res.status(404).json({ error: "Entrada financeira não encontrada" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transferências (apenas Supabase UUID)
  app.get("/api/transfers", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;

    try {
      if (!userId || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID é obrigatório no header x-user-id' });
      }

      const transfers = await storage.getTransfersUuidAware(userId);

      Logger.success('Transferências retornadas com sucesso', {
        count: transfers.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: transfers,
        count: transfers.length,
        message: transfers.length > 0 ? 'Transferências carregadas com sucesso' : 'Nenhuma transferência encontrada'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar transferências', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/transfers", async (req, res) => {
    try {
      const transfer = await storage.createTransfer(req.body);
      res.json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Transferências de Dinheiro
  app.get("/api/money-transfers", async (req, res) => {
    try {
      const transfers = await storage.getMoneyTransfers();
      res.json(transfers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/money-transfers", async (req, res) => {
    try {
      const transfer = await storage.createMoneyTransfer(req.body);
      res.json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/money-transfers/:id", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    const transferId = req.params.id; // UUID, não parseInt
    Logger.info('Requisição para atualizar transferência de dinheiro', {
      userId,
      transferId,
      newStatus: req.body.status
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de atualizar transferência sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Se está marcando como concluída, adicionar data de conclusão
      if (req.body.status === 'completed' && !req.body.completed_date) {
        req.body.completed_date = new Date().toISOString();
      }

      const transfer = await storage.updateMoneyTransfer(transferId, req.body);

      if (!transfer) {
        Logger.warn('Tentativa de atualizar transferência inexistente', { transferId });
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          error: "Transferência não encontrada"
        });
      }

      Logger.success('Transferência atualizada com sucesso', {
        transferId,
        status: transfer.status,
        userId
      });

      res.status(HTTP_STATUS.OK).json({
        data: transfer,
        message: SUCCESS_MESSAGES.UPDATE_SUCCESS('Transferência')
      });
    } catch (error: any) {
      Logger.error('Falha ao atualizar transferência', { transferId, userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.UPDATE_ERROR
      });
    }
  });

  app.delete("/api/money-transfers/:id", async (req, res) => {
    try {
      const id = req.params.id; // UUID, não parseInt
      const success = await storage.deleteMoneyTransfer(id);

      if (success) {
        res.json({ success: true, message: "Transferência deletada com sucesso" });
      } else {
        res.status(404).json({ error: "Transferência não encontrada" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Filiais
  app.get("/api/branches", async (req, res) => {
    try {
      const branches = await storage.getBranches();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/branches", async (req, res) => {
    try {
      const branch = await storage.createBranch(req.body);
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cupons
  app.get("/api/coupons", async (req, res) => {
    try {
      const companyId = req.query.company_id as string; // UUID, não parseInt
      const coupons = await storage.getCoupons(companyId);
      res.json(coupons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/coupons", async (req, res) => {
    try {
      const coupon = await storage.createCoupon(req.body);
      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/coupons/validate/:code", async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const coupon = await storage.validateCoupon(code);

      if (!coupon) {
        return res.status(404).json({ error: "Cupom não encontrado" });
      }

      if (!coupon.is_active) {
        return res.status(400).json({ error: "Cupom inativo" });
      }

      // Verificar data de validade
      if (coupon.end_date) {
        const endDate = new Date(coupon.end_date);
        if (new Date() > endDate) {
          return res.status(400).json({ error: "Cupom expirado" });
        }
      }

      // Verificar limite de uso
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        return res.status(400).json({ error: "Cupom esgotado" });
      }

      res.json(coupon);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/coupons/apply", async (req, res) => {
    try {
      const { couponId, saleAmount } = req.body;
      const result = await storage.applyCoupon(couponId, saleAmount);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Categorias (UUID-aware otimizado)
  app.get("/api/categories", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para buscar categorias', { userId });

    try {
      if (!userId || userId.trim() === '') {
        Logger.warn('Tentativa de buscar categorias sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      const categories = await storage.getCategoriesUuidAware(userId);

      Logger.success('Categorias retornadas com sucesso', {
        count: categories.length,
        userId
      });

      return res.status(HTTP_STATUS.OK).json({
        data: categories,
        count: categories.length,
        message: categories.length > 0 ? 'Categorias carregadas com sucesso' : 'Nenhuma categoria encontrada'
      });
    } catch (error: any) {
      Logger.error('Falha ao buscar categorias', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/categories", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar categoria', {
      userId,
      categoryName: req.body.name,
      fullBody: req.body
    });

    try {
      if (!userId) {
        Logger.warn('Tentativa de criar categoria sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Processar dados adaptando para estrutura real do banco
      const processedData = {
        ...req.body,
        company_id: req.body.company_id || undefined,
        created_by: req.body.created_by || undefined, // UUID no banco
        color: req.body.color || '#3B82F6', // Cor padrão
      };

      Logger.info('Dados processados para categoria:', { 
        original: req.body,
        processed: processedData 
      });

      // Validação básica
      if (!processedData.name || !processedData.company_id || !processedData.created_by) {
        Logger.warn('Dados obrigatórios faltando para categoria', { processedData });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Dados obrigatórios faltando: name, company_id, created_by'
        });
      }
      
      // Remover campos undefined
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const category = await storage.createCategory(processedData);

      Logger.success('Categoria criada com sucesso', {
        categoryId: category.id,
        name: category.name,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: category,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Categoria')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar categoria', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  // Subcategorias (UUID-aware)
  app.get("/api/subcategories", async (req, res) => {
    const userId = req.headers['x-user-id'] as string;

    try {
      if (!userId || userId.trim() === '') {
        return res.status(400).json({ error: 'User ID é obrigatório no header x-user-id' });
      }

      const subcategories = await storage.getSubcategoriesUuidAware(userId);

      Logger.success('Subcategorias retornadas com sucesso', {
        count: subcategories.length,
        userId
      });

      const response = {
        data: subcategories,
        count: subcategories.length,
        message: subcategories.length > 0 ? 'Subcategorias carregadas com sucesso' : 'Nenhuma subcategoria encontrada'
      };
      
      Logger.info('Resposta de subcategorias sendo enviada', { response });
      
      return res.status(HTTP_STATUS.OK).json(response);
    } catch (error: any) {
      Logger.error('Falha ao buscar subcategorias', { userId, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.LOAD_ERROR
      });
    }
  });

  app.post("/api/subcategories", authMiddleware, async (req, res) => {
    const userId = req.headers['x-user-id'] as string;
    Logger.info('Requisição para criar subcategoria', {
      userId,
      subcategoryName: req.body.name,
      categoryId: req.body.category_id,
      fullBody: req.body
    });
    
    try {
      if (!userId) {
        Logger.warn('Tentativa de criar subcategoria sem ID de usuário');
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: ERROR_MESSAGES.UNAUTHORIZED
        });
      }

      // Processar dados adaptando para estrutura real do banco
      const processedData = {
        ...req.body,
        company_id: req.body.company_id || undefined,
        created_by: req.body.created_by || undefined, // UUID no banco
        category_id: req.body.category_id || undefined, // UUID no banco
        color: req.body.color || '#10B981', // Cor padrão
      };

      Logger.info('Dados processados para subcategoria:', { 
        original: req.body,
        processed: processedData 
      });

      // Validação básica
      if (!processedData.name || !processedData.company_id || !processedData.created_by) {
        Logger.warn('Dados obrigatórios faltando para subcategoria', { processedData });
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Dados obrigatórios faltando: name, company_id, created_by'
        });
      }
      
      // Remover campos undefined
      Object.keys(processedData).forEach(key => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      const subcategory = await storage.createSubcategory(processedData);

      Logger.success('Subcategoria criada com sucesso', {
        subcategoryId: subcategory.id,
        name: subcategory.name,
        categoryId: subcategory.category_id,
        userId
      });

      res.status(HTTP_STATUS.CREATED).json({
        data: subcategory,
        message: SUCCESS_MESSAGES.CREATE_SUCCESS('Subcategoria')
      });
    } catch (error: any) {
      Logger.error('Falha ao criar subcategoria', { userId, body: req.body, error });
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: ERROR_MESSAGES.SAVE_ERROR
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}