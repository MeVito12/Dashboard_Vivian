import { useState, useEffect } from 'react';
import * as React from 'react';
import Sidebar from '@/components/Sidebar';
import Loading from '@/components/ui/loading';
import DashboardSection from '@/components/sections/DashboardSection';
import GraficosSection from '@/components/sections/GraficosSection';
import AtividadeSection from '@/components/sections/AtividadeSection';
import AgendamentosSection from '@/components/sections/AgendamentosSection';
import EstoqueSection from '@/components/sections/EstoqueSection';
import AtendimentoSection from '@/components/sections/AtendimentoSection';
import FinanceiroSection from '@/components/sections/FinanceiroSection';
import CadastrosSection from '@/components/sections/CadastrosSection';
import VendasSection from '@/components/sections/VendasSection';


const Index = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Função para mudança de seção com loading
  const handleSectionChange = (newSection: string) => {
    if (newSection === activeSection) return;
    
    setIsTransitioning(true);
    
    // Simular um pequeno delay para mostrar o loading
    setTimeout(() => {
      setActiveSection(newSection);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 200);
  };

  const renderActiveSection = () => {
    if (isTransitioning) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <Loading text="Carregando seção..." size="lg" />
        </div>
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onSectionChange={handleSectionChange} />;
      case 'graficos':
        return <GraficosSection />;
      case 'atividade':
        return <AtividadeSection />;
      case 'agendamentos':
        return <AgendamentosSection />;
      case 'estoque':
        return <EstoqueSection />;
      case 'vendas':
        return <VendasSection />;
      case 'atendimento':
        return <AtendimentoSection />;
      case 'financeiro':
        return <FinanceiroSection />;
      case 'cadastros':
        return <CadastrosSection />;

      default:
        return <DashboardSection onSectionChange={handleSectionChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--dashboard-darker))] to-[hsl(var(--dashboard-dark))] text-white relative overflow-hidden">
      {/* Efeito de fundo sutil - SEM BLOQUEAR CLIQUES */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary rounded-full blur-3xl modern-float pointer-events-none"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent rounded-full blur-3xl modern-pulse-subtle pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={handleSectionChange}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />

      {/* Main Content */}
      <main className={`p-4 md:p-6 pt-16 md:pt-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-0 md:ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  );
};

export default Index;