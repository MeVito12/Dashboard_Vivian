import { useProducts, useSales, useClients, useCreateCartSale, useCoupons, useValidateCoupon, useApplyCoupon, useCreateClient } from "@/hooks/useData";
import { useBranches } from "@/hooks/useBranches";
import { capitalizeWords } from "@/lib/utils";
import Loading from '@/components/ui/loading';
import SectionLoader from '@/components/SectionLoader';
import { useLoading } from '@/hooks/useLoading';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SessionManager } from "@/utils/sessionManager";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Minus, ShoppingCart, Scan, Search, Trash2, CreditCard, DollarSign, User, Package, X, Eye, Edit, Printer } from "lucide-react";
import PrintOptions from "@/components/PrintOptions";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/contexts/AuthContext";
import type { Product, Client, CartItem, SaleCart } from "@shared/schema";

const VendasSection = () => {
  const { user } = useAuth();
  const notifications = useNotifications();
  const queryClient = useQueryClient();
  const { selectedBranch } = useBranches();

  // Estados principais
  const [activeTab, setActiveTab] = useState<'vendas' | 'caixa'>('vendas');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [installments, setInstallments] = useState<number>(1);
  const [installmentDetails, setInstallmentDetails] = useState<{
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid';
  }[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [selectedSellers, setSelectedSellers] = useState<string[]>([]); // Alterado para string[] para UUIDs
  
  // Estados de busca e modais
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [showProductSearch, setShowProductSearch] = useState<boolean>(false);
  const [showClientModal, setShowClientModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState<boolean>(false);
  const [showSellersModal, setShowSellersModal] = useState<boolean>(false);
  const [showAddClientModal, setShowAddClientModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  
  // Estados para cliente
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    clientType: 'individual' as 'individual' | 'company',
    document: '',
    notes: ''
  });
  
  // Estados para cupons
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [validatingCoupon, setValidatingCoupon] = useState<boolean>(false);
  
  // Estados para última venda e impressão
  const [lastSaleData, setLastSaleData] = useState<any>(null);
  const [includeClientInPrint, setIncludeClientInPrint] = useState<boolean>(false);

  // Buscar dados
  const { data: products = [], isLoading: productsLoading } = useProducts(selectedBranch?.id, selectedBranch?.company_id);
  const { data: clients = [], isLoading: isLoadingClients } = useClients(selectedBranch?.id, selectedBranch?.company_id);
  const clientsData = clients as Client[];
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: coupons = [] } = useCoupons(selectedBranch?.company_id);

  // Estado geral de loading
  const isLoadingData = productsLoading || isLoadingClients || salesLoading;
  const showLoading = useLoading(isLoadingData, { minLoadingTime: 600, delay: 200 });
  
  // Função auxiliar para encontrar um cliente pelo ID
  const findClientById = (clientId: string) => {
    return clientsData.find((client: Client) => client.id === clientId);
  };
  
  // Hooks de mutações
  const processSaleMutation = useCreateCartSale();
  const { mutateAsync: createClient } = useCreateClient();
  const validateCouponMutation = useValidateCoupon();
  const applyCouponMutation = useApplyCoupon();

  // Estados adicionais para caixa
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [printSaleData, setPrintSaleData] = useState<any>(null);

  // Debug para modais
  console.log('Modal states:', { showClientModal, showPaymentModal, showSellersModal });

  // Função para processar pagamento
  const handleProcessPayment = async (saleId: number) => {
    setProcessingPayment(saleId);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      notifications.success(
        "Pagamento Processado",
        `Venda #${saleId} foi processada com sucesso!`
      );
      
      // Aqui você removeria a venda da lista de pendentes
      console.log(`Pagamento processado para venda #${saleId}`);
    } catch (error) {
      notifications.error(
        "Erro no Pagamento",
        "Não foi possível processar o pagamento. Tente novamente."
      );
    } finally {
      setProcessingPayment(null);
    }
  };

  // Função para abrir modal de impressão
  const handlePrintReceipt = (sale: any) => {
    setPrintSaleData(sale);
  };

  // Função para ver detalhes
  const handleViewDetails = (sale: any) => {
    notifications.info(
      `Detalhes da Venda #${sale.id}`,
      `Cliente: ${sale.client_name}\nTotal: R$ ${sale.total_amount.toFixed(2)}\nPagamento: ${getPaymentMethodLabel(sale.payment_method)}`
    );
  };

  // Função para calcular parcelas
  const calculateInstallments = (totalAmount: number, numInstallments: number) => {
    const installmentAmount = totalAmount / numInstallments;
    const installments = [];
    
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1); // Primeira parcela no próximo mês
      
      installments.push({
        amount: installmentAmount,
        dueDate: dueDate.toISOString().split('T')[0], // Format YYYY-MM-DD
        status: 'pending' as const
      });
    }
    
    return installments;
  };

  // Função para obter label do método de pagamento
  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      dinheiro: "💵 Dinheiro",
      pix: "📱 PIX", 
      cartao_credito: "💳 Cartão de Crédito",
      cartao_debito: "💳 Cartão de Débito",
      boleto: "📄 Boleto"
    };
    return methods[method as keyof typeof methods] || method;
  };

  // Filtrar produtos por busca
  const filteredProducts = products.filter((product: Product) => {
    if (barcodeInput && product.barcode?.includes(barcodeInput)) {
      return true;
    }
    
    if (!searchTerm.trim()) {
      return false;
    }
    
    const searchWords = searchTerm.toLowerCase().trim().split(/\s+/);
    const productName = product.name.toLowerCase();
    const productDescription = (product.description || '').toLowerCase();
    const productText = `${productName} ${productDescription}`;
    
    return searchWords.some(word => 
      productText.includes(word) || 
      productText.split(/\s+/).some(productWord => 
        productWord.startsWith(word) && word.length >= 2
      )
    );
  });

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    // Garante que o ID do produto seja uma string (UUID)
    const productId = product.id;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1, totalPrice: item.unitPrice * (item.quantity + 1) }
            : item
        );
      }
      return [...prev, {
        productId,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        barcode: product.barcode || ''
      }];
    });
    setSearchTerm("");
    setBarcodeInput("");
    setShowProductSearch(false);
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Atualizar quantidade no carrinho
  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
        : item
    ));
  };

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDiscount = discount + couponDiscount;
  const totalAmount = subtotal - totalDiscount;

  // Processar venda
  const handleProcessSale = async () => {
    if (cart.length === 0) {
      notifications.warning(
        "Carrinho vazio",
        "Adicione produtos ao carrinho antes de processar a venda"
      );
      return;
    }

    if (!paymentMethod) {
      notifications.validationError("Selecione um método de pagamento");
      return;
    }

    if (selectedSellers.length === 0) {
      notifications.validationError("Selecione pelo menos um vendedor");
      return;
    }

    try {
      const user = SessionManager.getSession();
      if (!user || !user.user?.id || !selectedBranch) {
        notifications.error("Erro de autenticação", "Usuário não autenticado ou filial não selecionada");
        return;
      }

      const saleData: SaleCart = {
        clientId: selectedClient || undefined,
        clientName: selectedClient ? findClientById(selectedClient)?.name : undefined,
        items: cart,
        subtotal: totalAmount,
        paymentMethod: paymentMethod as "pix" | "cartao_credito" | "dinheiro" | "cartao_debito" | "boleto",
        installments,
        installmentDetails: installmentDetails.length > 0 ? installmentDetails : undefined,
        discount: totalDiscount,
        totalAmount: totalAmount,
        couponDiscount: couponDiscount,
        couponId: appliedCoupon?.id || undefined,
        companyId: selectedBranch.company_id,
        branchId: selectedBranch.id,
        createdBy: user.user.id,
        notes: "" // Campo opcional, mas incluído para completude
      };

      await processSaleMutation.mutateAsync(saleData);

      // Limpar formulário
      setCart([]);
      setSelectedClient(null);
      setPaymentMethod("");
      setInstallments(1);
      setInstallmentDetails([]);
      setDiscount(0);
      setSelectedSellers([]);
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponDiscount(0);
      
      // Mostrar modal de impressão
      setLastSaleData(saleData);
      setShowPrintModal(true);

      notifications.success(
        "Venda processada!",
        "A venda foi enviada para o caixa com sucesso"
      );
    } catch (error) {
      notifications.error(
        "Erro ao processar venda",
        "Ocorreu um erro inesperado"
      );
    }
  };

  // Reset do formulário de cliente
  const resetClientForm = () => {
    setClientForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      clientType: 'individual',
      document: '',
      notes: ''
    });
  };

  // Submissão do formulário de cliente
  const handleClientSubmit = async () => {
    if (!clientForm.name.trim()) {
      notifications.validationError("O nome do cliente é obrigatório");
      return;
    }

    try {
      await createClient(clientForm);
      
      notifications.saveSuccess("Cliente");
      
      setShowAddClientModal(false);
      resetClientForm();
    } catch (error) {
      notifications.error(
        "Erro ao cadastrar cliente",
        "Ocorreu um erro inesperado"
      );
    }
  };

  // Por enquanto, usar array vazio até implementar vendas pendentes no schema
  const pendingSales: any[] = [];

  // Buscar usuários reais da empresa para vendedores
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchCompanyUsers = async () => {
      if (!user?.company_id || isNaN(Number(user.company_id))) return;
      
      try {
        const response = await fetch(`/api/users?company_id=${user.company_id}`);
        if (response.ok) {
          const users = await response.json();
          setCompanyUsers(users);
        }
      } catch (error) {
        console.error('Erro ao buscar usuários da empresa:', error);
      }
    };
    
    fetchCompanyUsers();
  }, [user?.company_id]);

  // Renderizar aba de vendas com design original
  const renderVendasTab = () => (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna da Esquerda */}
        <div className="space-y-6">
          {/* Card Adicionar Produtos */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Adicionar Produtos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Código de Barras (Bip) */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Código de Barras (Bip)
                </Label>
                <Input
                  placeholder="Digite ou escaneie o código de barras..."
                  value={barcodeInput}
                  onChange={(e) => {
                    setBarcodeInput(e.target.value);
                    setShowProductSearch(e.target.value.length > 0);
                  }}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite o código e pressione Enter, ou use um leitor de código de barras
                </p>
              </div>

              {/* Busca Manual */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Busca Manual
                </Label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar Produtos"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowProductSearch(e.target.value.length > 0);
                    }}
                    className="w-full pr-10"
                  />
                </div>
              </div>

              {/* Lista de produtos filtrados */}
              {showProductSearch && (
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.slice(0, 10).map((product: Product) => (
                      <div
                        key={product.id}
                        className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-800">{product.name}</p>
                            <p className="text-sm text-gray-600">{product.description}</p>
                            <p className="text-sm font-semibold text-green-600">R$ {product.price.toFixed(2)}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Nenhum produto encontrado</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carrinho de Compras */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Carrinho de Compras</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Carrinho vazio</p>
                  <p className="text-sm">Adicione produtos usando o código de barras ou busca manual</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-sm text-gray-600">
                          R$ {item.unitPrice.toFixed(2)} cada
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <p className="font-semibold text-gray-800">
                          R$ {item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita - Finalizar Venda */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Finalizar Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vendedores */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Vendedores *
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-500 hover:bg-[hsl(158,89%,53%)] hover:text-white hover:border-[hsl(158,89%,53%)]"
                  onClick={() => {
                    console.log('Vendedores button clicked');
                    setShowSellersModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedSellers.length > 0
                    ? `${selectedSellers.length} vendedor${selectedSellers.length > 1 ? 'es' : ''} selecionado${selectedSellers.length > 1 ? 's' : ''}`
                    : "Selecionar Vendedores"
                  }
                </Button>
              </div>

              {/* Cliente */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Cliente (Opcional)
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-500 hover:bg-[hsl(158,89%,53%)] hover:text-white hover:border-[hsl(158,89%,53%)]"
                  onClick={() => {
                    console.log('Clientes button clicked');
                    setShowClientModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedClient 
                    ? clients.find(c => c.id === selectedClient.toString())?.name || "Cliente selecionado"
                    : "Selecionar Cliente"
                  }
                </Button>
              </div>

              {/* Método de Pagamento */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Método de Pagamento *
                </Label>
                <Button
                  variant="outline"
                  className="w-full justify-start text-gray-500 hover:bg-[hsl(158,89%,53%)] hover:text-white hover:border-[hsl(158,89%,53%)]"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {paymentMethod 
                    ? `${getPaymentMethodLabel(paymentMethod)}${installments > 1 ? ` (${installments}x)` : ''}`
                    : "Selecionar Método"
                  }
                </Button>
              </div>

              {/* Cupom de Desconto */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Cupom de Desconto
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="CÓDIGO DO CUPOM"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 uppercase"
                  />
                  <Button 
                    variant="outline"
                    onClick={() => {/* Lógica do cupom */}}
                    disabled={!couponCode.trim() || validatingCoupon}
                    className="px-6 hover:bg-[hsl(158,89%,53%)] hover:text-white hover:border-[hsl(158,89%,53%)]"
                  >
                    {validatingCoupon ? "..." : "Aplicar"}
                  </Button>
                </div>
              </div>
              
              {/* Desconto Manual */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Desconto Manual (%)
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              {/* Totais */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex justify-between text-lg">
                  <span>Subtotal:</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                  <span>R$ {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Botão Finalizar */}
              <Button 
                className="w-full py-3 text-lg bg-[hsl(262,83%,58%)] hover:bg-[hsl(262,83%,53%)] text-white"
                onClick={handleProcessSale}
                disabled={cart.length === 0 || processSaleMutation.isPending}
              >
                {processSaleMutation.isPending ? (
                  "Processando..."
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Enviar para Caixa - R$ {totalAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderCaixaTab = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Caixa - Vendas Pendentes</h3>
              <p className="text-sm text-gray-600">Vendas aguardando pagamento</p>
            </div>
          </div>
        </div>

        {/* Lista de Vendas Pendentes */}
        <div className="standard-list-container">
          {pendingSales.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold mb-2">Nenhuma venda pendente</p>
              <p>Todas as vendas foram processadas</p>
            </div>
          ) : (
            <div className="standard-list-content">
              {pendingSales.map((sale) => (
                <div key={sale.id} className="standard-list-item group">
                  <div className="list-item-main">
                    <div className="list-item-title">
                      Venda #{sale.id} • {(sale as any).client_name}
                    </div>
                    <div className="list-item-subtitle">
                      {getPaymentMethodLabel(sale.payment_method)} • Vendedor(es): {(sale as any).sellers?.join(", ") || "N/A"}
                    </div>
                    <div className="list-item-meta">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Total: R$ {((sale as any).total_amount || sale.total_price || 0).toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1 ml-4">
                        <span>{sale.created_at}</span>
                      </span>
                    </div>
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-600 mb-2">Itens:</p>
                      <div className="space-y-1">
                        {((sale as any).items || []).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span>R$ {(item.quantity * item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="list-status-badge status-warning">
                      Pendente
                    </span>
                    
                    <div className="list-item-actions">
                      <button 
                        onClick={() => handleProcessPayment(sale.id)}
                        className="list-action-button view"
                        title="Processar Pagamento"
                        disabled={processingPayment === sale.id}
                      >
                        {processingPayment === sale.id ? (
                          <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          <CreditCard className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => handleViewDetails(sale)}
                        className="list-action-button edit"
                        title="Ver Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handlePrintReceipt(sale)}
                        className="list-action-button transfer"
                        title="Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Impressão Padrão do Sistema */}
      {printSaleData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col ml-48">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Imprimir Comprovante - Venda #{printSaleData.id}
              </h3>
              <button 
                onClick={() => setPrintSaleData(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <PrintOptions
                sale={{
                  id: printSaleData.id,
                  total: printSaleData.total_amount,
                  paymentMethod: printSaleData.payment_method,
                  saleDate: printSaleData.created_at,
                  products: printSaleData.items ? printSaleData.items.map((item: any) => ({
                    name: item.product_name,
                    quantity: item.quantity,
                    price: item.unit_price,
                    total: item.quantity * item.unit_price
                  })) : [],
                  client: printSaleData.client_name ? {
                    name: printSaleData.client_name,
                    phone: ""
                  } : undefined
                }}
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
                includeClient={!!printSaleData.client_name}
              />
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setPrintSaleData(null)}
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

  // Se está carregando, mostrar tela de loading
  if (showLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionLoader text="Carregando produtos..." height="h-96" />
            </div>
            <div>
              <SectionLoader text="Carregando carrinho..." height="h-96" />
            </div>
          </div>
          <SectionLoader text="Carregando vendas..." height="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Navegação de Abas */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('vendas')}
          className={`tab-button ${activeTab === 'vendas' ? 'active' : ''}`}
        >
          <ShoppingCart className="w-4 h-4" />
          Nova Venda
        </button>
        <button
          onClick={() => setActiveTab('caixa')}
          className={`tab-button ${activeTab === 'caixa' ? 'active' : ''}`}
        >
          <CreditCard className="w-4 h-4" />
          Caixa
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'vendas' ? renderVendasTab() : renderCaixaTab()}

      {/* Modal de Seleção de Cliente */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Cliente</h3>
              <button 
                onClick={() => {
                  setShowClientModal(false);
                  setClientSearchTerm("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Opção venda sem cliente */}
            <div className="mb-4">
              <div 
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedClient(null);
                  setShowClientModal(false);
                }}
              >
                <p className="font-medium text-gray-800">Venda sem cliente</p>
                <p className="text-sm text-gray-600">Continuar sem identificar cliente</p>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {/* Busca de cliente */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar cliente por nome..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Lista de clientes */}
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {clients
                .filter(client => 
                  client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
                )
                .map(client => (
                  <div
                    key={client.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedClient(client.id); // Já é uma string (UUID)
                      setShowClientModal(false);
                      setClientSearchTerm("");
                    }}
                  >
                    <p className="font-medium text-gray-800">{capitalizeWords(client.name)}</p>
                    {client.email && <p className="text-sm text-gray-600">{client.email}</p>}
                    {client.phone && <p className="text-sm text-gray-600">{client.phone}</p>}
                  </div>
                ))}
            </div>
            
            {/* Botão para adicionar novo cliente */}
            <Button 
              className="w-full"
              onClick={() => {
                setShowClientModal(false);
                setShowAddClientModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Novo Cliente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Método de Pagamento */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Método de Pagamento</h3>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { value: 'dinheiro', label: '💵 Dinheiro' },
                { value: 'pix', label: '📱 PIX' },
                { value: 'cartao_credito', label: '💳 Cartão de Crédito' },
                { value: 'cartao_debito', label: '💳 Cartão de Débito' },
                { value: 'boleto', label: '📄 Boleto' }
              ].map((method) => (
                <button
                  key={method.value}
                  className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors text-gray-800"
                  onClick={() => {
                    setPaymentMethod(method.value);
                    setShowPaymentModal(false);
                    
                    // Se for cartão de crédito ou boleto, abrir modal de parcelas
                    if (method.value === 'cartao_credito' || method.value === 'boleto') {
                      setShowInstallmentsModal(true);
                    } else {
                      // Para outros métodos, definir como à vista
                      setInstallments(1);
                      setInstallmentDetails([]);
                    }
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Parcelas */}
      {showInstallmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg relative z-[100000]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Configurar Parcelas</h3>
              <button 
                onClick={() => setShowInstallmentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select 
                  value={installments.toString()} 
                  onValueChange={(value) => {
                    const numInstallments = parseInt(value);
                    setInstallments(numInstallments);
                    
                    // Calcular parcelas automaticamente
                    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) - discount;
                    const calculatedInstallments = calculateInstallments(totalAmount, numInstallments);
                    setInstallmentDetails(calculatedInstallments);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o número de parcelas" />
                  </SelectTrigger>
                  <SelectContent className="!z-[100001] max-h-48" side="top" align="center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 1 ? 'À vista' : `${num}x`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {installmentDetails.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Detalhes das Parcelas:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {installmentDetails.map((installment, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          Parcela {index + 1}/{installmentDetails.length}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">R$ {installment.amount.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">
                            Venc: {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowInstallmentsModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowInstallmentsModal(false)}
                  className="flex-1 bg-[hsl(158,89%,53%)] hover:bg-[hsl(158,89%,48%)]"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vendedores */}
      {showSellersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Vendedores</h3>
              <button 
                onClick={() => setShowSellersModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {companyUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum usuário encontrado na empresa</p>
                </div>
              ) : (
                companyUsers.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSellers.includes(profile.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSellers(prev => [...prev, profile.id]);
                        } else {
                          setSelectedSellers(prev => prev.filter(id => id !== profile.id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{capitalizeWords(profile.name)}</p>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowSellersModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={() => setShowSellersModal(false)}
                disabled={selectedSellers.length === 0}
              >
                Confirmar ({selectedSellers.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Cliente */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Cadastrar Cliente</h3>
              <button 
                onClick={() => {
                  setShowAddClientModal(false);
                  resetClientForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-name">Nome *</Label>
                <Input
                  id="client-name"
                  value={clientForm.name}
                  onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
              
              <div>
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div>
                <Label htmlFor="client-phone">Telefone</Label>
                <Input
                  id="client-phone"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <Label htmlFor="client-document">Documento</Label>
                <Input
                  id="client-document"
                  value={clientForm.document}
                  onChange={(e) => setClientForm(prev => ({ ...prev, document: e.target.value }))}
                  placeholder="CPF/CNPJ"
                />
              </div>
              
              <div>
                <Label htmlFor="client-address">Endereço</Label>
                <Textarea
                  id="client-address"
                  value={clientForm.address}
                  onChange={(e) => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowAddClientModal(false);
                  resetClientForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleClientSubmit}
                disabled={!clientForm.name.trim()}
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasSection;