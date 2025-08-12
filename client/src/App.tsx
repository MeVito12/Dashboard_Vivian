import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CategoryProvider } from "./contexts/CategoryContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import NotificationSystem, { useNotifications } from "./components/NotificationSystem";
import Index from "./pages/Index";
import LoginForm from "./components/LoginForm";


// Limpeza FORÇADA de dados inconsistentes do localStorage
if (typeof window !== 'undefined') {
  const currentUser = localStorage.getItem('currentUser');
  if (currentUser) {
    try {
      const userData = JSON.parse(currentUser);
      // Se detectar qualquer dados inconsistentes (email usuario@ OU role null), limpar
      if (userData.email === 'usuario@sistema.com' || !userData.role) {
        console.log('[AUTH-CLEANUP] 🔄 FORCED clearing of inconsistent localStorage data...');
        localStorage.clear(); // Limpar tudo
        sessionStorage.clear(); // Limpar session também
        window.location.reload();
      }
    } catch (e) {
      console.log('[AUTH-CLEANUP] ❌ Error parsing localStorage, clearing everything...');
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  }
}

const AppContent = () => {
  const { isAuthenticated, login } = useAuth();
  const { notifications, removeNotification } = useNotifications();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={
          <LoginForm onLogin={login} />
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/*" element={<Index />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <CategoryProvider>
        <AuthProvider>
          <NotificationProvider>
            <TooltipProvider>
              <PermissionsProvider>
                <Toaster />
                <AppContent />
              </PermissionsProvider>
            </TooltipProvider>
          </NotificationProvider>
        </AuthProvider>
      </CategoryProvider>
    </Router>
  </QueryClientProvider>
);

export default App;