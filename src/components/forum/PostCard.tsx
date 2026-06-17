import { MessageSquare, Pin, Trash2, BarChart3, Megaphone, Trophy, MessageCircleQuestion, ImageIcon } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import SalaBadge from "@/components/SalaBadge";
import { RichText } from "@/components/RichTextEditor";
import { Badge } from "@/components/ui/badge";
import ReactionBar from "./ReactionBar";
import SaveButton from "./SaveButton";
import { cn } from "@/lib/utils";

export interface FeedTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  author_class?: string | null;
  image_url: string | null;
  is_poll: boolean;
  is_pinned: boolean;
  post_type?: string;
  category_id: string | null;
  category_name?: string | null;
  category_color?: string | null;
  created_at: string;
  reply_count: number;
}

interface PostCardProps {
  topic: FeedTopic;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  onTogglePin?: (id: string, current: boolean) => void;
  canManage: boolean;
  isAdmin: boolean;
  variant?: "feed" | "compact";
}

const POST_TYPE_META: Record<string, { icon: any; label: string; color: string }> = {
  poll: { icon: BarChart3, label: "Enquete", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  question: { icon: MessageCircleQuestion, label: "Pergunta", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  challenge: { icon: Trophy, label: "Desafio", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  announcement: { icon: Megaphone, label: "Anúncio", color: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30" },
  image: { icon: ImageIcon, label: "Imagem", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
};

function formatRelative(d: string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function stripHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function PostCard({
  topic,
  onOpen,
  onDelete,
  onTogglePin,
  canManage,
  isAdmin,
  variant = "feed",
}: PostCardProps) {
  const typeMeta = topic.post_type && topic.post_type !== "text" ? POST_TYPE_META[topic.post_type] : null;
  const preview = stripHtml(topic.content).slice(0, 180);
  const isRecent = (Date.now() - new Date(topic.created_at).getTime()) < 60 * 60 * 1000;

  return (
    <article
      id={`topic-${topic.id}`}
      onClick={() => onOpen(topic.id)}
      className={cn(
        "group relative bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer animate-fade-in",
        topic.is_pinned && "ring-2 ring-accent/30"
      )}
    >
      {topic.is_pinned && (
        <div className="absolute top-3 right-3 z-10 bg-accent text-accent-foreground rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] font-bold shadow">
          <Pin className="w-3 h-3" /> Fixado
        </div>
      )}

      {topic.image_url && (
        <div className="relative w-full h-44 sm:h-56 overflow-hidden bg-muted">
          <img
            src={topic.image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Author + meta */}
        <header className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <UserAvatar
              userId={topic.author_id}
              name={topic.author_name}
              avatarUrl={topic.author_avatar_url}
              sala={topic.author_class}
              className="w-10 h-10 flex-shrink-0 ring-2 ring-background"
              fallbackClassName="text-xs bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-heading font-bold text-sm truncate">{topic.author_name}</span>
                <SalaBadge sala={topic.author_class} />
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <span>{formatRelative(topic.created_at)}</span>
                {isRecent && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-accent font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      novo
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {typeMeta && (
              <Badge variant="outline" className={cn("gap-1 text-[10px] font-bold uppercase tracking-wide border", typeMeta.color)}>
                <typeMeta.icon className="w-3 h-3" />
                {typeMeta.label}
              </Badge>
            )}
          </div>
        </header>

        {/* Title + preview */}
        <h3 className="font-heading font-extrabold text-lg sm:text-xl leading-tight text-foreground mb-2 group-hover:text-primary transition-colors">
          {topic.title}
        </h3>
        {preview && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {preview}
            {preview.length >= 180 && "…"}
          </p>
        )}

        {/* Category chip */}
        {topic.category_name && (
          <div className="mb-3">
            <span
              className="inline-flex items-center text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide border"
              style={
                topic.category_color
                  ? {
                      backgroundColor: `${topic.category_color}15`,
                      color: topic.category_color,
                      borderColor: `${topic.category_color}40`,
                    }
                  : {}
              }
            >
              {topic.category_name}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2">
            <ReactionBar topicId={topic.id} compact />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(topic.id);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="tabular-nums">{topic.reply_count}</span>
              <span className="hidden sm:inline">comentários</span>
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <SaveButton topicId={topic.id} />
            {isAdmin && onTogglePin && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(topic.id, topic.is_pinned);
                }}
                title={topic.is_pinned ? "Desafixar" : "Fixar"}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary"
              >
                <Pin className={cn("w-4 h-4", topic.is_pinned && "fill-current text-accent")} />
              </button>
            )}
            {canManage && onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Excluir esta publicação?")) onDelete(topic.id);
                }}
                title="Excluir"
                className="p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/** Compact card used in horizontal discovery carousels */
export function FeaturedCard({
  topic,
  onOpen,
  accent = "primary",
}: {
  topic: FeedTopic;
  onOpen: (id: string) => void;
  accent?: "primary" | "accent" | "purple" | "rose";
}) {
  const gradient = {
    primary: "from-primary to-primary/70",
    accent: "from-accent to-accent/70",
    purple: "from-purple-600 to-fuchsia-600",
    rose: "from-rose-500 to-orange-500",
  }[accent];

  return (
    <button
      type="button"
      onClick={() => onOpen(topic.id)}
      className={cn(
        "snap-start min-w-[260px] max-w-[260px] sm:min-w-[280px] sm:max-w-[280px] h-40 rounded-3xl p-4 text-left text-white shadow-lg relative overflow-hidden group bg-gradient-to-br animate-fade-in hover:scale-[1.02] transition-transform",
        gradient
      )}
    >
      {topic.image_url && (
        <img
          src={topic.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          {topic.category_name && (
            <span className="bg-white/25 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {topic.category_name}
            </span>
          )}
          {topic.is_pinned && <Pin className="w-3.5 h-3.5 fill-current" />}
        </div>
        <div>
          <h4 className="font-heading font-bold text-base leading-snug line-clamp-2 mb-2">{topic.title}</h4>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold opacity-90 truncate">{topic.author_name.split(" ")[0]}</span>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full font-bold">
              <MessageSquare className="w-3 h-3" /> {topic.reply_count}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
