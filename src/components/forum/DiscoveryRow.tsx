import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DiscoveryRowProps {
  title: string;
  emoji: string;
  hint?: string;
  pulse?: boolean;
  children: ReactNode;
  variant?: "horizontal" | "grid";
}

export default function DiscoveryRow({
  title,
  emoji,
  hint,
  pulse,
  children,
  variant = "horizontal",
}: DiscoveryRowProps) {
  return (
    <section className="animate-fade-in">
      <header className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>{emoji}</span>
          <h3 className="font-heading font-bold text-base sm:text-lg text-foreground tracking-tight">
            {title}
          </h3>
          {pulse && <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />}
        </div>
        {hint && <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{hint}</span>}
      </header>
      <div
        className={cn(
          variant === "horizontal"
            ? "flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
            : "grid grid-cols-1 sm:grid-cols-2 gap-3"
        )}
      >
        {children}
      </div>
    </section>
  );
}
