import { Lock, Check, Play } from "lucide-react";

export type LessonNodeState = "completed" | "current" | "locked" | "available";

interface LessonNodeProps {
  state: LessonNodeState;
  title: string;
  index: number;
  offset: "left" | "center" | "right";
  onClick: () => void;
  xp: number;
}

/**
 * Nó de aula no caminho visual estilo Duolingo.
 * Posicionado em zigue-zague (left/center/right) para criar o efeito de trilha.
 */
export default function LessonNode({ state, title, index, offset, onClick, xp }: LessonNodeProps) {
  const disabled = state === "locked";
  const isCurrent = state === "current" || state === "available";

  const positionClass =
    offset === "left" ? "ml-0 mr-auto" : offset === "right" ? "ml-auto mr-0" : "mx-auto";

  return (
    <div className={`w-full flex flex-col items-center max-w-[140px] ${positionClass} group`}>
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={title}
        className={`
          relative w-20 h-20 rounded-full flex items-center justify-center
          transition-all duration-300
          ${state === "completed" ? "bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30" : ""}
          ${isCurrent ? "bg-gradient-to-br from-accent to-accent/70 shadow-xl shadow-accent/40 ring-4 ring-accent/30 animate-pulse" : ""}
          ${state === "locked" ? "bg-muted text-muted-foreground cursor-not-allowed" : "hover:scale-110 active:scale-95 cursor-pointer"}
        `}
      >
        {/* anel decorativo externo */}
        {state === "completed" && (
          <span className="absolute inset-0 rounded-full ring-4 ring-primary/10" />
        )}
        {/* ícone */}
        {state === "completed" && <Check className="w-9 h-9 text-primary-foreground" strokeWidth={3} />}
        {isCurrent && <Play className="w-8 h-8 text-primary-foreground ml-1" fill="currentColor" />}
        {state === "locked" && <Lock className="w-7 h-7" strokeWidth={2} />}

        {/* badge de número */}
        <span
          className={`
            absolute -top-1 -right-1 w-7 h-7 rounded-full text-xs font-bold
            flex items-center justify-center border-2
            ${state === "locked" ? "bg-muted text-muted-foreground border-background" : "bg-card text-foreground border-background shadow-sm"}
          `}
        >
          {index + 1}
        </span>
      </button>

      <p
        className={`text-center text-xs mt-2 font-body font-medium line-clamp-2 transition-colors ${
          state === "locked" ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {title}
      </p>
      {state !== "locked" && (
        <p className="text-[10px] text-muted-foreground font-body mt-0.5">+{xp} XP</p>
      )}
    </div>
  );
}
