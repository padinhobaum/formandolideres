import { Flame } from "lucide-react";
import { useUserStreak } from "@/hooks/useUserStreak";

interface Props {
  variant?: "compact" | "card";
}

export default function StreakBadge({ variant = "compact" }: Props) {
  const { current, isActiveToday, loading } = useUserStreak();

  if (loading) return null;
  if (current === 0 && variant === "compact") return null;

  if (variant === "card") {
    return (
      <div className="border bg-gradient-to-br from-orange-500/10 via-amber-500/10 to-yellow-500/5 rounded-2xl p-4 flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg ${isActiveToday ? "animate-pulse" : ""}`}>
          <Flame className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-heading font-bold text-foreground leading-none">{current}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {current === 1 ? "dia de aprendizado" : "dias de aprendizado"}
            {!isActiveToday && current > 0 && (
              <span className="block text-orange-600 font-semibold">⚠️ Assista uma aula hoje!</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/30 ${isActiveToday ? "" : "opacity-70"}`} title={`${current} ${current === 1 ? "dia" : "dias"} de aprendizado`}>
      <Flame className={`w-4 h-4 text-orange-500 ${isActiveToday ? "animate-pulse" : ""}`} />
      <span className="text-sm font-bold text-orange-700 dark:text-orange-400">{current}</span>
    </div>
  );
}
