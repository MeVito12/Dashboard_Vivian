import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Printer, Download } from 'lucide-react';

interface ThermalPrintProps {
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
  printerType: 'thermal' | 'conventional';
}

const ThermalPrint: React.FC<ThermalPrintProps> = ({ 
  sale, 
  company, 
  branch, 
  includeClient = false,
  printerType 
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implementar lógica de download se necessário
    console.log('Download iniciado');
  };

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <div className="flex items-center gap-2">
        <Download className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium text-foreground">Preview da Impressão</h4>
      </div>

      {/* Preview da impressão */}
      <div className={`bg-white text-black p-4 rounded-lg border border-gray-200 shadow-sm ${
        printerType === 'thermal' ? 'max-w-80 mx-auto' : 'max-w-96 mx-auto'
      }`}>
        <div className="text-center space-y-1">
          <h3 className="font-bold text-sm">{company.name}</h3>
          {company.cnpj && <p className="text-xs">CNPJ: {company.cnpj}</p>}
          {company.address && <p className="text-xs">{company.address}</p>}
          {company.phone && <p className="text-xs">Tel: {company.phone}</p>}
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className="text-center space-y-1">
          <p className="text-xs font-medium">{branch.name}</p>
          {branch.address && <p className="text-xs">{branch.address}</p>}
          {branch.phone && <p className="text-xs">Tel: {branch.phone}</p>}
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        {includeClient && sale.client && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-medium">Cliente: {sale.client.name}</p>
              {sale.client.cpf && <p className="text-xs">CPF: {sale.client.cpf}</p>}
              {sale.client.cnpj && <p className="text-xs">CNPJ: {sale.client.cnpj}</p>}
              {sale.client.phone && <p className="text-xs">Tel: {sale.client.phone}</p>}
            </div>
            <div className="border-t border-gray-300 my-2"></div>
          </>
        )}
        
        <div className="space-y-1">
          <p className="text-xs font-medium">Venda #{sale.id}</p>
          <p className="text-xs">Data: {new Date(sale.saleDate).toLocaleString('pt-BR')}</p>
          <p className="text-xs">Pagamento: {sale.paymentMethod}</p>
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {sale.products.map((product, index) => (
            <div key={index} className="flex justify-between text-xs">
              <div className="flex-1 pr-2">
                <p className="font-medium">{product.name}</p>
                <p className="text-gray-600">
                  {product.quantity}x R$ {product.price.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">R$ {product.total.toFixed(2)}</p>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-300 my-2"></div>
        
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL:</span>
          <span>R$ {sale.total.toFixed(2)}</span>
        </div>
        
        <div className="text-center mt-3 space-y-1">
          <p className="text-xs">Obrigado pela preferência!</p>
          <p className="text-xs">Volte sempre!</p>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 justify-center">
        <Button onClick={handlePrint} size="sm" className="flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={handleDownload} size="sm" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Baixar PDF
        </Button>
      </div>
    </div>
  );
};

export default ThermalPrint;