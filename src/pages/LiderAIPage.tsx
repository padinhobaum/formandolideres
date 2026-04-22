import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/components/lider-ai/ChatMessage";
import { ChatEmptyState } from "@/components/lider-ai/ChatEmptyState";
import { ChatInput } from "@/components/lider-ai/ChatInput";
import { TypingIndicator } from "@/components/lider-ai/TypingIndicator";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lider-ai-chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
    onError(err.error || "Erro ao conectar com a IA");
    return;
  }

  if (!resp.body) {
    onError("Sem resposta");
    return;
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
      if (json === "[DONE]") {
        onDone();
        return;
      }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        /* partial */
      }
    }
  }
  onDone();
}

export default function LiderAIPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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

    await streamChat({
      messages: allMsgs,
      onDelta: upsert,
      onDone: () => setLoading(false),
      onError: (msg) => {
        toast.error(msg);
        setLoading(false);
      },
    });
  };

  const handleReset = () => {
    setMessages([]);
    setInput("");
    toast.success("Conversa reiniciada");
  };

  const isEmpty = messages.length === 0;
  const lastIsAssistant = messages[messages.length - 1]?.role === "assistant";

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100dvh-8rem)] md:h-[calc(100vh-7rem)] max-w-3xl mx-auto w-full">
        {/* Header — only shown when conversation has started */}
        {!isEmpty && (
          <header className="flex items-center justify-between gap-3 px-4 md:px-2 py-3 mb-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-base md:text-lg text-foreground leading-tight">LíderAI</h1>
                <p className="text-[11px] md:text-xs text-muted-foreground leading-tight">Assistente de liderança</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Nova conversa</span>
            </Button>
          </header>
        )}

        {/* Chat area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isEmpty ? (
            <ScrollArea className="h-full">
              <ChatEmptyState onSelectSuggestion={send} />
            </ScrollArea>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-5 md:space-y-6 px-4 md:px-2 py-4">
                {messages.map((m, i) => (
                  <ChatMessage
                    key={i}
                    message={m}
                    isStreaming={loading && i === messages.length - 1 && m.role === "assistant"}
                  />
                ))}
                {loading && !lastIsAssistant && <TypingIndicator />}
                <div ref={scrollEndRef} />
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Input — sticky bottom on mobile, integrated on desktop */}
        <div className="md:pt-4 md:pb-2 fixed md:static bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 bg-background/95 backdrop-blur-md md:bg-transparent md:backdrop-blur-none border-t md:border-t-0 px-4 md:px-2 py-3 md:py-0 shadow-lg md:shadow-none">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={() => send(input)}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
