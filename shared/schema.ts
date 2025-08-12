import { z } from "zod";
import { VALIDATION_MESSAGES } from "./messages";

// ====================================
// HIERARQUIA EMPRESARIAL COMPLETA
// CEO → Empresa → Filial → Usuário
// ====================================

export interface Company {
  id: string; // UUID
  name: string;
  businessCategory: string;
  cnpj?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string; // UUID
  company_id: string; // UUID
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_main: boolean;
  is_active: boolean;
  manager_id?: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string; // UUID
  email: string;
  password?: string;
  name: string;
  phone?: string;
  company_id?: string; // UUID
  branch_id?: string; // UUID
  role: 'master' | 'user';
  business_category?: string;
  is_active: boolean;
  created_by?: string; // UUID
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string; // UUID
  userId: string; // UUID
  section: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  createdAt: string;
}

// ====================================
// ENTIDADES DE NEGÓCIO
// ====================================

export interface Category {
  id: string; // UUID
  name: string;
  description?: string;
  color: string;
  company_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface Subcategory {
  id: string; // UUID
  name: string;
  description?: string;
  category_id: string | null; // UUID da categoria
  color: string;
  company_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string; // UUID
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_uses?: number;
  current_uses: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  is_loyalty_reward: boolean;
  company_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string; // UUID
  name: string;
  description?: string;
  category_id: string; // UUID da categoria
  subcategory_id?: string; // UUID da subcategoria
  price: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  is_perishable: boolean;
  batch_number?: string;
  supplier?: string;
  status: string; // 'available', etc.
  requires_prescription: boolean;
  controlled_substance: boolean;
  storage_temperature?: string;
  for_sale: boolean;
  company_id: string; // UUID
  branch_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

// Para categoria alimenticia: produtos do cardápio que usam ingredientes do estoque
export interface MenuProduct {
  id: string; // UUID
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  ingredients: MenuIngredient[]; // Lista de ingredientes necessários
  isActive: boolean;
  companyId: string; // UUID
  branchId: string; // UUID
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface MenuIngredient {
  id: string; // UUID
  menuProductId: string; // UUID
  productId: string; // UUID - Referência ao produto do estoque (ingrediente)
  quantity: number; // Quantidade necessária do ingrediente
  unit: string; // Unidade de medida (kg, g, L, ml, unidades)
  createdAt: string;
}

export interface Sale {
  id: string; // UUID
  product_id: string; // UUID
  client_id?: string; // UUID
  quantity: number;
  unit_price: number;
  total_price: number;
  payment_method: string;
  sale_date: string;
  notes?: string;
  company_id: string; // UUID
  branch_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string; // UUID
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  client_type: 'individual' | 'company';
  company_id: string; // UUID
  branch_id: string; // UUID
  created_by: string; // UUID
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string; // UUID
  title: string;
  description?: string;
  clientId?: string; // UUID
  clientName?: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: string;
  notes?: string;
  companyId: string; // UUID
  branchId: string; // UUID
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntry {
  id: string; // UUID
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  paymentMethod?: string;
  status: 'paid' | 'pending' | 'overdue';
  dueDate?: string;
  paidDate?: string;
  referenceId?: string; // UUID
  referenceType?: string;
  clientId?: string; // UUID
  companyId: string; // UUID
  branchId: string; // UUID
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string; // UUID
  productId: string; // UUID
  fromBranchId: string; // UUID
  toBranchId: string; // UUID
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  transferDate: string;
  receivedDate?: string;
  notes?: string;
  companyId: string; // UUID
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

export interface MoneyTransfer {
  id: string; // UUID
  fromBranchId: string; // UUID
  toBranchId: string; // UUID
  amount: number;
  description: string;
  transferType: 'operational' | 'investment' | 'emergency' | 'reimbursement';
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  transferDate: string;
  completedDate?: string;
  approvedBy?: string; // UUID
  notes?: string;
  companyId: string; // UUID
  createdBy: string; // UUID
  createdAt: string;
  updatedAt: string;
}

// ====================================
// SCHEMAS DE VALIDAÇÃO ZOD
// ====================================

export const CompanySchema = z.object({
  name: z.string().min(2, VALIDATION_MESSAGES.MIN_LENGTH("Nome", 2)),
  businessCategory: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Categoria")),
  cnpj: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID).optional(),
});

export const BranchSchema = z.object({
  company_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("ID da empresa")),
  name: z.string().min(2, VALIDATION_MESSAGES.MIN_LENGTH("Nome", 2)),
  code: z.string().min(2, VALIDATION_MESSAGES.MIN_LENGTH("Código", 2)),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID).optional(),
  is_main: z.boolean().default(false),
});

export const UserSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.EMAIL_INVALID),
  password: z.string().min(6, VALIDATION_MESSAGES.MIN_LENGTH("Senha", 6)),
  name: z.string().min(2, VALIDATION_MESSAGES.MIN_LENGTH("Nome", 2)),
  phone: z.string().optional(),
  company_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  role: z.enum(['master', 'user']),
});

