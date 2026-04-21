import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Como posso melhorar a comunicação com minha turma?",
  "Dicas para resolver conflitos entre alunos",
  "Como motivar colegas desmotivados?",
  "Como organizar uma reunião de turma eficiente?",
  "Qual o papel do líder de classe?",
];

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

  if (!resp.body) { onError("Sem resposta"); return; }

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
      if (json === "[DONE]") { onDone(); return; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {/* partial */}
    }
  }
  onDone();
}

export default function LiderAIPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!hasStarted) setHasStarted(true);
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
      onError: (msg) => { toast.error(msg); setLoading(false); },
    });
  };

  const isEmpty = messages.length === 0;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-9rem)] md:h-[calc(100vh-7rem)] max-w-4xl mx-auto md:px-2 md:py-2">
        {/* Sticky Header - animates in on first message */}
        <div className={`sticky top-0 z-10 flex items-center gap-3 px-4 py-3 mb-3 md:mb-5 rounded-xl bg-gradient-to-r from-primary/80 to-accent/80 backdrop-blur-sm transition-all duration-500 ease-out ${hasStarted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <Sparkles className="w-5 h-5 text-primary-foreground" />
          <h1 className="font-heading font-bold text-lg text-primary-foreground">LíderAI</h1>
        </div>

        {/* Chat area */}
        <div className="flex-1 min-h-0 relative">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4 pt-4 pb-16 md:pb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 blur-2xl scale-150 animate-pulse" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  Olá, o que você deseja perguntar para LíderAI?
                </h2>
                <p className="text-muted-foreground text-sm max-w-md">
                  Seu assistente de liderança de sala de aula, pronto para ajudar.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mb-4">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-4 py-2 rounded-full text-sm border border-border/60 bg-card/80 backdrop-blur-sm hover:bg-accent/20 hover:border-primary/40 transition-all text-foreground/80 hover:text-foreground shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full pr-2" ref={scrollRef as any}>
              <div className="space-y-4 py-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border/60 backdrop-blur-sm rounded-bl-md shadow-sm"
                      }`}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: m.content
                            .replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                            .replace(/__(.+?)__/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br />")
                        }}
                      />
                      {m.role === "assistant" && loading && i === messages.length - 1 && (
                        <span className="inline-block w-0.5 h-4 bg-foreground/70 ml-0.5 align-text-bottom animate-pulse" />
                      )}
                    </div>
                    {m.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="bg-card border border-border/60 rounded-2xl rounded-bl-md px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {!isEmpty && !loading && (
          <div className="flex flex-wrap gap-2 py-2 justify-center">
            {SUGGESTIONS.slice(0, 3).map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="px-3 py-1.5 rounded-full text-xs border border-border/50 bg-card/60 hover:bg-accent/20 transition-all text-muted-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input - sticky on mobile, integrated with bottom nav (no gap) */}
        <div className="md:pt-3 md:pb-1 md:border-t md:relative fixed md:static bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 bg-background/95 backdrop-blur-md border-t md:bg-transparent md:backdrop-blur-none px-4 md:px-0 py-2 md:py-0 shadow-lg md:shadow-none">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="gap-2 flex items-center py-1 md:py-2 max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Faça sua pergunta sobre liderança..."
              disabled={loading}
              className="flex-1 rounded-full bg-card/80 backdrop-blur-sm border-border/60"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()} className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="hidden md:block text-[11px] text-muted-foreground/60 text-center mt-1.5">
            As respostas da IA podem ser imprecisas. Verifique informações críticas.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
