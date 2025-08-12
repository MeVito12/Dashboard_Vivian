// Sistema de notificações simplificado
import React from 'react';

interface NotificationSystemProps {
  className?: string;
}

const NotificationSystem = ({ className }: NotificationSystemProps) => {
  return null; // Componente simplificado
};

export const useNotifications = () => {
  return {
    addNotification: () => {},
    removeNotification: () => {},
    notifications: []
  };
};

export default NotificationSystem;