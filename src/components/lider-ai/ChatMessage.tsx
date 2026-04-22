import { Bot, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatMessageProps {
  message: Msg;
  isStreaming?: boolean;
}

function renderMarkdown(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-foreground/90 text-[0.85em] font-mono">$1</code>')
    .replace(/\n/g, "<br />");
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 md:gap-4 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-primary/20 shadow-sm">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 md:px-5 md:py-3.5 text-sm md:text-[15px] leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm shadow-md"
            : "bg-card border border-border/60 text-foreground rounded-bl-sm shadow-sm"
        }`}
      >
        <span
          className="break-words"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
        {isStreaming && (
          <span className="inline-block w-[3px] h-4 bg-foreground/70 ml-1 align-text-bottom animate-pulse rounded-full" />
        )}
      </div>

      {isUser && (
        <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-muted shadow-sm">
          <AvatarFallback className="bg-muted">
            <User className="w-4 h-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
