import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const CompanyInfo = () => {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState('Sua Empresa');

  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!user?.company_id) return;
      
      try {
        const response = await fetch(`/api/companies/${user.company_id}`);
        if (response.ok) {
          const data = await response.json();
          setCompanyName(data.name || 'Sua Empresa');
        }
      } catch (error) {
        console.error('Erro ao buscar nome da empresa:', error);
      }
    };

    if (user?.company?.name) {
      setCompanyName(user.company.name);
    } else if (user?.company_id) {
      fetchCompanyName();
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white">
      <Building2 className="h-4 w-4 text-blue-400" />
      <span className="truncate max-w-[200px]">
        {companyName}
      </span>
    </div>
  );
};

export default CompanyInfo;