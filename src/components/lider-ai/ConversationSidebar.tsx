import { Plus, MessageSquare, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiConversation } from "@/hooks/useAiConversations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  conversations: AiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onCloseMobile?: () => void;
}

function groupConversations(list: AiConversation[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const groups: Record<string, AiConversation[]> = {
    Hoje: [],
    Ontem: [],
    "Últimos 7 dias": [],
    "Mais antigas": [],
  };
  for (const c of list) {
    const diff = now - new Date(c.last_message_at).getTime();
    if (diff < day) groups["Hoje"].push(c);
    else if (diff < 2 * day) groups["Ontem"].push(c);
    else if (diff < 7 * day) groups["Últimos 7 dias"].push(c);
    else groups["Mais antigas"].push(c);
  }
  return groups;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onCloseMobile,
}: Props) {
  const groups = groupConversations(conversations);

  return (
    <aside className="h-full flex flex-col bg-card/40 border-r border-border/60">
      {/* Header */}
      <div className="p-3 border-b border-border/60 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-heading font-semibold text-foreground text-sm">LíderAI</span>
      </div>

      {/* New chat */}
      <div className="p-3">
        <Button
          onClick={() => {
            onNew();
            onCloseMobile?.();
          }}
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl border-dashed hover:border-primary hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Nova conversa
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-3">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center px-3 py-6">
            Suas conversas aparecerão aqui.
          </p>
        )}
        {Object.entries(groups).map(([label, items]) =>
          items.length === 0 ? null : (
            <div key={label}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors",
                      activeId === c.id
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-accent/5 text-foreground/80"
                    )}
                    onClick={() => {
                      onSelect(c.id);
                      onCloseMobile?.();
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                    <span className="flex-1 text-sm truncate">{c.title}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-1"
                          aria-label="Apagar conversa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apagar conversa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta conversa e todas as suas mensagens serão removidas permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(c.id)}>
                            Apagar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
