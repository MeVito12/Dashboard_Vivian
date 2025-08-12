// Mensagens padronizadas para o sistema
export const VALIDATION_MESSAGES = {
  // Campos obrigatórios
  REQUIRED: (field: string) => `${field} é obrigatório`,
  
  // Validações de tamanho
  MIN_LENGTH: (field: string, min: number) => `${field} deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
  
  // Validações de formato
  EMAIL_INVALID: 'Email deve ter um formato válido',
  UUID_INVALID: (field: string) => `${field} deve ser um UUID válido`,
  
  // Validações numéricas
  POSITIVE_NUMBER: (field: string) => `${field} deve ser um número positivo`,
  NON_NEGATIVE: (field: string) => `${field} não pode ser negativo`,
  MIN_VALUE: (field: string, min: number) => `${field} deve ser pelo menos ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} deve ser no máximo ${max}`,
  
  // Validações específicas
  PHONE_INVALID: 'Telefone deve ter um formato válido',
  CNPJ_INVALID: 'CNPJ deve ter um formato válido',
  CPF_INVALID: 'CPF deve ter um formato válido',
  
} as const;

export const ERROR_MESSAGES = {
  // Autenticação e autorização
  LOGIN_FAILED: 'Email ou senha incorretos',
  USER_NOT_FOUND: 'Usuário não encontrado no sistema',
  UNAUTHORIZED: 'Você não tem permissão para esta ação',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente',
  
  // Operações CRUD
  SAVE_ERROR: 'Erro ao salvar dados. Tente novamente',
  DELETE_ERROR: 'Erro ao excluir item. Tente novamente',
  UPDATE_ERROR: 'Erro ao atualizar dados. Tente novamente',
  LOAD_ERROR: 'Erro ao carregar dados. Recarregue a página',
  
  // Validação de dados
  INVALID_DATA: 'Dados inválidos fornecidos',
  MISSING_REQUIRED_FIELDS: 'Preencha todos os campos obrigatórios',
  DUPLICATE_ENTRY: 'Este item já existe no sistema',
  
  // Rede e servidor
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet',
  SERVER_ERROR: 'Erro interno do servidor. Tente novamente em alguns minutos',
  TIMEOUT_ERROR: 'Operação demorou muito para responder. Tente novamente',
  
  // Negócio específico
  INSUFFICIENT_STOCK: 'Estoque insuficiente para esta operação',
  INVALID_QUANTITY: 'Quantidade deve ser maior que zero',
  PAYMENT_FAILED: 'Falha no processamento do pagamento',
  
} as const;

export const SUCCESS_MESSAGES = {
  // Operações CRUD
  SAVE_SUCCESS: (item: string) => `${item} salvo com sucesso`,
  DELETE_SUCCESS: (item: string) => `${item} excluído com sucesso`,
  UPDATE_SUCCESS: (item: string) => `${item} atualizado com sucesso`,
  CREATE_SUCCESS: (item: string) => `${item} criado com sucesso`,
  
  // Operações específicas
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGOUT_SUCCESS: 'Logout realizado com sucesso',
  PAYMENT_SUCCESS: 'Pagamento processado com sucesso',
  TRANSFER_SUCCESS: 'Transferência realizada com sucesso',
  
  // Ações do sistema
  PERMISSIONS_UPDATED: 'Permissões atualizadas com sucesso',
  PASSWORD_CHANGED: 'Senha alterada com sucesso',
  EMAIL_SENT: 'Email enviado com sucesso',
  
} as const;

export const INFO_MESSAGES = {
  // Estados do sistema
  LOADING: 'Carregando dados...',
  PROCESSING: 'Processando...',
  SAVING: 'Salvando...',
  
  // Confirmações
  CONFIRM_DELETE: (item: string) => `Tem certeza que deseja excluir ${item}?`,
  CONFIRM_ACTION: (action: string) => `Tem certeza que deseja ${action}?`,
  
  // Instruções
  SELECT_ITEM: 'Selecione um item da lista',
  FILL_REQUIRED_FIELDS: 'Preencha os campos obrigatórios',
  
} as const;

// Tipos para garantir type safety
export type ValidationMessage = keyof typeof VALIDATION_MESSAGES;
export type ErrorMessage = keyof typeof ERROR_MESSAGES;
export type SuccessMessage = keyof typeof SUCCESS_MESSAGES;
export type InfoMessage = keyof typeof INFO_MESSAGES;