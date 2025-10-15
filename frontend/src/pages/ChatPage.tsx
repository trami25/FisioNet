import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Box,
  Typography,
  Divider,
  Badge,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';
import { chatService, Conversation, Message, WebSocketMessage } from '../services/chatService';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { usersService } from '../services/usersService';
import { useUnreadMessages } from '../context/UnreadMessagesContext';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { showError } = useToast();
  const { refreshUnreadCount } = useUnreadMessages();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Connect to WebSocket
    chatService.connectWebSocket(user.id);

    // Load conversations
    loadConversations();

    // Check if there's a userId in URL params to start a new conversation
    const targetUserId = searchParams.get('userId');
    if (targetUserId) {
      startNewConversation(targetUserId);
    }

    // Handle incoming WebSocket messages
    const handleWebSocketMessage = (wsMessage: WebSocketMessage) => {
      if (wsMessage.message_type === 'new_message') {
        const newMessage: Message = wsMessage.data;
        
        // Add message to current conversation if it matches
        if (selectedConversation && 
            (newMessage.conversation_id === selectedConversation.conversation_id)) {
          setMessages(prev => [...prev, newMessage]);
        }
        
        // Reload conversations to update last message
        loadConversations();
      } else if (wsMessage.message_type === 'message_sent') {
        const sentMessage: Message = wsMessage.data;
        setMessages(prev => [...prev, sentMessage]);
        loadConversations();
      }
    };

    chatService.onWebSocketMessage(handleWebSocketMessage);

    return () => {
      chatService.offWebSocketMessage(handleWebSocketMessage);
      chatService.disconnectWebSocket();
    };
  }, [user, searchParams]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      const convs = await chatService.getConversations(user.id);
      setConversations(convs);
    } catch (error: any) {
      showError(error.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async (targetUserId: string) => {
    if (!user) return;

    try {
      // Check if conversation already exists
      const existing = conversations.find(c => c.other_user_id === targetUserId);
      if (existing) {
        loadMessages(existing);
        return;
      }

      // Get user info
      const targetUser = await usersService.getUserById(targetUserId);
      
      // Create a temporary conversation object
      const newConv: Conversation = {
        conversation_id: '', // Will be created when first message is sent
        other_user_id: targetUser.id,
        other_user_name: `${targetUser.firstName} ${targetUser.lastName}`,
        other_user_email: targetUser.email,
        other_user_role: targetUser.role,
        unread_count: 0,
      };

      setSelectedConversation(newConv);
      setMessages([]);
    } catch (error: any) {
      showError(error.message || 'Failed to start conversation');
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    if (!user) return;
    
    try {
      setSelectedConversation(conversation);
      const msgs = await chatService.getMessages(user.id, conversation.conversation_id, 50);
      setMessages(msgs);
      
      // Mark conversation as read
      if (conversation.conversation_id) {
        await chatService.markConversationRead(user.id, conversation.conversation_id);
        // Update the unread count locally
        setConversations(prev => 
          prev.map(c => 
            c.conversation_id === conversation.conversation_id 
              ? { ...c, unread_count: 0 } 
              : c
          )
        );
        // Refresh global unread count
        refreshUnreadCount();
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load messages');
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !messageText.trim()) return;

    try {
      setSending(true);
      
      // Send via WebSocket for real-time delivery
      chatService.sendMessageWs(selectedConversation.other_user_id, messageText.trim());
      
      setMessageText('');
    } catch (error: any) {
      showError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 100px)' }}>
      <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
        {/* Conversations List */}
        <Box sx={{ width: '350px', flexShrink: 0 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Messages</Typography>
            </Box>
            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {conversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No conversations yet
                  </Typography>
                </Box>
              ) : (
                conversations.map((conv) => (
                  <React.Fragment key={conv.conversation_id}>
                    <ListItem disablePadding>
                      <ListItemButton
                        selected={selectedConversation?.conversation_id === conv.conversation_id}
                        onClick={() => loadMessages(conv)}
                      >
                        <ListItemAvatar>
                          <Badge badgeContent={conv.unread_count} color="primary">
                            <Avatar>
                              <PersonIcon />
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                        primary={conv.other_user_name}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {conv.other_user_role}
                            </Typography>
                            {conv.last_message && (
                              <>
                                <br />
                                <Typography
                                  component="span"
                                  variant="body2"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {conv.last_message}
                                </Typography>
                              </>
                            )}
                          </>
                        }
                      />
                        {conv.last_message_time && (
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(conv.last_message_time)}
                          </Typography>
                        )}
                      </ListItemButton>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Box>

        {/* Chat Window */}
        <Box sx={{ flexGrow: 1 }}>
          <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedConversation.other_user_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedConversation.other_user_role}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message) => {
                    const isMine = message.sender_id === user?.id;
                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: isMine ? 'flex-end' : 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Paper
                          sx={{
                            p: 1.5,
                            maxWidth: '70%',
                            bgcolor: isMine ? 'primary.main' : 'grey.100',
                            color: isMine ? 'white' : 'text.primary',
                          }}
                        >
                          <Typography variant="body1">{message.content}</Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              opacity: 0.7,
                              textAlign: 'right',
                            }}
                          >
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                        </Paper>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};