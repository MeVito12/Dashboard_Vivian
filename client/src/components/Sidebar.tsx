import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/UserAvatar';
import UserSwitcher from '@/components/UserSwitcher';
import CompanyInfo from '@/components/CompanyInfo';
import { useAuth } from '@/contexts/AuthContext';
import { useCategory } from '@/contexts/CategoryContext';
import { usePermissions } from '@/contexts/PermissionsContext';

// ModernIcon removido - usando Lucide icons diretamente
import { 
  BarChart3, 
  Database, 
  Activity, 
  Calendar,
  Package,
  ShoppingCart,
  MessageCircle,
  LogOut,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const Sidebar = ({ activeSection, onSectionChange, isCollapsed: externalCollapsed, onToggleCollapse }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { selectedCategory } = useCategory();
  const { canAccessSection, isMasterUser } = usePermissions();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  
  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Database,
      description: 'Visão geral do sistema'
    },
    {
      id: 'graficos',
      label: 'Gráficos',
      icon: BarChart3,
      description: 'Análises e relatórios'
    },
    {
      id: 'atividade',
      label: 'Atividade',
      icon: Activity,
      description: 'Log de atividades'
    },
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: Calendar,
      description: 'Agendamentos e lembretes'
    },
    {
      id: 'estoque',
      label: 'Estoque',
      icon: Package,
      description: 'Gestão de produtos e estoque'
    },
    {
      id: 'vendas',
      label: 'Vendas',
      icon: ShoppingCart,
      description: 'Sistema de vendas e carrinho'
    },
    {
      id: 'atendimento',
      label: 'Atendimento',
      icon: MessageCircle,
      description: 'Mensagens e assistente'
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: CreditCard,
      description: 'Entradas e saídas financeiras'
    },
    {
      id: 'cadastros',
      label: 'Cadastros',
      icon: UserPlus,
      description: 'Clientes, categorias e subcategorias'
    }
  ];

  // Filtra itens baseado em permissões e categoria
  const menuItems = allMenuItems.filter(item => {
    // Estoque e vendas não aparecem para design e sites
    if ((item.id === 'estoque' || item.id === 'vendas') && (selectedCategory === 'design' || selectedCategory === 'sites')) {
      return false;
    }
    // Verifica permissões do usuário
    return canAccessSection(item.id);
  });

  const handleMenuClick = (itemId: string) => {
    onSectionChange(itemId);
  };

  return (
    <>
      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 z-40 h-full bg-[hsl(220_100%_12%)] border-r border-[hsl(220_100%_8%)] transition-all duration-300 shadow-xl",
        "w-64",
        isCollapsed ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-[hsl(220_100%_8%)]">
            {/* Informações do Usuário Logado */}
            <div className="mb-4 p-3 bg-[hsl(220_100%_8%)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <UserAvatar username={user?.name || 'Usuário'} size="medium" />
                <UserSwitcher />
              </div>
            </div>

          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 md:p-4 overflow-y-auto custom-scroll">
            <ul className="space-y-2">
              {menuItems
                .filter(item => {
                  // Remover estoque das categorias design e sites
                  if (item.id === 'estoque' && (selectedCategory === 'design' || selectedCategory === 'sites')) {
                    return false;
                  }
                  return true;
                })
                .map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-left h-auto p-3 text-white transition-all duration-300 min-h-[50px] md:min-h-[60px] modern-card-hover",
                        "hover:text-white modern-shine",
                        isActive && "bg-primary text-primary-foreground modern-glow"
                      )}
                      style={{
                        '--hover-bg': 'hsl(158 89% 53%)'
                      } as React.CSSProperties}
                      onClick={() => handleMenuClick(item.id)}
                    >
                      <Icon className="mr-3 flex-shrink-0 w-5 h-5 text-white" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-medium text-sm leading-tight truncate">{item.label}</div>
                        <div className={cn(
                          "text-xs mt-1 leading-tight break-words hidden md:block overflow-hidden line-clamp-2",
                          isActive ? "text-blue-100" : "text-blue-200"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer - Informações do Sistema */}
          <div className="p-3 md:p-4 border-t border-[hsl(220_100%_8%)]">
            <div className="text-center">
              <p className="text-xs text-gray-400">Sistema Kiro v1.0</p>
              <p className="text-xs text-gray-500 mt-1">
                Logado como: <span className="text-blue-300">{user?.role || 'Usuário'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className={cn(
        "fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300",
        isCollapsed ? "left-0" : "left-64"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-12 w-6 p-0 bg-[hsl(220_100%_12%)] border border-[hsl(220_100%_8%)] hover:bg-[hsl(220_100%_8%)] text-white shadow-lg rounded-r-md rounded-l-none"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-white" /> : <ChevronLeft className="w-4 h-4 text-white" />}
        </Button>
      </div>
    </>
  );
};

export default Sidebar;