import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:8003';
const WS_BASE_URL = process.env.REACT_APP_CHAT_WS_URL || 'ws://localhost:8003';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: number;
  read: boolean;
}

export interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_email: string;
  other_user_role: string;
  last_message?: string;
  last_message_time?: number;
  unread_count: number;
}

export interface SendMessageRequest {
  receiver_id: string;
  content: string;
}

export interface WebSocketMessage {
  message_type: string;
  data?: any;
}

class ChatWebSocket {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: ((message: WebSocketMessage) => void)[] = [];

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN && this.userId === userId) {
      return;
    }

    this.userId = userId;
    this.ws = new WebSocket(`${WS_BASE_URL}/ws/${userId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      
      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({ message_type: 'ping' });
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.messageHandlers.forEach(handler => handler(message));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.userId) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, delay);
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.userId = null;
      this.reconnectAttempts = 0;
    }
  }
}

export const chatWebSocket = new ChatWebSocket();

export const chatService = {
  // Get user's conversations
  getConversations: async (userId: string): Promise<Conversation[]> => {
    try {
      const response = await api.get(`/users/${userId}/conversations`);
      return response.data.conversations;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch conversations');
    }
  },

  // Get messages in a conversation
  getMessages: async (userId: string, conversationId: string, limit?: number): Promise<Message[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await api.get(`/users/${userId}/conversations/${conversationId}/messages`, { params });
      return response.data.messages;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch messages');
    }
  },

  // Send a message (REST API)
  sendMessage: async (userId: string, receiverId: string, content: string): Promise<Message> => {
    try {
      const response = await api.post(`/users/${userId}/messages`, {
        receiver_id: receiverId,
        content,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send message');
    }
  },

  // Send a message via WebSocket
  sendMessageWs: (receiverId: string, content: string) => {
    chatWebSocket.send({
      message_type: 'message',
      data: {
        receiver_id: receiverId,
        content,
      },
    });
  },

  // Connect to WebSocket
  connectWebSocket: (userId: string) => {
    chatWebSocket.connect(userId);
  },

  // Disconnect from WebSocket
  disconnectWebSocket: () => {
    chatWebSocket.disconnect();
  },

  // Subscribe to WebSocket messages
  onWebSocketMessage: (handler: (message: WebSocketMessage) => void) => {
    chatWebSocket.onMessage(handler);
  },

  // Unsubscribe from WebSocket messages
  offWebSocketMessage: (handler: (message: WebSocketMessage) => void) => {
    chatWebSocket.removeMessageHandler(handler);
  },

  // Mark conversation as read
  markConversationRead: async (userId: string, conversationId: string): Promise<void> => {
    try {
      await api.post(`/users/${userId}/conversations/${conversationId}/read`);
    } catch (error: any) {
      console.error('Failed to mark conversation as read:', error);
    }
  },

  // Get total unread count
  getUnreadCount: async (userId: string): Promise<number> => {
    try {
      const response = await api.get(`/users/${userId}/unread`);
      return response.data.unread_count;
    } catch (error: any) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  },
};
