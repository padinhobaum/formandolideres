import { Flame } from "lucide-react";
import { useUserStreak } from "@/hooks/useUserStreak";

interface StreakBadgeProps {
  variant?: "compact" | "card";
}

export default function StreakBadge({ variant = "card" }: StreakBadgeProps) {
  const { current, longest, isActiveToday, loading } = useUserStreak();

  if (loading) return null;

  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
        <Flame
          className={`w-3.5 h-3.5 ${isActiveToday ? "text-orange-500" : "text-muted-foreground"}`}
          fill={isActiveToday ? "currentColor" : "none"}
          strokeWidth={1.8}
        />
        <span className="text-xs font-bold text-foreground">{current}</span>
      </div>
    );
  }

  return (
    <div className="border bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-2xl p-4 flex items-center gap-4">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform ${
          isActiveToday ? "bg-orange-500 animate-pulse" : "bg-muted"
        }`}
      >
        <Flame
          className={`w-7 h-7 ${isActiveToday ? "text-primary-foreground" : "text-muted-foreground"}`}
          fill={isActiveToday ? "currentColor" : "none"}
          strokeWidth={1.8}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
          Sequência diária
        </p>
        <p className="font-heading font-bold text-2xl text-foreground leading-tight">
          {current} {current === 1 ? "dia" : "dias"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isActiveToday
            ? "✨ Você já estudou hoje!"
            : current > 0
            ? "Faça uma aula hoje para manter a sequência"
            : "Comece sua sequência hoje!"}
          {longest > current && ` · Recorde: ${longest}`}
        </p>
      </div>
    </div>
  );
}
