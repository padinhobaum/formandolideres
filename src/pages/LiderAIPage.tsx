import { useState, useRef, useEffect, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw, Menu } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/components/lider-ai/ChatMessage";
import { ChatEmptyState } from "@/components/lider-ai/ChatEmptyState";
import { ChatInput } from "@/components/lider-ai/ChatInput";
import { TypingIndicator } from "@/components/lider-ai/TypingIndicator";
import { ConversationSidebar } from "@/components/lider-ai/ConversationSidebar";
import { useAiConversations, loadMessages, type AiConversation } from "@/hooks/useAiConversations";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lider-ai-chat`;

export default function LiderAIPage() {
  const { user } = useAuth();
  const { conversations, refresh, remove, setConversations } = useAiConversations(user?.id);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSelectConversation = useCallback(async (id: string) => {
    setActiveId(id);
    const msgs = await loadMessages(id);
    setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
  }, []);

  const handleNewConversation = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    setInput("");
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await remove(id);
      if (activeId === id) handleNewConversation();
      toast.success("Conversa apagada");
    },
    [activeId, handleNewConversation, remove]
  );

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMsgs, conversation_id: activeId }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
        toast.error(err.error || "Erro ao conectar com a IA");
        setLoading(false);
        return;
      }

      const newConvId = resp.headers.get("X-Conversation-Id") || resp.headers.get("x-conversation-id");
      if (newConvId && newConvId !== activeId) {
        setActiveId(newConvId);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch { /* partial */ }
        }
      }
      setLoading(false);
      // Refresh conversation list (titles update server-side)
      setTimeout(() => refresh(), 1500);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao enviar mensagem");
      setLoading(false);
    }
  };

  const isEmpty = messages.length === 0;
  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";
  const activeConv = conversations.find((c) => c.id === activeId);

  const sidebar = (
    <ConversationSidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
      onDelete={handleDelete}
      onCloseMobile={() => setMobileSidebarOpen(false)}
    />
  );

  return (
    <AppLayout>
      <div
        className="-m-4 md:m-0 flex"
        style={{
          height:
            "calc(100dvh - 65px - 64px - env(safe-area-inset-top) - env(safe-area-inset-bottom))",
        }}
      >
        {/* Desktop sidebar */}
        <div className="hidden md:flex md:w-72 lg:w-80 flex-shrink-0">{sidebar}</div>

        {/* Mobile sidebar drawer */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[85vw] max-w-sm md:hidden">
            {sidebar}
          </SheetContent>
        </Sheet>

        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0 md:max-w-3xl md:mx-auto w-full md:h-[calc(100vh-7rem)] min-h-0">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 md:px-2 py-3 border-b md:border-b-0 bg-background/95 backdrop-blur md:bg-transparent md:backdrop-blur-none flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 flex-shrink-0"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Abrir histórico"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading font-bold text-base md:text-lg text-foreground leading-tight truncate">
                  {activeConv?.title || "LíderAI"}
                </h1>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-tight truncate">
                  Sua mentora pessoal de liderança
                </p>
              </div>
            </div>
            {!isEmpty && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewConversation}
                className="text-muted-foreground hover:text-foreground gap-1.5 flex-shrink-0"
                aria-label="Nova conversa"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Nova conversa</span>
              </Button>
            )}
          </header>

          {/* Scrollable chat area */}
          <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            {isEmpty ? (
              <ChatEmptyState onSelectSuggestion={send} />
            ) : (
              <div className="space-y-5 md:space-y-6 px-4 md:px-2 py-4 pb-2">
                {messages.map((m, i) => (
                  <ChatMessage
                    key={i}
                    message={m}
                    isStreaming={loading && i === messages.length - 1 && m.role === "assistant"}
                  />
                ))}
                {loading && !lastIsAssistant && <TypingIndicator />}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t md:border-t-0 bg-background/95 backdrop-blur md:bg-transparent md:backdrop-blur-none px-3 md:px-2 pt-2 pb-2 md:pt-4 md:pb-0">
            <ChatInput value={input} onChange={setInput} onSubmit={() => send(input)} loading={loading} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