export const CategorySchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Nome da categoria")),
  description: z.string().optional(),
  color: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Cor")),
  company_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("ID da empresa")).optional(),
  created_by: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Usuário criador")).optional(),
});

export const SubcategorySchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Nome da subcategoria")),
  description: z.string().optional(),
  category_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Categoria")),
  color: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Cor")),
  company_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("ID da empresa")).optional(),
  created_by: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Usuário criador")).optional(),
});

export const CouponSchema = z.object({
  code: z.string().min(1, "Código do cupom é obrigatório").max(20, "Código deve ter no máximo 20 caracteres"),
  name: z.string().min(1, "Nome do cupom é obrigatório"),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed'], { required_error: "Tipo de desconto é obrigatório" }),
  discount_value: z.number().positive("Valor do desconto deve ser positivo"),
  campaign_type: z.enum(['category_discount', 'seasonal_promotion', 'client_reactivation', 'total_purchase'], { required_error: "Tipo de campanha é obrigatório" }),
  target_categories: z.array(z.string().uuid("ID da categoria deve ser um UUID válido")).optional(), // IDs das categorias elegíveis
  target_products: z.array(z.string().uuid("ID do produto deve ser um UUID válido")).optional(), // IDs dos produtos elegíveis
  min_purchase_amount: z.number().min(0, "Valor mínimo não pode ser negativo").default(0),
  max_uses: z.number().positive().optional(),
  max_uses_per_client: z.number().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().default(true),
  is_loyalty_reward: z.boolean().default(false),
  client_segment: z.enum(['all', 'new', 'inactive', 'vip']).default('all'),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

export const ProductSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED("Nome")),
  description: z.string().optional(),
  category_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Categoria")),
  subcategory_id: z.string().uuid().optional(),
  price: z.number().min(0, VALIDATION_MESSAGES.NON_NEGATIVE("Preço")),
  stock: z.number().min(0, VALIDATION_MESSAGES.NON_NEGATIVE("Estoque")),
  min_stock: z.number().min(0, VALIDATION_MESSAGES.NON_NEGATIVE("Estoque mínimo")),
  barcode: z.string().optional(),
  manufacturing_date: z.string().optional(),
  expiry_date: z.string().optional(),
  is_perishable: z.boolean().default(false),
  for_sale: z.boolean().default(false),
  company_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Empresa")),
  branch_id: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Filial")),
  created_by: z.string().uuid(VALIDATION_MESSAGES.UUID_INVALID("Usuário criador")),
});

