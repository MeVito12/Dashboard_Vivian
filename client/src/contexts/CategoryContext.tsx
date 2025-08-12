import React, { createContext, useContext, useState, useEffect } from 'react';

interface CategoryContextType {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const categories = [
  { value: 'farmacia', label: 'Farmácia', icon: '💊', description: 'Farmácias, drogarias e serviços farmacêuticos' },
  { value: 'pet', label: 'Pet & Veterinário', icon: '🐕', description: 'Clínicas veterinárias, pet shops e cuidados animais' },
  { value: 'medico', label: 'Médico & Saúde', icon: '⚕️', description: 'Clínicas médicas, consultórios e serviços de saúde' },
  { value: 'alimenticio', label: 'Alimentício', icon: '🍽️', description: 'Restaurantes, lanchonetes e estabelecimentos alimentícios' },
  { value: 'vendas', label: 'Vendas', icon: '💼', description: 'Empresas de vendas, comércio e representações' },
  { value: 'design', label: 'Design Gráfico', icon: '🎨', description: 'Estúdios de design e agências criativas' },
  { value: 'sites', label: 'Criação de Sites', icon: '🌐', description: 'Desenvolvimento web e marketing digital' }
];

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    // Verifica se há categoria salva no localStorage (definida pelo login)
    const savedCategory = localStorage.getItem('userBusinessCategory');
    if (savedCategory) {
      setSelectedCategory(savedCategory);
    }
  }, []);

  const handleSetSelectedCategory = (category: string) => {
    setSelectedCategory(category);
    localStorage.setItem('userBusinessCategory', category);
  };

  return (
    <CategoryContext.Provider 
      value={{ 
        selectedCategory, 
        setSelectedCategory: handleSetSelectedCategory
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory must be used within a CategoryProvider');
  }
  return context;
};