import React, { useState } from 'react';
import { Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ThermalPrint from './ThermalPrint';

interface PrintOptionsProps {
  sale: {
    id: number;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    total: number;
    paymentMethod: string;
    saleDate: string;
    client?: {
      name: string;
      cpf?: string;
      cnpj?: string;
      phone?: string;
      address?: string;
    };
  };
  company: {
    name: string;
    cnpj?: string;
    address?: string;
    phone?: string;
  };
  branch: {
    name: string;
    address?: string;
    phone?: string;
  };
  includeClient?: boolean;
}

const PrintOptions: React.FC<PrintOptionsProps> = ({ 
  sale, 
  company, 
  branch, 
  includeClient = false 
}) => {
  const [selectedPrinterType, setSelectedPrinterType] = useState<'thermal' | 'conventional'>('thermal');

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Printer className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Opções de Impressão</h3>
      </div>

      {/* Printer Type Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">
          Escolha o tipo de impressora:
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={selectedPrinterType === 'thermal' ? 'default' : 'outline'}
            onClick={() => setSelectedPrinterType('thermal')}
            className="h-auto p-3 justify-start text-left"
          >
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">Térmica (80mm)</div>
                <div className="text-xs opacity-70">Cupom fiscal</div>
              </div>
            </div>
          </Button>
          
          <Button
            variant={selectedPrinterType === 'conventional' ? 'default' : 'outline'}
            onClick={() => setSelectedPrinterType('conventional')}
            className="h-auto p-3 justify-start text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <div>
                <div className="font-medium text-sm">Convencional (A4)</div>
                <div className="text-xs opacity-70">Papel A4</div>
              </div>
            </div>
          </Button>
        </div>
      </div>

      {/* Print Component */}
      <ThermalPrint
        sale={sale}
        company={company}
        branch={branch}
        includeClient={includeClient}
        printerType={selectedPrinterType}
      />
    </div>
  );
};

export default PrintOptions;