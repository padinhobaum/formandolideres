import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  submitted: { label: "Enviada", className: "bg-primary/10 text-primary border-primary/20" },
  in_review: { label: "Em análise", className: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Aprovada", className: "bg-accent/10 text-accent border-accent/20" },
  rejected: { label: "Rejeitada", className: "bg-destructive/10 text-destructive border-destructive/20" },
  in_execution: { label: "Em execução", className: "bg-violet-100 text-violet-700 border-violet-200" },
  completed: { label: "Concluída", className: "bg-accent/15 text-accent border-accent/30" },
};

const IMPACT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

const CATEGORY_ICONS: Record<string, string> = {
  Infraestrutura: "🏗️",
  Eventos: "🎉",
  Ensino: "📚",
  Convivência: "🤝",
  Tecnologia: "💻",
  Esportes: "⚽",
  Cultura: "🎨",
  Outro: "💡",
};

interface ProposalCardProps {
  proposal: any;
  hasVoted: boolean;
  onVote: () => void;
  onClick: () => void;
  canVote: boolean;
  rank?: number;
}

export default function ProposalCard({ proposal: p, hasVoted, onVote, onClick, canVote, rank }: ProposalCardProps) {
  const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.submitted;
  const isTopProposal = rank !== undefined && rank < 3;

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden",
        isTopProposal && "ring-2 ring-accent/30",
        "hover:-translate-y-0.5"
      )}
      onClick={onClick}
    >
      {/* Top proposal badge */}
      {isTopProposal && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
            <Sparkles className="w-3 h-3" />
            Top {(rank ?? 0) + 1}
          </div>
        </div>
      )}

      {/* Image */}
      {p.image_url && (
        <div className="w-full h-44 overflow-hidden">
          <img
            src={p.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Category + Status row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5">
            {CATEGORY_ICONS[p.category] || "💡"} {p.category}
          </span>
          <span className={cn("text-[10px] font-semibold rounded-full px-2 py-0.5 border", statusInfo.className)}>
            {statusInfo.label}
          </span>
          {p.expected_impact === "alto" && (
            <span className="text-[10px] bg-accent/10 text-accent font-medium rounded-full px-2 py-0.5">
              🔥 Alto impacto
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-base sm:text-lg leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
          {p.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {p.description}
        </p>

        {/* Author + Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 ring-2 ring-background">
              <AvatarImage src={p.author_avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                {(p.author_name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-medium leading-tight">{p.author_name}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {new Date(p.created_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Comments count */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{p.comment_count}</span>
            </div>

            {/* Vote button */}
            <button
              onClick={e => { e.stopPropagation(); if (canVote) onVote(); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                hasVoted
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary",
                !canVote && "opacity-50 cursor-default",
                canVote && !hasVoted && "hover:scale-105 active:scale-95"
              )}
            >
              <ThumbsUp className={cn("w-3.5 h-3.5", hasVoted && "animate-scale-in")} />
              <span>{p.vote_count}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { STATUS_LABELS, IMPACT_LABELS, CATEGORY_ICONS };
