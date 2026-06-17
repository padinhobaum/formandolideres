import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export type ReactionType = "like" | "agree" | "applaud" | "inspire";

interface ReactionDef {
  type: ReactionType;
  emoji: string;
  label: string;
  bg: string;
  ring: string;
}

export const REACTIONS: ReactionDef[] = [
  { type: "like", emoji: "👍", label: "Curtir", bg: "bg-blue-100 dark:bg-blue-500/20", ring: "ring-blue-500" },
  { type: "agree", emoji: "✅", label: "Concordo", bg: "bg-emerald-100 dark:bg-emerald-500/20", ring: "ring-emerald-500" },
  { type: "applaud", emoji: "👏", label: "Aplaudir", bg: "bg-amber-100 dark:bg-amber-500/20", ring: "ring-amber-500" },
  { type: "inspire", emoji: "💡", label: "Inspirador", bg: "bg-yellow-100 dark:bg-yellow-500/20", ring: "ring-yellow-500" },
];

interface ReactionBarProps {
  topicId: string;
  compact?: boolean;
}

interface ReactionRow {
  reaction_type: ReactionType;
  user_id: string;
}

export default function ReactionBar({ topicId, compact = false }: ReactionBarProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchReactions = async () => {
    const { data } = await (supabase as any)
      .from("topic_reactions")
      .select("reaction_type, user_id")
      .eq("topic_id", topicId);
    setRows((data || []) as ReactionRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReactions();
    const channel = supabase
      .channel(`reactions-${topicId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topic_reactions", filter: `topic_id=eq.${topicId}` },
        () => fetchReactions()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  const myReactions = new Set(rows.filter((r) => r.user_id === user?.id).map((r) => r.reaction_type));
  const counts = REACTIONS.map((def) => ({
    ...def,
    count: rows.filter((r) => r.reaction_type === def.type).length,
    mine: myReactions.has(def.type),
  }));
  const total = rows.length;

  const toggle = async (type: ReactionType, mine: boolean) => {
    if (!user) return;
    setPickerOpen(false);
    // Optimistic
    setRows((prev) =>
      mine
        ? prev.filter((r) => !(r.user_id === user.id && r.reaction_type === type))
        : [...prev, { user_id: user.id, reaction_type: type }]
    );
    if (mine) {
      await (supabase as any)
        .from("topic_reactions")
        .delete()
        .eq("topic_id", topicId)
        .eq("user_id", user.id)
        .eq("reaction_type", type);
    } else {
      await (supabase as any)
        .from("topic_reactions")
        .insert({ topic_id: topicId, user_id: user.id, reaction_type: type });
    }
  };

  const active = counts.filter((c) => c.count > 0);
  const myTop = counts.find((c) => c.mine);

  return (
    <div className="relative inline-flex items-center gap-1.5">
      {/* Stacked summary */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPickerOpen((o) => !o);
        }}
        className={cn(
          "flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1 border border-border bg-muted/40 hover:bg-muted transition-colors",
          myTop && "border-primary/30 bg-primary/5"
        )}
        aria-label="Reagir"
      >
        {active.length > 0 ? (
          <div className="flex -space-x-1.5">
            {active.slice(0, 3).map((c) => (
              <span
                key={c.type}
                className={cn(
                  "w-5 h-5 rounded-full border-2 border-card flex items-center justify-center text-[11px]",
                  c.bg
                )}
              >
                {c.emoji}
              </span>
            ))}
          </div>
        ) : (
          <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[11px]">😊</span>
        )}
        <span className="text-xs font-bold text-foreground/80 tabular-nums">{total}</span>
      </button>

      {pickerOpen && (
        <div
          className="absolute z-30 bottom-full left-0 mb-2 flex items-center gap-1 rounded-full border border-border bg-card shadow-lg p-1.5 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {counts.map((c) => (
            <button
              key={c.type}
              type="button"
              onClick={() => toggle(c.type, c.mine)}
              title={c.label}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all hover:scale-125 hover:-translate-y-0.5",
                c.mine ? `${c.bg} ring-2 ${c.ring}` : "hover:bg-muted"
              )}
            >
              {c.emoji}
            </button>
          ))}
        </div>
      )}

      {!compact && active.length > 0 && (
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          {total === 1 ? "1 reação" : `${total} reações`}
        </span>
      )}
    </div>
  );
}
