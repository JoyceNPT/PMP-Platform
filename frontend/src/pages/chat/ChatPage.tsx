import { useState, useRef, useEffect } from 'react';
import { 
  Send, Plus, Bot, User, 
  Search, MoreVertical, Paperclip, 
  Loader2, MessageSquare, Trash2 
} from 'lucide-react';
import { useChat } from '@/features/chat/components/useChat';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export function ChatPage() {
  const { 
    conversations, activeConv, setActiveConv, 
    messages, loading, sendMessage, createConversation, deleteConversation 
  } = useChat();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    console.log("handleSend triggered", input);
    const text = input;
    setInput('');
    try {
      await sendMessage(text);
    } catch (err) {
      console.error("handleSend error", err);
      toast.error("Không thể gửi tin nhắn.");
    }
  };

  const handleNewAiChat = async () => {
    console.log("handleNewAiChat triggered");
    try {
      await createConversation(0); // 0 = AI
      toast.success("Đã tạo cuộc hội thoại mới.");
    } catch (err) {
      console.error("handleNewAiChat error", err);
      toast.error("Không thể tạo cuộc hội thoại mới.");
    }
  };

  const handleDeleteConv = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xoá cuộc hội thoại này?")) return;
    try {
      await deleteConversation(id);
      toast.success("Đã xoá hội thoại.");
    } catch (err) {
      toast.error("Không thể xoá hội thoại.");
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="h-[calc(100vh-120px)] flex bg-card rounded-3xl border overflow-hidden shadow-sm animate-fade-in">
      
      {/* ── Sidebar: Conversation List ── */}
      <div className="w-80 border-r flex flex-col bg-muted/10">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">Tin nhắn</h2>
            <button onClick={handleNewAiChat} className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input placeholder="Tìm hội thoại..." className="w-full h-9 pl-9 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto opacity-20" />
              <p className="text-xs">Chưa có hội thoại nào</p>
            </div>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`group w-full p-4 flex gap-3 border-b border-border/40 hover:bg-muted/50 transition-colors text-left ${activeConv?.id === c.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${c.type === 0 ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                  {c.type === 0 ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className="font-bold text-sm truncate">{c.title || (c.type === 0 ? 'AI Assistant' : 'Support Agent')}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {c.lastMessageAt && format(new Date(c.lastMessageAt), 'HH:mm', { locale: vi })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate flex-1">{c.lastMessage?.content || 'Chưa có tin nhắn'}</p>
                    <button 
                      onClick={(e) => handleDeleteConv(e, c.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Main: Chat Area ── */}
      <div className="flex-1 flex flex-col bg-background">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-6 border-b flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${activeConv.type === 0 ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'}`}>
                  {activeConv.type === 0 ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm">{activeConv.title || (activeConv.type === 0 ? 'AI Assistant' : 'Support Agent')}</p>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Đang trực tuyến</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition"><Search className="h-4 w-4 text-muted-foreground" /></button>
                <button className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-muted transition"><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <MessageSquare className="h-8 w-8 opacity-20" />
                  </div>
                  <p className="text-sm">Bắt đầu cuộc trò chuyện ngay!</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.role === 0;
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`} style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className={`max-w-[75%] space-y-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'}`}>
                        {m.content}
                      </div>
                      <p className={`text-[10px] text-muted-foreground ${isMe ? 'text-right' : 'text-left'}`}>
                        {format(new Date(m.createdAt), 'HH:mm', { locale: vi })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <button className="h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center hover:bg-muted transition text-muted-foreground">
                  <Paperclip className="h-5 w-5" />
                </button>
                <div className="relative flex-1">
                  <textarea
                    rows={1}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="Nhập tin nhắn..."
                    className="w-full min-h-[40px] max-h-32 p-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center text-primary/40">
              <MessageSquare className="h-12 w-12" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold">Chọn một cuộc hội thoại</h3>
              <p className="text-sm text-muted-foreground">Bắt đầu trò chuyện với AI Assistant để nhận được những lời khuyên hữu ích về học tập và tài chính.</p>
            </div>
            <button 
              type="button"
              onClick={handleNewAiChat} 
              className="h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition flex items-center gap-2"
            >
              <Plus className="h-5 w-5" /> Trò chuyện mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
