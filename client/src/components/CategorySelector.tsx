import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCategory, categories } from '@/contexts/CategoryContext';
import { Building2, ArrowRight } from 'lucide-react';

const CategorySelector = () => {
  const { setSelectedCategory } = useCategory();
  const [selectedTemp, setSelectedTemp] = React.useState<string>('');

  const handleCategorySelect = (categoryValue: string) => {
    setSelectedTemp(categoryValue);
  };

  const handleConfirm = () => {
    if (selectedTemp) {
      setSelectedCategory(selectedTemp);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao Sistema de Gestão
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Selecione a categoria do seu negócio para personalizar sua experiência
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card 
                  key={category.value}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedTemp === category.value 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                  onClick={() => handleCategorySelect(category.value)}
                >
                  <CardContent className="p-6">
                    <div className="text-center space-y-3">
                      <div className="text-4xl mb-2">{category.icon}</div>
                      <h3 className="font-semibold text-gray-900">{category.label}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {category.description}
                      </p>
                      {selectedTemp === category.value && (
                        <Badge className="bg-blue-500 text-white">
                          Selecionado
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedTemp && (
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={handleConfirm}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-semibold shadow-lg transition-all duration-200"
                  size="lg"
                >
                  Continuar para o Sistema
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Você poderá alterar esta configuração posteriormente nas configurações do sistema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CategorySelector;