import * as React from 'react';

// Implementação simplificada do Toaster sem dependências externas
const Toaster: React.FC = () => {
  return (
    <div 
      className="fixed bottom-0 right-0 p-4 z-50"
      aria-live="assertive"
      style={{ zIndex: 9999 }}
    >
      {/* Os toasts serão adicionados aqui dinamicamente */}
    </div>
  );
};

// Função auxiliar para exibir toasts
const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
  // Garante que o código seja executado apenas no navegador
  if (typeof document === 'undefined') return;
  
  const toastContainer = document.querySelector('.toast-container') || createToastContainer();
  
  // Se não conseguir criar o container, não faz nada
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  
  const baseClasses = 'p-4 mb-2 rounded-md shadow-lg text-white font-medium';
  const typeClasses = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  };
  
  toast.className = `${baseClasses} ${typeClasses[type]}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  
  toastContainer.appendChild(toast);
  
  // Remover o toast após 5 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);};

// Criar o container de toasts se não existir
const createToastContainer = (): HTMLElement | null => {
  if (typeof document === 'undefined') return null;
  
  const container = document.createElement('div');
  container.className = 'toast-container fixed bottom-4 right-4 z-50';
  document.body.appendChild(container);
  return container;
};

// Implementação simplificada da função toast
const toast = {
  success: (message: string) => {
    showToast(message, 'success');
  },
  error: (message: string) => {
    showToast(message, 'error');
  },
  info: (message: string) => {
    showToast(message, 'info');
  },
  warning: (message: string) => {
    showToast(message, 'warning');
  }
};

export { Toaster, toast }
