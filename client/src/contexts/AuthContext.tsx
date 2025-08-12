import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SessionManager } from '@/utils/sessionManager';

interface User {
  id: string; // UUID
  name: string;
  email: string;
  role: string;
  businessCategory: string;
  company_id?: string; // UUID
  company?: any;
  permissions?: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Recuperar usuário da sessão na inicialização
    console.log('[AUTH-CONTEXT] 🔄 Initializing with SessionManager...');
    const sessionUser = SessionManager.getSession();
    console.log('[AUTH-CONTEXT] 📊 Session user:', sessionUser);
    return sessionUser;
  });

  // Verificar sessão periodicamente
  useEffect(() => {
    const checkSession = () => {
      const sessionUser = SessionManager.getSession();
      if (!sessionUser && user) {
        // Sessão expirou, fazer logout
        console.log('[AUTH-CONTEXT] ⏰ Sessão expirada, fazendo logout...');
        setUser(null);
      } else if (sessionUser && !user) {
        // Sessão válida encontrada, fazer login
        console.log('[AUTH-CONTEXT] ✅ Sessão válida encontrada, fazendo login...');
        setUser(sessionUser);
      }
    };

    // Verificar imediatamente
    checkSession();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkSession, 30 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  const login = async (userData: any) => {
    console.log('[AUTH-CONTEXT] 🔐 Login called with:', userData);
    
    try {
      // Ensure we have the minimum required user data
      if (!userData || !userData.id) {
        throw new Error('Dados do usuário inválidos');
      }

      // Extract company ID from user data (support both snake_case and camelCase)
      const companyId = userData.company_id || userData.companyId;
      let companyData = userData.company;
      
      // If we have a company ID but no company data, try to fetch it
      if (companyId && !companyData) {
        console.log('[AUTH-CONTEXT] 🔍 Fetching company data for ID:', companyId);
        
        try {
          const response = await fetch(`/api/companies/${companyId}`);
          if (response.ok) {
            companyData = await response.json();
            console.log('[AUTH-CONTEXT] 🏢 Company data fetched:', companyData);
          } else {
            console.warn('[AUTH-CONTEXT] ⚠️ Failed to fetch company data:', await response.text());
          }
        } catch (error) {
          console.error('[AUTH-CONTEXT] ❌ Error fetching company data:', error);
        }
      }
      
      // Create a default company object if we have an ID but no data
      if (companyId && !companyData) {
        companyData = { 
          id: companyId,
          name: 'Minha Empresa',
          subdomain: 'minha-empresa'
        };
        console.log('[AUTH-CONTEXT] ℹ️ Using default company data');
      }
      
      // Normalize user data with consistent field names
      const normalizedUser: User = {
        id: userData.id,
        name: userData.name || userData.email?.split('@')[0] || 'Usuário',
        email: userData.email,
        role: userData.role || 'user',
        businessCategory: userData.business_category || userData.businessCategory || '',
        company_id: companyId,
        company: companyData,
        permissions: Array.isArray(userData.permissions) ? userData.permissions : []
      };

      console.log('[AUTH-CONTEXT] 🔄 Normalized user data:', normalizedUser);
      
      if (!normalizedUser.company_id) {
        console.warn('[AUTH-CONTEXT] ⚠️ Warning: User logged in without company_id', normalizedUser);
      } else if (!normalizedUser.company) {
        console.warn('[AUTH-CONTEXT] ⚠️ Warning: No company data available for user', normalizedUser);
      }
      
      // Save to session using SessionManager
      SessionManager.saveSession(normalizedUser);
      
      // Save business category separately for easy access
      if (normalizedUser.businessCategory) {
        localStorage.setItem('userBusinessCategory', normalizedUser.businessCategory);
      }
      
      // Update the user state
      setUser(normalizedUser);
      console.log('[AUTH-CONTEXT] ✅ User session established');
      
      return normalizedUser;
      
    } catch (error) {
      console.error('[AUTH-CONTEXT] ❌ Error during login:', error);
      throw error; // Re-throw to allow error handling in the component
    }
  };

  const logout = () => {
    console.log('[AUTH-CONTEXT] 🚪 Logout called');
    
    // Limpar sessão usando SessionManager
    SessionManager.clearSession();
    
    setUser(null);
    console.log('[AUTH-CONTEXT] ✅ User logged out and session cleared');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!user,
      user,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}