// Hook otimizado para requisições API com tratamento de erro padronizado
import { useState } from 'react';
import { useNotifications } from './useNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  showSuccessMessage?: boolean;
  successMessage?: string;
  showErrorMessage?: boolean;
  errorMessage?: string;
}

export const useApiRequest = () => {
  const [loading, setLoading] = useState(false);
  const notifications = useNotifications();
  const { user } = useAuth();

  const request = async (url: string, options: ApiRequestOptions = {}) => {
    const {
      method = 'GET',
      body,
      showSuccessMessage = false,
      successMessage,
      showErrorMessage = true,
      errorMessage
    } = options;

    setLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Adicionar headers de autenticação se disponíveis
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }
      if (user?.company_id) {
        headers['x-company-id'] = user.company_id;
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }

      const data = await response.json();

      // Mostrar mensagem de sucesso se solicitado
      if (showSuccessMessage && successMessage) {
        notifications.success("Sucesso", successMessage);
      }

      return data;

    } catch (error: any) {
      // Mostrar mensagem de erro se solicitado
      if (showErrorMessage) {
        const message = errorMessage || error.message || "Ocorreu um erro inesperado";
        
        if (error.message?.includes('fetch')) {
          notifications.networkError();
        } else if (error.message?.includes('500')) {
          notifications.serverError();
        } else {
          notifications.error("Erro na operação", message);
        }
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { request, loading };
};