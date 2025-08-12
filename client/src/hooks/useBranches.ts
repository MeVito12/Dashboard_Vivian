import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  is_main: boolean;
  is_active: boolean;
  manager_id?: string;
}

export const useBranches = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBranches = async () => {
    if (!user?.company_id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/branches?company_id=${user.company_id}`);
      if (response.ok) {
        const data = await response.json();
        setBranches(data);
        
        // Selecionar filial matriz por padrão
        const mainBranch = data.find((branch: Branch) => branch.is_main);
        if (mainBranch && !selectedBranch) {
          setSelectedBranch(mainBranch);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar filiais:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBranch = async (branchData: Omit<Branch, 'id' | 'company_id'>) => {
    if (!user?.company_id) return null;

    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...branchData,
          company_id: user.company_id,
        }),
      });

      if (response.ok) {
        const newBranch = await response.json();
        setBranches(prev => [...prev, newBranch]);
        return newBranch;
      }
    } catch (error) {
      console.error('Erro ao criar filial:', error);
    }
    return null;
  };

  const updateBranch = async (branchId: string, updates: Partial<Branch>) => {
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedBranch = await response.json();
        setBranches(prev => 
          prev.map(branch => 
            branch.id === branchId ? updatedBranch : branch
          )
        );
        
        if (selectedBranch?.id === branchId) {
          setSelectedBranch(updatedBranch);
        }
        
        return updatedBranch;
      }
    } catch (error) {
      console.error('Erro ao atualizar filial:', error);
    }
    return null;
  };

  const deleteBranch = async (branchId: string) => {
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBranches(prev => prev.filter(branch => branch.id !== branchId));
        
        if (selectedBranch?.id === branchId) {
          const mainBranch = branches.find(branch => branch.is_main);
          setSelectedBranch(mainBranch || null);
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erro ao deletar filial:', error);
    }
    return false;
  };

  useEffect(() => {
    fetchBranches();
  }, [user?.company_id]);

  return {
    branches,
    selectedBranch,
    setSelectedBranch,
    isLoading,
    createBranch,
    updateBranch,
    deleteBranch,
    refetch: fetchBranches,
  };
};