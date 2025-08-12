// Hook personalizado para notificações padronizadas
import { useToast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const { toast } = useToast();
  
  return {
    // Notificação de sucesso
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
        duration: 4000,
      });
    },
    
    // Notificação de erro
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "destructive",
        duration: 6000,
      });
    },
    
    // Notificação informativa
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
        duration: 4000,
      });
    },
    
    // Notificação de aviso
    warning: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "border-yellow-500 bg-yellow-50 text-yellow-900",
        duration: 5000,
      });
    },
    
    // Notificação de carregamento
    loading: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: "default",
        className: "border-gray-500 bg-gray-50 text-gray-900",
        duration: 2000,
      });
    },
    
    // Métodos de conveniência para operações comuns
    saveSuccess: (item: string = "Item") => {
      toast({
        title: "Salvo com sucesso",
        description: `${item} foi salvo com sucesso`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
        duration: 3000,
      });
    },
    
    deleteSuccess: (item: string = "Item") => {
      toast({
        title: "Excluído com sucesso",
        description: `${item} foi excluído com sucesso`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
        duration: 3000,
      });
    },
    
    updateSuccess: (item: string = "Item") => {
      toast({
        title: "Atualizado com sucesso",
        description: `${item} foi atualizado com sucesso`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
        duration: 3000,
      });
    },
    
    networkError: () => {
      toast({
        title: "Erro de conexão",
        description: "Verifique sua conexão com a internet e tente novamente",
        variant: "destructive",
        duration: 6000,
      });
    },
    
    serverError: () => {
      toast({
        title: "Erro interno",
        description: "Ocorreu um erro no servidor. Tente novamente em alguns minutos",
        variant: "destructive",
        duration: 6000,
      });
    },
    
    validationError: (message?: string) => {
      toast({
        title: "Dados inválidos",
        description: message || "Verifique os dados informados e tente novamente",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
};