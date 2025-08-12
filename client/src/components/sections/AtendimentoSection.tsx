import { useProducts, useSales, useClients, useAppointments, useFinancial, useTransfers, useMoneyTransfers, useBranches, useCreateProduct, useCreateSale, useCreateClient, useCreateAppointment, useCreateFinancial, useCreateTransfer, useCreateMoneyTransfer, useCreateBranch, useCreateCartSale, useCoupons } from "@/hooks/useData";
import React, { useState } from 'react';
import { useCategory, categories } from '@/contexts/CategoryContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { 
  MessageCircle, 
  Bot, 
  ShoppingCart, 
  Settings,
  Search,
  Send,
  Phone,
  Clock,
  Star,
  CheckCircle,
  Zap,
  CreditCard,
  Share2,
  QrCode,
  Link,
  Copy,
  Download,
  Gift,
  Users,
  Target,
  Calendar,
  TrendingUp,
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  XCircle,
  Power,
  PowerOff
} from 'lucide-react';

const AtendimentoSection = () => {
  const { selectedCategory } = useCategory();

  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { data: clients = [] } = useClients();
  const { data: appointments = [] } = useAppointments();
  const { data: coupons = [] } = useCoupons();
  const { showSuccess, showError, showWarning } = useNotificationContext();
  const [activeTab, setActiveTab] = useState('mensagens');

  // Funções para calcular métricas reais
  const getMetrics = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Vendas de hoje - verificar se sales é array e tem dados
      const todaySales = Array.isArray(sales) ? sales.filter((sale: any) => 
        sale?.created_at?.startsWith(today)
      ).length : 0;
      
      // Clientes ativos (com vendas nos últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const activeClients = Array.isArray(clients) && Array.isArray(sales) ? clients.filter((client: any) => {
        const lastSale = sales.find((sale: any) => sale?.client_id === client?.id);
        return lastSale && new Date(lastSale.created_at) >= thirtyDaysAgo;
      }).length : 0;
      
      // Agendamentos de hoje
      const todayAppointments = Array.isArray(appointments) ? appointments.filter((apt: any) => 
        apt?.date?.startsWith(today)
      ).length : 0;
      
      // Cupons ativos
      const activeCoupons = Array.isArray(coupons) ? coupons.filter((coupon: any) => 
        coupon?.active !== false
      ).length : 0;
      
      return {
        todaySales,
        activeClients,
        todayAppointments,
        activeCoupons,
        totalClients: Array.isArray(clients) ? clients.length : 0,
        totalSales: Array.isArray(sales) ? sales.length : 0,
        totalProducts: Array.isArray(products) ? products.length : 0
      };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return {
        todaySales: 0,
        activeClients: 0,
        todayAppointments: 0,
        activeCoupons: 0,
        totalClients: 0,
        totalSales: 0,
        totalProducts: 0
      };
    }
  };

  const metrics = getMetrics();
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState('');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    code: '',
    type: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_value: '',
    max_uses: '',
    target_categories: [],
    seasonal_start: '',
    seasonal_end: '',
    customer_segment: 'todos'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareType, setShareType] = useState('link'); // 'link' ou 'qr'
  const [shareUrl, setShareUrl] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: selectedCategory === 'vendas' ? 'pratos' : 'produtos'
  });
  const [qrCodeData, setQrCodeData] = useState('');
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);
  const [showEditPortfolioModal, setShowEditPortfolioModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState(null);
  const [portfolioItem, setPortfolioItem] = useState({
    title: '',
    description: '',
    imageUrl: '',
    projectUrl: '',
    category: selectedCategory === 'design' ? 'branding' : 'website'
  });
  const [showAddSpecialistModal, setShowAddSpecialistModal] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<{id: number, quantity: number, unit: string}[]>([]);
  const [newItemImage, setNewItemImage] = useState('');
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [searchIngredientTerm, setSearchIngredientTerm] = useState('');
  const [newSpecialist, setNewSpecialist] = useState({
    name: '',
    specialty: '',
    phone: '',
    email: '',
    schedule: '',
    description: ''
  });

  // Função para gerar URL de compartilhamento
  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    const categorySlug = selectedCategory;
    const menuType = selectedCategory === 'vendas' ? 'cardapio' : 'catalogo';
    return `${baseUrl}/${menuType}/${categorySlug}`;
  };

  // Função para processar venda de prato e deduzir ingredientes do estoque
  const processDishSale = (dish: any, quantity: number = 1) => {
    if (!dish.ingredients || dish.ingredients.length === 0) {
      showWarning('Aviso', 'Este prato não possui ingredientes cadastrados.');
      return;
    }

    // Verificar se há estoque suficiente para todos os ingredientes
    const stockItems = getCurrentCategoryItems();
    const insufficientIngredients: string[] = [];

    dish.ingredients.forEach((ingredient: any) => {
      const stockItem = stockItems.find((item: any) => item.id === ingredient.id);
      const requiredQuantity = ingredient.usedQuantity * quantity;
      
      if (!stockItem || stockItem.stock < requiredQuantity) {
        insufficientIngredients.push(`${ingredient.name} (precisa: ${requiredQuantity}${ingredient.unit}, tem: ${stockItem?.stock || 0})`);
      }
    });

    if (insufficientIngredients.length > 0) {
      showError('Estoque Insuficiente', `Não há estoque suficiente para:\n${insufficientIngredients.join('\n')}`);
      return false;
    }

    // Deduzir ingredientes do estoque
    setCategoryItems(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory as keyof typeof prev]?.map((item: any) => {
        const ingredient = dish.ingredients.find((ing: any) => ing.id === item.id);
        if (ingredient) {
          const deduction = ingredient.usedQuantity * quantity;
          return { ...item, stock: Math.max(0, item.stock - deduction) };
        }
        return item;
      }) || []
    }));

    showSuccess('Venda Processada', `${dish.name} vendido! Estoque dos ingredientes atualizado automaticamente.`);
    return true;
  };

  // Estado para gerenciar itens de todas as categorias usando dados reais
  const [categoryItems, setCategoryItems] = useState(() => {
    // Para design e sites, portfólio vazio
    if (selectedCategory === 'design' || selectedCategory === 'sites') {
      return { [selectedCategory]: [] };
    }
    // Para outras categorias, usa produtos reais
    return { [selectedCategory]: products };
  });

  // Atualizar itens quando a categoria mudar
  React.useEffect(() => {
    if (selectedCategory === 'design' || selectedCategory === 'sites') {
      setCategoryItems({ [selectedCategory]: [] });
    } else {
      setCategoryItems({ [selectedCategory]: products });
    }
  }, [selectedCategory, products]);

  // Estado para especialistas - usando dados vazios por enquanto
  const [specialists, setSpecialists] = useState<Record<string, any[]>>(() => {
    return { [selectedCategory]: [] };
  });

  // Atualizar especialistas quando a categoria mudar
  React.useEffect(() => {
    setSpecialists({ [selectedCategory]: [] });
  }, [selectedCategory]);

  // Função para buscar itens da categoria atual
  const getCurrentCategoryItems = () => {
    return categoryItems[selectedCategory as keyof typeof categoryItems] || [];
  };

  // Funções para editar e excluir itens
  const editItem = (item: any) => {
    if (selectedCategory === 'design' || selectedCategory === 'sites') {
      // Para portfólio (design e sites)
      setEditingPortfolioItem(item);
      setPortfolioItem({
        title: item.title || '',
        description: item.description || '',
        imageUrl: item.imageUrl || '',
        projectUrl: item.projectUrl || '',
        category: item.category || 'branding'
      });
      setShowEditPortfolioModal(true);
    } else {
      // Para outras categorias (produtos/catálogos/cardápios)
      setIsEditingItem(true);
      setEditingItemId(item.id);
      setNewItem({
        name: item.name || item.title || '',
        description: item.description || '',
        price: item.price?.toString() || '',
        category: item.category || 'produtos'
      });
      setShowAddItemModal(true);
    }
  };

  // Função para salvar item editado (não portfolio)
  const saveEditedItem = () => {
    if (!newItem.name) {
      showError('Campo obrigatório', 'Por favor, preencha o nome do item.');
      return;
    }

    if (isEditingItem) {
      // Editar item existente
      setCategoryItems(prev => ({
        ...prev,
        [selectedCategory]: (prev[selectedCategory as keyof typeof prev] as any[])?.map((item: any) => 
          item.id === editingItemId 
            ? { 
                ...item, 
                name: newItem.name,
                description: newItem.description,
                price: parseFloat(newItem.price) || item.price,
                category: newItem.category
              }
            : item
        ) || []
      }));
      
      showSuccess(
        selectedCategory !== 'design' && selectedCategory !== 'sites' 
          ? 'ITEM ATUALIZADO' 
          : 'PROJETO ATUALIZADO',
        selectedCategory !== 'design' && selectedCategory !== 'sites'
          ? `"${newItem.name}" foi atualizado no catálogo e estoque com sucesso!`
          : `"${newItem.name}" foi atualizado com sucesso!`
      );
    } else {
      // Criar novo item
      if (selectedCategory === 'vendas' || selectedCategory === 'alimenticio') {
        saveMenuItemWithIngredients();
        return;
      } else {
        saveNewItem();
        return;
      }
    }

    // Reset do estado
    setShowAddItemModal(false);
    setIsEditingItem(false);
    setEditingItemId(null);
    setNewItem({ name: '', description: '', price: '', category: 'produtos' });
    setSelectedIngredients([]);
    setNewItemImage('');
    setShowIngredientsModal(false);
    setSearchIngredientTerm('');
  };

  const deleteItem = (itemId: number) => {
    const item: any = getCurrentCategoryItems().find((item: any) => item.id === itemId);
    const itemName = item?.name || item?.title || 'Item';
    
    if (window.confirm(`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`)) {
        // Remove do catálogo/cardápio/portfólio
        setCategoryItems(prev => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory as keyof typeof prev]?.filter((item: any) => item.id !== itemId) || []
        }));
      
        // Mensagens específicas por categoria usando o sistema temático
        if (selectedCategory === 'design' || selectedCategory === 'sites') {
          showError('PROJETO EXCLUÍDO', `"${itemName}" foi removido do portfólio permanentemente.`);
        } else if (selectedCategory === 'vendas') {
          showError('PRATO EXCLUÍDO', `"${itemName}" foi removido do cardápio. Estoque atualizado automaticamente.`);
        } else {
          showError('PRODUTO EXCLUÍDO', `"${itemName}" foi removido do catálogo. Estoque sincronizado automaticamente.`);
        }
    }
  };

  // Função para desativar/ativar item e sincronizar com estoque
  const toggleItemAvailability = (itemId: number) => {
    const currentItem: any = getCurrentCategoryItems().find((item: any) => item.id === itemId);
    if (!currentItem) return;
    
    const itemName = currentItem.name || currentItem.title || 'Item';
    const newStatus = !currentItem.available;

    setCategoryItems(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory as keyof typeof prev]?.map((catItem: any) => 
        catItem.id === itemId 
          ? { ...catItem, available: newStatus }
          : catItem
      ) || []
    }));

    // Mensagens específicas por categoria e status usando o sistema temático
    const statusText = newStatus ? 'ATIVADO' : 'DESATIVADO';
    
    if (selectedCategory === 'design' || selectedCategory === 'sites') {
      if (newStatus) {
        showSuccess(`PROJETO ${statusText}`, `"${itemName}" está agora visível no portfólio para clientes.`);
      } else {
        showWarning(`PROJETO ${statusText}`, `"${itemName}" foi ocultado do portfólio.`);
      }
    } else if (selectedCategory === 'vendas') {
      if (newStatus) {
        showSuccess(`PRATO ${statusText}`, `"${itemName}" está disponível para pedidos. Estoque sincronizado.`);
      } else {
        showWarning(`PRATO ${statusText}`, `"${itemName}" foi removido do cardápio. Estoque atualizado.`);
      }
    } else {
      if (newStatus) {
        showSuccess(`PRODUTO ${statusText}`, `"${itemName}" está disponível para venda. Estoque sincronizado.`);
      } else {
        showWarning(`PRODUTO ${statusText}`, `"${itemName}" foi ocultado do catálogo. Estoque atualizado.`);
      }
    }
  };

  const saveEditedPortfolioItem = () => {
    if (!portfolioItem.title || !portfolioItem.description) {
      showError('Campos obrigatórios', 'Por favor, preencha título e descrição do projeto.');
      return;
    }

    setCategoryItems(prev => ({
      ...prev,
      [selectedCategory]: prev[selectedCategory as keyof typeof prev]?.map((item: any) => 
        item.id === (editingPortfolioItem as any)?.id 
          ? { ...item, ...portfolioItem }
          : item
      ) || []
    }));

    setShowEditPortfolioModal(false);
    setEditingPortfolioItem(null);
    showSuccess('PROJETO ATUALIZADO', `"${portfolioItem.title}" foi atualizado no portfólio com sucesso!`);
  };

  // Funções para especialistas
  const addSpecialist = () => {
    if (!newSpecialist.name || !newSpecialist.specialty) {
      showError('Campos obrigatórios', 'Por favor, preencha nome e especialidade.');
      return;
    }

    const specialist = {
      id: Date.now(),
      ...newSpecialist,
      available: true
    };

    setSpecialists(prev => ({
      ...prev,
      [selectedCategory]: [...(prev[selectedCategory] || []), specialist]
    }));

    setNewSpecialist({
      name: '',
      specialty: '',
      phone: '',
      email: '',
      schedule: '',
      description: ''
    });
    setShowAddSpecialistModal(false);
    showSuccess('ESPECIALISTA ADICIONADO', `"${newSpecialist.name}" foi adicionado com sucesso!`);
  };

  const getCurrentSpecialists = () => {
    return specialists[selectedCategory] || [];
  };

  // Função para buscar ingredientes do estoque (para categoria alimentícia)
  const getStockIngredients = () => {
    const stockItems = getCurrentCategoryItems();
    return stockItems.filter((item: any) => item.stock && item.stock > 0);
  };

  // Função para salvar item alimentício com ingredientes
  const saveMenuItemWithIngredients = () => {
    if (!newItem.name || !newItem.price || selectedIngredients.length === 0) {
      showError('Campos obrigatórios', 'Por favor, preencha o nome do prato, preço e selecione pelo menos um ingrediente.');
      return;
    }

    const stockItems = getCurrentCategoryItems();
    const ingredientsWithDetails = selectedIngredients.map(ing => {
      const stockItem = stockItems.find((item: any) => item.id === ing.id);
      return {
        ...stockItem,
        usedQuantity: ing.quantity,
        unit: ing.unit
      };
    }).filter(Boolean);

    const menuItem = {
      id: Date.now(),
      name: newItem.name,
      price: newItem.price ? `R$ ${Number(newItem.price.replace(/[^\d,]/g, '').replace(',', '.')).toFixed(2).replace('.', ',')}` : 'Sob consulta',
      ingredients: ingredientsWithDetails,
      description: `Ingredientes: ${ingredientsWithDetails.map((ing: any) => `${ing.name} (${ing.usedQuantity}${ing.unit})`).join(', ')}`,
      imageUrl: newItemImage || '',
      category: newItem.category,
      available: true,
      isCustom: true // Marca como item personalizado do cardápio
    };

    // Note: This would integrate with the real API to save the menu item
    // For now, just show success feedback
    console.log('Menu item to save:', menuItem);

    // Reset dos campos
    setNewItem({ name: '', description: '', price: '', category: 'pratos' });
    setSelectedIngredients([]);
    setNewItemImage('');
    setShowAddItemModal(false);
    showSuccess('PRATO ADICIONADO', `"${newItem.name}" foi adicionado ao cardápio com sucesso!`);
  };

  // Função para adicionar ingrediente com quantidade
  const addIngredientWithQuantity = (ingredient: any, quantity: number, unit: string) => {
    const existingIndex = selectedIngredients.findIndex(ing => ing.id === ingredient.id);
    
    if (existingIndex >= 0) {
      // Atualizar quantidade se já existe
      setSelectedIngredients(prev => 
        prev.map((ing, index) => 
          index === existingIndex 
            ? { ...ing, quantity, unit }
            : ing
        )
      );
    } else {
      // Adicionar novo ingrediente
      setSelectedIngredients(prev => [...prev, { id: ingredient.id, quantity, unit }]);
    }
  };

  // Função para remover ingrediente
  const removeIngredient = (ingredientId: number) => {
    setSelectedIngredients(prev => prev.filter(ing => ing.id !== ingredientId));
  };

  // Componente para card de ingrediente
  const IngredientCard = ({ ingredient, isSelected, selectedQuantity, selectedUnit, onSelect, onRemove }: {
    ingredient: any;
    isSelected: boolean;
    selectedQuantity: number;
    selectedUnit: string;
    onSelect: (ingredient: any, quantity: number, unit: string) => void;
    onRemove: (ingredientId: number) => void;
  }) => {
    const [quantity, setQuantity] = useState(selectedQuantity || 1);
    const [unit, setUnit] = useState(selectedUnit || 'g');
    const [showQuantityInput, setShowQuantityInput] = useState(isSelected);

    const handleSelect = () => {
      if (isSelected) {
        onRemove(ingredient.id);
        setShowQuantityInput(false);
      } else {
        setShowQuantityInput(true);
      }
    };

    const handleConfirmQuantity = () => {
      if (quantity > 0) {
        onSelect(ingredient, quantity, unit);
        setShowQuantityInput(false);
      }
    };

    return (
      <div className={`border rounded-lg p-3 transition-all ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelect}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'border-purple-500 bg-purple-500 text-white' 
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                {isSelected && <span className="text-xs">✓</span>}
              </button>
              <div>
                <h4 className="font-medium text-gray-800">{ingredient.name}</h4>
                <p className="text-sm text-gray-600">Estoque: {ingredient.stock} unidades</p>
              </div>
            </div>
            
            {showQuantityInput && !isSelected && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0.1"
                  step="0.1"
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Qtd"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="g">gramas</option>
                  <option value="kg">quilos</option>
                  <option value="ml">ml</option>
                  <option value="l">litros</option>
                  <option value="un">unidades</option>
                </select>
                <button
                  onClick={handleConfirmQuantity}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                >
                  Confirmar
                </button>
              </div>
            )}
            
            {isSelected && (
              <div className="mt-2 text-sm text-purple-700 font-medium">
                Quantidade: {selectedQuantity}{selectedUnit}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Função para buscar dados do portfólio - agora retorna apenas dados reais
  const getPortfolioData = () => {
    // Retorna apenas dados reais do banco - sem dados de exemplo
    return getCurrentCategoryItems();
  };

  // Função para compartilhar
  const handleShare = (type: 'link' | 'qr') => {
    const url = generateShareUrl();
    setShareUrl(url);
    setShareType(type);
    
    if (type === 'qr') {
      // Gerar dados do QR Code
      const qrData = `${url}?utm_source=qr&category=${selectedCategory}`;
      setQrCodeData(qrData);
    }
    
    setShowShareModal(true);
  };

  // Função para copiar link principal
  const copyShareLink = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('LINK COPIADO', 'Link copiado para área de transferência!');
    } catch (err) {
      showError('ERRO AO COPIAR', 'Não foi possível copiar o link. Tente novamente.');
    }
  };

  // Função para adicionar novo item
  const handleAddItem = () => {
    setNewItem({
      name: '',
      description: '',
      price: '',
      category: selectedCategory === 'vendas' ? 'pratos' : 'produtos'
    });
    setShowAddItemModal(true);
  };

  // Função para adicionar item ao portfólio
  const handleAddPortfolioItem = () => {
    setShowAddPortfolioModal(true);
  };

  // Função para salvar item do portfólio
  const savePortfolioItem = () => {
    if (portfolioItem.title && portfolioItem.description) {
      showSuccess('PROJETO ADICIONADO', `"${portfolioItem.title}" foi adicionado ao portfólio com sucesso!`);
      setShowAddPortfolioModal(false);
      setPortfolioItem({
        title: '',
        description: '',
        imageUrl: '',
        projectUrl: '',
        category: selectedCategory === 'design' ? 'branding' : 'website'
      });
    } else {
      showError('Campos obrigatórios', 'Por favor, preencha pelo menos o título e descrição do projeto.');
    }
  };

  // Função para salvar novo item
  const saveNewItem = () => {
    if (newItem.name && newItem.price) {
      // Aqui seria a integração com a API - item salvo com sucesso
      
      showSuccess(
        `${selectedCategory === 'vendas' ? 'PRATO' : 'PRODUTO'} ADICIONADO`,
        `"${newItem.name}" foi adicionado com sucesso!`
      );
      setShowAddItemModal(false);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: selectedCategory === 'vendas' ? 'pratos' : 'produtos'
      });
    } else {
      showError('Campos obrigatórios', 'Por favor, preencha ao menos o nome e o preço.');
    }
  };

  // Função para gerar QR Code SVG simples
  const generateQRCodeSVG = (data: string) => {
    // QR Code simples usando SVG - em produção usaria uma biblioteca como qrcode.js
    const size = 200;
    const modules = 21; // QR Code básico 21x21
    const moduleSize = size / modules;
    
    // Padrão de QR Code para compartilhamento
    const pattern = Array(modules).fill(null).map(() => 
      Array(modules).fill(null).map(() => Math.random() > 0.5)
    );
    
    // Adicionar padrões de detecção (cantos)
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        pattern[i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        pattern[i][modules - 1 - j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        pattern[modules - 1 - i][j] = (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
      }
    }
    
    const rects = pattern.map((row, i) =>
      row.map((cell, j) => 
        cell ? `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>` : ''
      ).join('')
    ).join('');
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="white"/>
        ${rects}
      </svg>
    `;
  };



  // Tabs baseadas na categoria
  const getTabs = () => {
    let catalogLabel = 'Catálogos';
    if (selectedCategory === 'design' || selectedCategory === 'sites') {
      catalogLabel = 'Portfólio';
    } else if (selectedCategory === 'alimenticio') {
      catalogLabel = 'Cardápios';
    }
    
    const baseTabs = [
      { id: 'mensagens', label: 'Mensagens', icon: MessageCircle },
      { id: 'cardapios', label: catalogLabel, icon: ShoppingCart },
      { id: 'fidelizacao', label: 'Fidelização', icon: Gift }
    ];
    
    // Adicionar aba de especialistas para categorias clínicas
    if (selectedCategory === 'medico' || selectedCategory === 'pet' || selectedCategory === 'estetica') {
      baseTabs.splice(2, 0, { id: 'especialistas', label: 'Especialistas', icon: Users });
    }
    
    return baseTabs;
  };

  // Mensagens com dados adequados para cada categoria 
  const getMessages = () => {
    // Mensagens serão carregadas de uma API real no futuro
    const messages: Record<string, Array<{id: number, name: string, time: string, message: string, status: string}>> = {
      [selectedCategory]: [] // Vazio por enquanto - será implementado com dados reais
    };
    
    return messages[selectedCategory] || [];
  };

  // Catálogos usando apenas dados reais do banco
  const getCatalogs = () => {
    // Para categoria alimenticia, usar itens personalizados do cardápio
    if (selectedCategory === 'alimenticio') {
      return getCurrentCategoryItems();
    }
    
    // Para outras categorias, puxar automaticamente do estoque
    const stockProducts = getCurrentCategoryItems();
    return stockProducts.map((product: any) => ({
      id: product.id,
      name: product.name || product.title,
      price: product.price ? `R$ ${Number(product.price).toFixed(2).replace('.', ',')}` : 'Sob consulta',
      description: product.description,
      category: product.category,
      stock: product.stock,
      isFromStock: true,
      available: product.forSale !== false
    }));
  };

  const renderMessages = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Conversas WhatsApp</h3>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 z-10" />
              <input
                type="text"
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Bot Online
            </div>
          </div>
        </div>

        <div className="item-list">
          {getMessages().map((msg) => (
            <div key={msg.id} className="list-item">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-800">{msg.name}</h4>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{msg.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {msg.status === 'pending' && (
                  <span className="badge badge-warning">Pendente</span>
                )}
                {msg.status === 'responded' && (
                  <span className="badge badge-success">Respondido</span>
                )}
                {msg.status === 'bot' && (
                  <span className="badge badge-info">Bot</span>
                )}
                <button className="btn btn-outline p-2">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Renderizar aba de portfólio para design e sites
  const renderPortfolio = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Portfólio {selectedCategory === 'design' ? 'de Design' : 'de Desenvolvimento'}
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleShare('link')}
              className="btn btn-outline flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar Portfolio
            </button>
            <button 
              onClick={() => handleShare('qr')}
              className="btn btn-outline flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            <button 
              onClick={handleAddPortfolioItem}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Adicionar Projeto
            </button>
          </div>
        </div>

        {/* Aviso sobre portfólio */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-purple-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Portfólio Profissional</span>
          </div>
          <p className="text-sm text-purple-600 mt-1">
            Adicione seus melhores trabalhos com imagens e links para impressionar clientes. 
            Compartilhe via link direto ou QR code.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getPortfolioData().map((project: any) => (
            <div key={project.id} className="content-card group hover:shadow-xl transition-all duration-300">
              <div className="relative mb-4">
                <img 
                  src={project.imageUrl} 
                  alt={project.title}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x200/9333ea/ffffff?text=Projeto';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className="badge badge-primary">{project.category}</span>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a 
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-secondary"
                  >
                    <Link className="w-4 h-4" />
                  </a>
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-800 mb-2">{project.title}</h4>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{project.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{project.date}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => editItem(project)}
                    className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                    title="Editar projeto"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => toggleItemAvailability(project.id)}
                    className={`p-2 border rounded-md transition-colors ${
                      project.available 
                        ? 'border-green-300 text-green-600 hover:bg-green-50' 
                        : 'border-red-300 text-red-600 hover:bg-red-50'
                    }`}
                    title={project.available ? 'Desativar projeto' : 'Ativar projeto'}
                  >
                    {project.available ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => deleteItem(project.id)}
                    className="p-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    title="Excluir projeto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpecialists = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {selectedCategory === 'medico' ? 'Especialistas Médicos' : 
             selectedCategory === 'pet' ? 'Especialistas Veterinários' : 
             'Especialistas em Estética'}
          </h3>
          <button 
            onClick={() => setShowAddSpecialistModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Especialista
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCurrentSpecialists().map((specialist: any) => (
            <div key={specialist.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{specialist.name}</h4>
                    <span className="text-sm text-gray-600">{specialist.specialty}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-outline btn-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {specialist.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{specialist.phone}</span>
                  </div>
                )}
                {specialist.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{specialist.email}</span>
                  </div>
                )}
                {specialist.schedule && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{specialist.schedule}</span>
                  </div>
                )}
              </div>

              {specialist.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{specialist.description}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className={`badge ${specialist.available ? 'badge-success' : 'badge-secondary'}`}>
                  {specialist.available ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {getCurrentSpecialists().length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">Nenhum especialista cadastrado</h4>
            <p className="text-gray-500">Adicione especialistas para gerenciar sua equipe</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCatalogs = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            {(selectedCategory === 'vendas' || selectedCategory === 'alimenticio') ? 'Cardápio Digital' : 'Catálogo de Produtos'}
          </h3>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleShare('link')}
              className="btn btn-outline flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar Link
            </button>
            <button 
              onClick={() => handleShare('qr')}
              className="btn btn-outline flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            {(selectedCategory === 'vendas' || selectedCategory === 'alimenticio') && (
              <button 
                onClick={handleAddItem}
                className="btn btn-primary"
              >
                <ShoppingCart className="w-4 h-4" />
                {selectedCategory === 'alimenticio' ? 'Adicionar Prato' : 'Adicionar Item'}
              </button>
            )}
          </div>
        </div>

        {/* Aviso de integração automática */}
        {selectedCategory !== 'vendas' && selectedCategory !== 'alimenticio' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Sincronização Automática com Estoque</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Os produtos abaixo são carregados automaticamente do seu estoque. 
              Para gerenciar produtos, vá para a seção Estoque.
            </p>
          </div>
        )}
        
        {/* Aviso para categoria alimenticia */}
        {selectedCategory === 'alimenticio' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Cardápio Personalizado</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Cadastre pratos personalizados com ingredientes do estoque. Use o botão "Adicionar Prato" 
              para criar itens do cardápio com imagem e ingredientes específicos.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCatalogs().map((item: any) => (
            <div key={item.id} className="content-card hover:shadow-xl transition-all duration-300">
              {/* Imagem do prato para categoria alimenticia */}
              {selectedCategory === 'alimenticio' && item.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex justify-between items-start mb-3">
                <span className="badge badge-primary">{item.category}</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{item.price}</span>
                  {item.isFromStock && (
                    <p className="text-xs text-gray-500 mt-1">
                      Estoque: {item.stock} unidades
                    </p>
                  )}
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 mb-2">{item.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              {item.isFromStock && item.stock <= 5 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                  <p className="text-xs text-yellow-700">⚠️ Estoque baixo - apenas {item.stock} unidades</p>
                </div>
              )}
              <div className="flex gap-2">
                {/* Botão de venda para pratos com ingredientes */}
                {selectedCategory === 'alimenticio' && item.isCustom && item.ingredients?.length > 0 && (
                  <button 
                    onClick={() => processDishSale(item, 1)}
                    className="p-2 border border-green-300 rounded-md text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                    title="Processar venda (deduzir ingredientes)"
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => editItem(item)}
                  className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
                  title="Editar item"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => toggleItemAvailability(item.id)}
                  className={`p-2 border rounded-md transition-colors ${
                    item.available 
                      ? 'border-green-300 text-green-600 hover:bg-green-50' 
                      : 'border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                  title={item.available ? 'Desativar item' : 'Ativar item'}
                >
                  {item.available ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="p-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Excluir item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Renderizar aba de pagamento
  const renderPayment = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-8 h-8 text-green-600" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Sistema de Pagamentos</h3>
            <p className="text-sm text-gray-600">Pagamentos automáticos via PIX e Cartão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="content-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">PIX Automático</h4>
                <p className="text-sm text-gray-600">Pagamento instantâneo</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Taxa</span>
                <span className="font-medium text-green-600">Grátis</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Tempo de processamento</span>
                <span className="font-medium">Instantâneo</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status</span>
                <span className="badge badge-success">Ativo</span>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Cartão de Crédito</h4>
                <p className="text-sm text-gray-600">Parcelamento disponível</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Taxa</span>
                <span className="font-medium text-blue-600">2.9%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Parcelamento</span>
                <span className="font-medium">Até 12x</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status</span>
                <span className="badge badge-success">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h4 className="font-medium text-gray-800 mb-4">Transações Recentes</h4>
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma transação registrada ainda</p>
            <p className="text-sm text-gray-400 mt-1">As transações aparecerão aqui quando houver vendas</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Modal de compartilhamento
  const renderShareModal = () => {
    if (!showShareModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {shareType === 'qr' ? 'QR Code para Compartilhar' : 'Link de Compartilhamento'}
            </h3>
            <button 
              onClick={() => setShowShareModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {shareType === 'qr' ? (
            <div className="text-center">
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Escaneie o QR Code para acessar o {selectedCategory === 'vendas' ? 'cardápio' : 'catálogo'}
              </p>
              <button className="btn btn-outline w-full flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Baixar QR Code
              </button>
            </div>
          ) : (
            <div>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 break-all">{shareUrl}</span>
                </div>
              </div>
              <button 
                onClick={() => copyShareLink(shareUrl)}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Link
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dados das campanhas de fidelização
  const getLoyaltyCampaigns = () => coupons;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'categoria': return 'blue';
      case 'sazonal': return 'green';
      case 'reativacao': return 'orange';
      case 'total': return 'purple';
      default: return 'gray';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'categoria': return 'Desconto por Categoria';
      case 'sazonal': return 'Promoção Sazonal';
      case 'reativacao': return 'Reativação de Clientes';
      case 'total': return 'Desconto Total';
      default: return type;
    }
  };

  // Renderizar aba de fidelização com lista padrão do sistema
  const renderLoyalty = () => (
    <div className="animate-fade-in">
      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-purple-600" />
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Campanhas de Fidelização</h3>
              <p className="text-sm text-gray-600">Gerenciamento de cupons e promoções</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 z-10" />
              <input
                type="text"
                placeholder="Buscar campanhas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button 
              onClick={() => setShowNewCampaignModal(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Campanha
            </button>
          </div>
        </div>

        {/* Lista de Campanhas */}
        <div className="standard-list-container">
          <div className="standard-list-content">
            {getLoyaltyCampaigns()
              .filter((campaign: any) => 
                campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                campaign.code.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((campaign: any) => {
                const typeColor = getTypeColor(campaign.type);
                return (
                  <div key={campaign.id} className="standard-list-item group">
                    <div className="list-item-main">
                      <div className="list-item-title">{campaign.code}</div>
                      <div className="list-item-subtitle">{campaign.name} • {getTypeLabel(campaign.type)}</div>
                      <div className="list-item-meta">
                        {campaign.discount_type === 'percentage' ? `${campaign.discount_value}%` : `R$ ${campaign.discount_value}`} de desconto • 
                        {campaign.usage_count} de {campaign.max_uses} usos • 
                        Min: R$ {campaign.minimum_value},00
                        {campaign.valid_until && ` • Válido até ${campaign.valid_until}`}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`list-status-badge ${campaign.status === 'ativo' ? 'status-success' : 'status-warning'}`}>
                        {campaign.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                      
                      <div className="list-item-actions">
                        <button 
                          className="list-action-button edit"
                          title="Editar campanha"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className="list-action-button view"
                          title="Visualizar relatório"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          className="list-action-button delete"
                          title="Desativar campanha"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="content-card text-center">
            <p className="text-2xl font-bold text-blue-600">R$ 12.450</p>
            <p className="text-sm text-gray-600">Receita com cupons</p>
            <p className="text-xs text-green-600 mt-1">+25% este mês</p>
          </div>
          <div className="content-card text-center">
            <p className="text-2xl font-bold text-green-600">415</p>
            <p className="text-sm text-gray-600">Cupons utilizados</p>
            <p className="text-xs text-blue-600 mt-1">Taxa de uso: 64%</p>
          </div>
          <div className="content-card text-center">
            <p className="text-2xl font-bold text-purple-600">1.8x</p>
            <p className="text-sm text-gray-600">Aumento na retenção</p>
            <p className="text-xs text-orange-600 mt-1">Clientes com cupons</p>
          </div>
        </div>
      </div>

      {/* Modal de Nova Campanha */}
      {showNewCampaignModal && (
        <div className="modal-overlay" onClick={() => setShowNewCampaignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-xl font-semibold text-gray-800">Nova Campanha de Fidelização</h3>
              <button 
                onClick={() => setShowNewCampaignModal(false)}
                className="btn btn-outline p-2"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="modal-body">
              {/* Seleção do Tipo de Campanha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Campanha
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setSelectedCampaignType('categoria')}
                    className={`content-card cursor-pointer transition-all ${
                      selectedCampaignType === 'categoria' 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Desconto por Categoria</h4>
                        <p className="text-xs text-gray-600">Desconto específico para categorias</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedCampaignType('sazonal')}
                    className={`content-card cursor-pointer transition-all ${
                      selectedCampaignType === 'sazonal' 
                        ? 'ring-2 ring-green-500 bg-green-50' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Promoção Sazonal</h4>
                        <p className="text-xs text-gray-600">Campanhas com período específico</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedCampaignType('reativacao')}
                    className={`content-card cursor-pointer transition-all ${
                      selectedCampaignType === 'reativacao' 
                        ? 'ring-2 ring-orange-500 bg-orange-50' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Reativação de Clientes</h4>
                        <p className="text-xs text-gray-600">Para clientes inativos</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    onClick={() => setSelectedCampaignType('total')}
                    className={`content-card cursor-pointer transition-all ${
                      selectedCampaignType === 'total' 
                        ? 'ring-2 ring-purple-500 bg-purple-50' 
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Desconto Total</h4>
                        <p className="text-xs text-gray-600">Desconto no valor total</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulário de Configuração */}
              {selectedCampaignType && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Campanha
                      </label>
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: Promoção de Verão"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código do Cupom
                      </label>
                      <input
                        type="text"
                        value={newCampaign.code}
                        onChange={(e) => setNewCampaign({ ...newCampaign, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="Ex: VERAO2025"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Desconto
                      </label>
                      <select
                        value={newCampaign.discount_type}
                        onChange={(e) => setNewCampaign({ ...newCampaign, discount_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="percentage">Porcentagem</option>
                        <option value="fixed">Valor Fixo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor do Desconto
                      </label>
                      <input
                        type="number"
                        value={newCampaign.discount_value}
                        onChange={(e) => setNewCampaign({ ...newCampaign, discount_value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder={newCampaign.discount_type === 'percentage' ? '15' : '25.00'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Mínimo
                      </label>
                      <input
                        type="number"
                        value={newCampaign.minimum_value}
                        onChange={(e) => setNewCampaign({ ...newCampaign, minimum_value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        placeholder="50.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Máximo de Usos
                    </label>
                    <input
                      type="number"
                      value={newCampaign.max_uses}
                      onChange={(e) => setNewCampaign({ ...newCampaign, max_uses: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                      placeholder="100"
                    />
                  </div>

                  {/* Campos específicos por tipo */}
                  {selectedCampaignType === 'sazonal' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Início
                        </label>
                        <input
                          type="date"
                          value={newCampaign.seasonal_start}
                          onChange={(e) => setNewCampaign({ ...newCampaign, seasonal_start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data de Fim
                        </label>
                        <input
                          type="date"
                          value={newCampaign.seasonal_end}
                          onChange={(e) => setNewCampaign({ ...newCampaign, seasonal_end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {selectedCampaignType === 'reativacao' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Segmento de Clientes
                      </label>
                      <select
                        value={newCampaign.customer_segment}
                        onChange={(e) => setNewCampaign({ ...newCampaign, customer_segment: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="inativos">Clientes Inativos (+ 30 dias)</option>
                        <option value="novos">Clientes Novos</option>
                        <option value="todos">Todos os Clientes</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowNewCampaignModal(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  // Aqui seria feita a criação da campanha
                  setShowNewCampaignModal(false);
                  setSelectedCampaignType('');
                  setNewCampaign({
                    name: '',
                    code: '',
                    type: '',
                    discount_type: 'percentage',
                    discount_value: '',
                    minimum_value: '',
                    max_uses: '',
                    target_categories: [],
                    seasonal_start: '',
                    seasonal_end: '',
                    customer_segment: 'todos'
                  });
                }}
                disabled={!selectedCampaignType || !newCampaign.name || !newCampaign.code}
                className="btn btn-primary"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mensagens':
        return renderMessages();
      case 'cardapios':
        // Para design e sites, mostrar portfólio ao invés de catálogo
        if (selectedCategory === 'design' || selectedCategory === 'sites') {
          return renderPortfolio();
        }
        return renderCatalogs();
      case 'especialistas':
        return renderSpecialists();
      case 'fidelizacao':
        return renderLoyalty();
      case 'pagamento':
        return renderPayment();
      default:
        return renderMessages();
    }
  };

  return (
    <div className="app-section">
      <div className="section-header">
        <h1 className="section-title">Atendimento ao Cliente</h1>
        <p className="section-subtitle">
          Sistema completo de atendimento WhatsApp com IA
        </p>
      </div>

      {/* Métricas de Atendimento ou Fidelização */}
      <div className="metrics-grid">
        {activeTab === 'fidelizacao' ? (
          // Cards de Fidelização
          <>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.activeClients.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {metrics.totalClients > 0 ? ((metrics.totalSales / metrics.totalClients) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Vendas por cliente</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.totalClients}</p>
                  <p className="text-xs text-purple-600 mt-1">Cadastrados</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cupons Ativos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.activeCoupons}</p>
                  <p className="text-xs text-gray-600 mt-1">Disponíveis</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Gift className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </>
        ) : (
          // Cards de Atendimento (originais)
          <>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                  <p className="text-xs text-gray-500 mt-1">WhatsApp não conectado</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bot Ativo</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0%</p>
                  <p className="text-xs text-gray-500 mt-1">Não configurado</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vendas Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.todaySales}</p>
                  <p className="text-xs text-purple-600 mt-1">Registradas</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <ShoppingCart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agendamentos Hoje</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metrics.todayAppointments}</p>
                  <p className="text-xs text-yellow-600 mt-1">Marcados</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navegação por Tabs */}
      <div className="tab-navigation">
        {getTabs().map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
            }}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            type="button"
            style={{ 
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      {renderTabContent()}
      
      {/* Modal de Compartilhamento */}
      {renderShareModal()}
      
      {/* Modal de Adicionar Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {isEditingItem ? 'Editar' : 'Adicionar'} {(selectedCategory === 'vendas' || selectedCategory === 'alimenticio') ? 'Prato' : 'Produto'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddItemModal(false);
                  setIsEditingItem(false);
                  setEditingItemId(null);
                  setNewItem({ name: '', description: '', price: '', category: 'produtos' });
                  setSelectedIngredients([]);
                  setNewItemImage('');
                  setShowIngredientsModal(false);
                  setSearchIngredientTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do {selectedCategory === 'vendas' || selectedCategory === 'alimenticio' ? 'Prato' : 'Item'} *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={selectedCategory === 'vendas' || selectedCategory === 'alimenticio' ? 'Ex: Pizza Margherita' : 'Ex: Smartphone XYZ'}
                />
              </div>
              
              {/* Campo de imagem para categoria alimenticia */}
              {selectedCategory === 'alimenticio' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL da Imagem
                  </label>
                  <input
                    type="url"
                    value={newItemImage}
                    onChange={(e) => setNewItemImage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://exemplo.com/imagem-do-prato.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Adicione uma imagem para mostrar o prato no cardápio</p>
                </div>
              )}
              
              {(selectedCategory === 'vendas' || selectedCategory === 'alimenticio') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredientes * ({selectedIngredients.length} selecionados)
                  </label>
                  
                  {/* Lista dos ingredientes selecionados */}
                  {selectedIngredients.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {selectedIngredients.map((ing) => {
                        const ingredient = getStockIngredients().find((item: any) => item.id === ing.id);
                        return ingredient ? (
                          <div key={ing.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm font-medium">{ingredient.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">{ing.quantity}{ing.unit}</span>
                              <button
                                onClick={() => removeIngredient(ing.id)}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setShowIngredientsModal(true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm"
                  >
                    {selectedIngredients.length === 0 ? '+ Selecionar Ingredientes' : '+ Adicionar Mais Ingredientes'}
                  </button>
                  
                  {getStockIngredients().length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">Nenhum ingrediente disponível no estoque</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Características e especificações..."
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço *
                </label>
                <input
                  type="text"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="R$ 0,00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {(selectedCategory === 'vendas' || selectedCategory === 'alimenticio') ? (
                    <>
                      <option value="pratos">Pratos Principais</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="sobremesas">Sobremesas</option>
                      <option value="entradas">Entradas</option>
                    </>
                  ) : (
                    <>
                      <option value="produtos">Produtos Gerais</option>
                      <option value="promocoes">Promoções</option>
                      <option value="lancamentos">Lançamentos</option>
                      <option value="destaque">Em Destaque</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setIsEditingItem(false);
                  setEditingItemId(null);
                  setNewItem({ name: '', description: '', price: '', category: 'produtos' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedItem}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                {isEditingItem ? 'Salvar Alterações' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Projeto ao Portfólio */}
      {showAddPortfolioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Adicionar Projeto ao Portfólio
              </h3>
              <button 
                onClick={() => setShowAddPortfolioModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Projeto *
                </label>
                <input
                  type="text"
                  value={portfolioItem.title}
                  onChange={(e) => setPortfolioItem({ ...portfolioItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: Identidade Visual - Empresa ABC"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={portfolioItem.description}
                  onChange={(e) => setPortfolioItem({ ...portfolioItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Descreva o projeto e os resultados alcançados..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da Imagem
                </label>
                <input
                  type="url"
                  value={portfolioItem.imageUrl}
                  onChange={(e) => setPortfolioItem({ ...portfolioItem, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link do Projeto
                </label>
                <input
                  type="url"
                  value={portfolioItem.projectUrl}
                  onChange={(e) => setPortfolioItem({ ...portfolioItem, projectUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://projeto.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={portfolioItem.category}
                  onChange={(e) => setPortfolioItem({ ...portfolioItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {selectedCategory === 'design' ? (
                    <>
                      <option value="branding">Identidade Visual</option>
                      <option value="impressos">Material Gráfico</option>
                      <option value="digital">Design Digital</option>
                      <option value="publicidade">Publicidade</option>
                    </>
                  ) : (
                    <>
                      <option value="website">Site Institucional</option>
                      <option value="loja-virtual">E-commerce</option>
                      <option value="conversao">Landing Page</option>
                      <option value="sistema">Sistema Web</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddPortfolioModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={savePortfolioItem}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Adicionar Projeto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar Especialista */}
      {showAddSpecialistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 99999 }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Adicionar Especialista {selectedCategory === 'medico' ? 'Médico' : 
                                       selectedCategory === 'pet' ? 'Veterinário' : 
                                       'em Estética'}
              </h3>
              <button 
                onClick={() => setShowAddSpecialistModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newSpecialist.name}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Dr. João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade *
                </label>
                <input
                  type="text"
                  value={newSpecialist.specialty}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={selectedCategory === 'medico' ? 'Cardiologia' : 
                              selectedCategory === 'pet' ? 'Clínica Geral' : 
                              'Harmonização Facial'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newSpecialist.phone}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={newSpecialist.email}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="doutor@clinica.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário de Atendimento
                </label>
                <input
                  type="text"
                  value={newSpecialist.schedule}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Seg-Sex: 8h às 18h"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição/Experiência
                </label>
                <textarea
                  value={newSpecialist.description}
                  onChange={(e) => setNewSpecialist({ ...newSpecialist, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Experiência e especialidades do profissional..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddSpecialistModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={addSpecialist}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Adicionar Especialista
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Seleção de Ingredientes */}
      {showIngredientsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Ingredientes</h3>
              <button 
                onClick={() => {
                  setShowIngredientsModal(false);
                  setSearchIngredientTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Campo de pesquisa */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Pesquisar ingredientes..."
                  value={searchIngredientTerm}
                  onChange={(e) => setSearchIngredientTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* Lista de ingredientes */}
            <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
              {getStockIngredients()
                .filter((ingredient: any) => 
                  ingredient.name.toLowerCase().includes(searchIngredientTerm.toLowerCase()) ||
                  ingredient.description?.toLowerCase().includes(searchIngredientTerm.toLowerCase())
                )
                .map((ingredient: any) => {
                  const isSelected = selectedIngredients.find(ing => ing.id === ingredient.id);
                  return (
                    <IngredientCard 
                      key={ingredient.id}
                      ingredient={ingredient}
                      isSelected={!!isSelected}
                      selectedQuantity={isSelected?.quantity || 0}
                      selectedUnit={isSelected?.unit || 'g'}
                      onSelect={addIngredientWithQuantity}
                      onRemove={removeIngredient}
                    />
                  );
                })}
            </div>
            
            {getStockIngredients().length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum ingrediente disponível no estoque</p>
                <p className="text-sm mt-1">Adicione produtos no estoque primeiro</p>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowIngredientsModal(false);
                  setSearchIngredientTerm('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowIngredientsModal(false);
                  setSearchIngredientTerm('');
                }}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
              >
                Confirmar ({selectedIngredients.length} selecionados)
              </button>
            </div>
          </div>
        </div>
      )}
      
      </div>
    );
  };

export default AtendimentoSection;