export const SaleSchema = z.object({
  product_id: z.string().uuid("ID do produto deve ser um UUID válido"),
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido").optional(),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit_price: z.number().positive("Preço unitário deve ser positivo"),
  payment_method: z.string().min(1, "Método de pagamento é obrigatório"),
  notes: z.string().optional(),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  branch_id: z.string().uuid("ID da filial deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

// Schema para carrinho de compras (múltiplos itens)
export const CartItemSchema = z.object({
  product_id: z.string().uuid("ID do produto deve ser um UUID válido"),
  product_name: z.string().min(1, "Nome do produto é obrigatório"),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  unit_price: z.number().positive("Preço unitário deve ser positivo"),
  total_price: z.number().positive("Preço total deve ser positivo"),
  barcode: z.string().optional(),
  discount: z.number().min(0, "Desconto não pode ser negativo").default(0),
  coupon_id: z.string().uuid("ID do cupom deve ser um UUID válido").optional(),
  branch_id: z.string().uuid("ID da filial deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

// Schema para detalhes de parcelas
export const InstallmentDetailSchema = z.object({
  amount: z.number().positive("Valor da parcela deve ser positivo"),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  status: z.enum(['pending', 'paid']).default('pending'),
});

export const SaleCartSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Carrinho deve ter pelo menos um item"),
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido").optional(),
  client_name: z.string().optional(),
  subtotal: z.number().positive("Subtotal deve ser positivo"),
  discount: z.number().min(0, "Desconto não pode ser negativo").default(0),
  total_amount: z.number().positive("Total deve ser positivo"),
  payment_method: z.enum(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto']),
  installments: z.number().min(1, "Número de parcelas deve ser pelo menos 1").default(1),
  installmentDetails: z.array(InstallmentDetailSchema).optional(),
  notes: z.string().optional(),
  coupon_id: z.string().uuid("ID do cupom deve ser um UUID válido").optional(),
  coupon_discount: z.number().min(0, "Desconto do cupom não pode ser negativo").default(0),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  branch_id: z.string().uuid("ID da filial deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

export const ClientSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  client_type: z.enum(['individual', 'company']).default('individual'),
});

export const AppointmentSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido").optional(),
  client_name: z.string().optional(),
  appointment_date: z.string().min(1, "Data é obrigatória"),
  start_time: z.string().min(1, "Horário de início é obrigatório"),
  end_time: z.string().optional(),
  type: z.string().min(1, "Tipo é obrigatório"),
  notes: z.string().optional(),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  branch_id: z.string().uuid("ID da filial deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

export const FinancialEntrySchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  payment_method: z.string().optional(),
  status: z.enum(['paid', 'pending', 'overdue']).default('pending'),
  due_date: z.string().optional(),
  paid_date: z.string().optional(),
  reference_id: z.string().optional(),
  reference_type: z.string().optional(),
  client_id: z.string().uuid("ID do cliente deve ser um UUID válido").optional(),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  branch_id: z.string().uuid("ID da filial deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

export const TransferSchema = z.object({
  product_id: z.string().uuid("ID do produto deve ser um UUID válido"),
  from_branch_id: z.string().uuid("ID da filial de origem deve ser um UUID válido"),
  to_branch_id: z.string().uuid("ID da filial de destino deve ser um UUID válido"),
  quantity: z.number().positive("Quantidade deve ser positiva"),
  status: z.enum(['pending', 'in_transit', 'completed', 'cancelled']).default('pending'),
  transfer_date: z.string().min(1, "Data da transferência é obrigatória"),
  received_date: z.string().optional(),
  notes: z.string().optional(),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

export const MoneyTransferSchema = z.object({
  from_branch_id: z.string().uuid("ID da filial de origem deve ser um UUID válido"),
  to_branch_id: z.string().uuid("ID da filial de destino deve ser um UUID válido"),
  amount: z.number().positive("Valor deve ser positivo"),
  description: z.string().min(1, "Descrição é obrigatória"),
  transfer_type: z.enum(['operational', 'investment', 'emergency', 'reimbursement']),
  status: z.enum(['pending', 'approved', 'completed', 'rejected']).default('pending'),
  transfer_date: z.string().min(1, "Data da transferência é obrigatória"),
  completed_date: z.string().optional(),
  approved_by: z.string().uuid("ID do aprovador deve ser um UUID válido").optional(),
  notes: z.string().optional(),
  company_id: z.string().uuid("ID da empresa deve ser um UUID válido"),
  created_by: z.string().uuid("ID do criador deve ser um UUID válido"),
});

// ====================================
// TIPOS DERIVADOS
// ====================================

export type NewCompany = z.infer<typeof CompanySchema>;
export type NewBranch = z.infer<typeof BranchSchema>;
export type NewUser = z.infer<typeof UserSchema>;
export type NewCategory = z.infer<typeof CategorySchema>;
export type NewSubcategory = z.infer<typeof SubcategorySchema>;
export type NewProduct = z.infer<typeof ProductSchema>;
export type NewSale = z.infer<typeof SaleSchema>;
export type NewClient = z.infer<typeof ClientSchema>;
export type NewAppointment = z.infer<typeof AppointmentSchema>;
export type NewFinancialEntry = z.infer<typeof FinancialEntrySchema>;
export type NewTransfer = z.infer<typeof TransferSchema>;
export type NewMoneyTransfer = z.infer<typeof MoneyTransferSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type InstallmentDetail = z.infer<typeof InstallmentDetailSchema>;
export type SaleCart = z.infer<typeof SaleCartSchema>;

// ====================================
// CONSTANTES
// ====================================

export const BUSINESS_CATEGORIES = [
  'farmacia',
  'pet', 
  'medico',
  'alimenticio',
  'vendas',
  'design',
  'sites'
] as const;

export const USER_ROLES = ['master', 'user'] as const;
export const PAYMENT_METHODS = ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto'] as const;
export const APPOINTMENT_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
export const FINANCIAL_STATUSES = ['paid', 'pending', 'overdue'] as const;
export const TRANSFER_STATUSES = ['pending', 'in_transit', 'completed', 'cancelled'] as const;
export const MONEY_TRANSFER_STATUSES = ['pending', 'approved', 'completed', 'rejected'] as const;
export const MONEY_TRANSFER_TYPES = ['operational', 'investment', 'emergency', 'reimbursement'] as const;