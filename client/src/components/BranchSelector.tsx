import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useBranches } from '@/hooks/useBranches';
import { Building2, MapPin, Phone } from 'lucide-react';
import { isUUID } from '@/lib/utils';

interface BranchSelectorProps {
  className?: string;
}

const BranchSelector = ({ className }: BranchSelectorProps) => {
  const { 
    branches, 
    selectedBranch, 
    setSelectedBranch, 
    isLoading 
  } = useBranches();

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    if (branch) {
      setSelectedBranch(branch);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Carregando filiais...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Seletor de Filial */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-blue-500" />
        <Select
          value={selectedBranch?.id || ''}
          onValueChange={handleBranchChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar filial">
              {selectedBranch && (
                <div className="flex items-center gap-2">
                  <span>{selectedBranch.name}</span>
                  {selectedBranch.is_main && (
                    <Badge variant="secondary" className="text-xs">
                      Matriz
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                <div className="flex items-center gap-2">
                  <span>{branch.name}</span>
                  {branch.code && !isUUID(branch.code) && (
                    <span className="text-xs text-gray-500">({branch.code})</span>
                  )}
                  {branch.is_main && (
                    <Badge variant="secondary" className="text-xs">
                      Matriz
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Informações da filial selecionada */}
      {selectedBranch && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {selectedBranch.address && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-32">{selectedBranch.address}</span>
            </div>
          )}
          {selectedBranch.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{selectedBranch.phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;