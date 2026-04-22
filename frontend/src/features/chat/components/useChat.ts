import { useState, useEffect, useRef } from 'react';
import { chatService, chatHub, type Conversation, type Message } from '@/services/chat/chatService';
import { useAuthStore } from '@/store/authStore';

export function useChat() {
  const { accessToken: token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv]       = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [loading, setLoading]             = useState(true);

  // Initial load
  useEffect(() => {
    chatService.getConversations().then(setConversations).finally(() => setLoading(false));
  }, []);

  const activeConvIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeConvIdRef.current = activeConv?.id || null;
  }, [activeConv?.id]);

  // SignalR connection
  useEffect(() => {
    if (token) {
      chatHub.start(token, (newMsg) => {
        // Use ref to check current active conversation to avoid stale closure
        if (newMsg.conversationId === activeConvIdRef.current) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
        
        // Always update conversation list preview regardless of active chat
        setConversations(prev => prev.map(c => 
          c.id === newMsg.conversationId 
            ? { ...c, lastMessageAt: newMsg.createdAt, lastMessage: newMsg } 
            : c
        ));
      });
    }
    return () => { chatHub.stop(); };
  }, [token]);

  // Join/Leave conversation group
  useEffect(() => {
    if (activeConv) {
      chatHub.joinConversation(activeConv.id);
      chatService.getMessages(activeConv.id).then(setMessages);
      return () => { chatHub.leaveConversation(activeConv.id); };
    } else {
      setMessages([]);
    }
  }, [activeConv?.id]);

  const sendMessage = async (content: string) => {
    if (!activeConv || !content.trim()) return;
    const msg = await chatService.sendMessage({ conversationId: activeConv.id, content });
    // Local update to messages (SignalR will also broadcast but deduplication is in place)
    setMessages(prev => [...prev, msg]);
  };

  const createConversation = async (type: number, msg?: string) => {
    const conv = await chatService.createConversation({ type, initialMessage: msg });
    setConversations(prev => [conv, ...prev]);
    setActiveConv(conv);
    return conv;
  };

  const deleteConversation = async (id: string) => {
    await chatService.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConv?.id === id) setActiveConv(null);
  };

  return {
    conversations,
    activeConv,
    setActiveConv,
    messages,
    loading,
    sendMessage,
    createConversation,
    deleteConversation
  };
}
