import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        console.log('[QUERY-CLIENT] 🚀 === STARTING REQUEST ===');
        console.log('[QUERY-CLIENT] 🔗 QueryKey:', queryKey);
        
        // Obter dados de autenticação do localStorage DIRETAMENTE
        const { userId, company_id } = getCurrentAuthData();
        console.log('[QUERY-CLIENT] 📋 Auth data result:', { userId, company_id });
        
        // Para arrays, primeiro item é base URL, demais são query params
        let url = Array.isArray(queryKey) ? queryKey[0] : queryKey;
        
        // Se há parâmetros adicionais no queryKey, construir query string
        if (Array.isArray(queryKey) && queryKey.length > 1) {
          const [baseUrl, ...params] = queryKey;
          const filteredParams = params.filter(Boolean);
          if (filteredParams.length > 0) {
            // Assumindo que o último parâmetro é sempre company_id
            const company_id = filteredParams[filteredParams.length - 1];
            url = `${baseUrl}?company_id=${company_id}`;
          }
        }
        console.log('[QUERY-CLIENT] 🌐 Final URL:', url);
        console.log('[QUERY-CLIENT] 🔑 Final userId:', userId);
        console.log('[QUERY-CLIENT] 🏢 Final company_id:', company_id);
        
        if (!userId || !company_id) {
          console.error('[QUERY-CLIENT] ❌ CRITICAL: Missing authentication data', { userId, company_id });
          throw new Error('Authentication required: userId and company_id needed');
        }
        
        console.log('[QUERY-CLIENT] ✅ Making authenticated request');
        
        const response = await fetch(url as string, {
          headers: {
            'x-user-id': userId,
            'x-company-id': company_id
          }
        });
        
        console.log('[QUERY-CLIENT] 📡 Response:', response.status, response.statusText);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('[QUERY-CLIENT] 🔄 About to parse JSON...');
        let data;
        try {
          data = await response.json();
          console.log('[QUERY-CLIENT] 🎉 JSON parsed successfully!');
        } catch (jsonError) {
          console.error('[QUERY-CLIENT] ❌ JSON parse failed:', jsonError);
          const responseText = await response.text();
          console.error('[QUERY-CLIENT] 📄 Response text:', responseText);
          throw new Error('Failed to parse JSON response');
        }
        
        console.log('[QUERY-CLIENT] ✅ SUCCESS! Received data:', { 
          type: typeof data, 
          isArray: Array.isArray(data), 
          length: Array.isArray(data) ? data.length : 'not array',
          firstItem: Array.isArray(data) && data.length > 0 ? data[0]?.name || data[0] : 'no items',
          hasDataField: data && typeof data === 'object' && 'data' in data
        });
        
        // Se a resposta tem um campo 'data', extrair ele (nova estrutura da API)
        if (data && typeof data === 'object' && 'data' in data) {
          console.log('[QUERY-CLIENT] 🔄 Extracting data field from response');
          return data.data;
        }
        
        return data;
      },
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

import { SessionManager } from '@/utils/sessionManager';

// Função para obter dados de autenticação completos
function getCurrentAuthData(): { userId: string | null; company_id: string | null } {
  console.log('[QUERY-CLIENT] 🔧 getCurrentAuthData called');
  
  try {
    // Usar SessionManager em vez de localStorage direto
    const user = SessionManager.getSession();
    console.log('[QUERY-CLIENT] 📊 Session user:', user);
    
    if (!user) {
      console.log('[QUERY-CLIENT] ❌ No user in session');
      return { userId: null, company_id: null };
    }
    
    const userId = user?.id;
    const company_id = user?.company_id;
    console.log('[QUERY-CLIENT] 🎯 Extracted userId:', userId);
    console.log('[QUERY-CLIENT] 🏢 Extracted company_id:', company_id);
    
    return { 
      userId: userId || null, 
      company_id: company_id || null 
    };
  } catch (error) {
    console.error('[QUERY-CLIENT] ❌ Error:', error);
    return { userId: null, company_id: null };
  }
}

// Função para obter userId atual (mantida para compatibilidade)
function getCurrentUserId(): string | null {
  const { userId } = getCurrentAuthData();
  return userId;
}

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const { userId, company_id } = getCurrentAuthData();
  
  if (!userId || !company_id) {
    // Se não há autenticação, pode ser que a sessão tenha expirado
    console.error('[QUERY-CLIENT] ❌ No authentication data - session may have expired');
    throw new Error('Authentication required: userId and company_id needed');
  }
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      'x-company-id': company_id,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // Se erro 401, pode ser sessão expirada
    if (response.status === 401) {
      console.error('[QUERY-CLIENT] ❌ 401 Unauthorized - clearing session');
      SessionManager.clearSession();
      window.location.reload();
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Se a resposta tem um campo 'data', extrair ele (nova estrutura da API)
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data;
  }
  
  return data;
};