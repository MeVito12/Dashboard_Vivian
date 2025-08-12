import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface SectionPermission {
  id: string;
  label: string;
  description: string;
  icon: string;
  defaultEnabled: boolean;
}

export const availableSections: SectionPermission[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Visão geral e métricas',
    icon: 'Database',
    defaultEnabled: true
  },
  {
    id: 'graficos',
    label: 'Gráficos',
    description: 'Análises e relatórios',
    icon: 'BarChart3',
    defaultEnabled: true
  },
  {
    id: 'atividade',
    label: 'Atividade',
    description: 'Log de atividades',
    icon: 'Activity',
    defaultEnabled: true
  },
  {
    id: 'agendamentos',
    label: 'Agendamentos',
    description: 'Agenda e compromissos',
    icon: 'Calendar',
    defaultEnabled: true
  },
  {
    id: 'estoque',
    label: 'Estoque',
    description: 'Gestão de produtos e estoque',
    icon: 'Package',
    defaultEnabled: true
  },
  {
    id: 'vendas',
    label: 'Vendas',
    description: 'Sistema de vendas e carrinho',
    icon: 'ShoppingCart',
    defaultEnabled: true
  },
  {
    id: 'atendimento',
    label: 'Atendimento',
    description: 'Chat e assistente',
    icon: 'MessageCircle',
    defaultEnabled: true
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    description: 'Entradas e saídas financeiras',
    icon: 'CreditCard',
    defaultEnabled: true
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    description: 'Cadastros de clientes, categorias e subcategorias',
    icon: 'UserPlus',
    defaultEnabled: true
  }
];

type AccessMap = Record<string, boolean>;

interface PermissionsContextType {
  userPermissions: AccessMap;
  isMasterUser: boolean;
  isGestaoUser: boolean;
  canAccessSection: (sectionId: string) => boolean;
  updateUserPermissions: (userId: number, access: AccessMap) => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<AccessMap>({});

  // Verifica se é usuário master (case-insensitive)
  const isMasterUser = ((user as any)?.role || '').toLowerCase() === 'master';
  
  const isGestaoUser = isMasterUser; // Master tem acesso universal (gestão)
  
  // Debug para verificar detecção de usuários
  console.log('[PERMISSIONS] 🔍 User data:', user);
  console.log('[PERMISSIONS] 👑 isMasterUser:', isMasterUser);
  console.log('[PERMISSIONS] 📧 User email:', (user as any)?.email);
  console.log('[PERMISSIONS] 🏷️ User role:', (user as any)?.role);
  console.log('[PERMISSIONS] ✨ localStorage check:', localStorage.getItem('currentUser'));

  // Carrega permissões do backend (boolean map)
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) return;
      const userId = (user as any).id;

      if (isMasterUser) {
        // Master: todas as seções verdadeiras
        const allTrue: AccessMap = availableSections.reduce((acc, s) => {
          acc[s.id] = true;
          return acc;
        }, {} as AccessMap);
        setUserPermissions(allTrue);
        return;
      }

      try {
        const resp = await fetch(`/api/users/${userId}/permissions`);
        if (resp.ok) {
          const data = await resp.json();
          // data should be a map { sectionId: boolean }
          setUserPermissions(data || {});
        } else {
          // fallback: defaultEnabled
          const defaults: AccessMap = availableSections.reduce((acc, s) => {
            acc[s.id] = !!s.defaultEnabled;
            return acc;
          }, {} as AccessMap);
          setUserPermissions(defaults);
        }
      } catch (e) {
        const defaults: AccessMap = availableSections.reduce((acc, s) => {
          acc[s.id] = !!s.defaultEnabled;
          return acc;
        }, {} as AccessMap);
        setUserPermissions(defaults);
      }
    };

    fetchPermissions();
  }, [user, isMasterUser]);

  const canAccessSection = (sectionId: string): boolean => {
    return !!userPermissions[sectionId];
  };

  const updateUserPermissions = async (userId: number, access: AccessMap): Promise<void> => {
    if (!isMasterUser) return;
    await fetch(`/api/users/${userId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(access)
    });

    // Se estiver editando suas próprias permissões (improvável para master)
    if (user && (user as any).id === userId) {
      setUserPermissions(access);
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        userPermissions,
        isMasterUser,
        isGestaoUser,
        canAccessSection,
        updateUserPermissions
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};