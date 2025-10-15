import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';

interface UnreadMessagesContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await chatService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  // Refresh unread count on mount and when user changes
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  // Listen for WebSocket messages to update count
  useEffect(() => {
    if (!user) return;

    const handleWebSocketMessage = (message: any) => {
      if (message.message_type === 'new_message') {
        refreshUnreadCount();
      }
    };

    chatService.onWebSocketMessage(handleWebSocketMessage);

    return () => {
      chatService.offWebSocketMessage(handleWebSocketMessage);
    };
  }, [user, refreshUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};
