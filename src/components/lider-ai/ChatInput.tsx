import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function ChatInput({ value, onChange, onSubmit, loading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !loading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="relative"
    >
      <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-border/60 bg-card shadow-sm focus-within:border-primary/50 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/10 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça sua pergunta sobre liderança..."
          disabled={loading}
          rows={1}
          className="flex-1 resize-none bg-transparent border-0 outline-none text-sm md:text-[15px] text-foreground placeholder:text-muted-foreground/70 px-3 py-2 max-h-40 leading-relaxed disabled:opacity-60"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className="rounded-xl h-10 w-10 flex-shrink-0 bg-gradient-to-br from-primary to-accent hover:opacity-90 disabled:opacity-40 shadow-sm transition-all"
          aria-label="Enviar mensagem"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground/60 text-center mt-2 px-2">
        Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground/70 text-[10px] font-mono">Enter</kbd> para enviar · As respostas podem ser imprecisas. Verifique informações críticas.
      </p>
    </form>
  );
}
