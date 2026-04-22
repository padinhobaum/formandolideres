import { Bot } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 md:gap-4 animate-in fade-in duration-200">
      <Avatar className="w-9 h-9 flex-shrink-0 ring-2 ring-primary/20 shadow-sm">
        <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-4 shadow-sm">
        <div className="flex gap-1.5 items-center">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}
