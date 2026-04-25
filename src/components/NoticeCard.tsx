import { Pin, ArrowRight, CalendarDays, Clock, Megaphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichText } from "@/components/RichTextEditor";

interface NoticeEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
}

export interface NoticeCardData {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar_url?: string | null;
  is_pinned: boolean;
  created_at: string;
  image_url: string | null;
  requires_relay?: boolean;
  event?: NoticeEvent | null;
}

interface Props {
  notice: NoticeCardData;
  onOpen?: (n: NoticeCardData) => void;
  variant?: "default" | "featured" | "compact";
}

const initials = (name?: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

const formatRelative = (d: string) => {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export default function NoticeCard({ notice, onOpen, variant = "default" }: Props) {
  const handleClick = () => onOpen?.(notice);

  if (variant === "featured") {
    return (
      <button
        onClick={handleClick}
        className="group relative w-full h-full text-left rounded-3xl overflow-hidden border-2 border-primary/20 bg-card hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col"
      >
        <div className="relative flex-1 min-h-[200px] overflow-hidden bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10">
          {notice.image_url ? (
            <img
              src={notice.image_url}
              alt={notice.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Megaphone className="w-20 h-20 text-primary/30" strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
          {notice.is_pinned && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
              <Pin className="w-3 h-3" /> Destaque
            </span>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-background mb-2 line-clamp-2 drop-shadow-lg">
              {notice.title}
            </h3>
            <div className="flex items-center gap-2 text-background/90 text-xs sm:text-sm">
              <Avatar className="w-6 h-6">
                <AvatarImage src={notice.author_avatar_url || undefined} />
                <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                  {initials(notice.author_name)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{notice.author_name}</span>
              <span>·</span>
              <span>{formatRelative(notice.created_at)}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={handleClick}
        className="group w-full text-left flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all"
      >
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
          {notice.image_url ? (
            <img src={notice.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Megaphone className="w-5 h-5 text-primary/60" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {notice.is_pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" strokeWidth={2} />}
            <p className="font-heading font-semibold text-sm line-clamp-1 text-foreground">{notice.title}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {notice.author_name} · {formatRelative(notice.created_at)}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </button>
    );
  }

  // default
  return (
    <button
      onClick={handleClick}
      className={`group w-full text-left rounded-2xl overflow-hidden border bg-card hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col ${
        notice.is_pinned ? "ring-1 ring-primary/40 border-primary/30" : ""
      }`}
    >
      {notice.image_url ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <img
            src={notice.image_url}
            alt={notice.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {notice.is_pinned && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
              <Pin className="w-3 h-3" /> Fixado
            </span>
          )}
        </div>
      ) : (
        <div className="relative aspect-[16/7] bg-gradient-to-br from-primary/15 via-accent/10 to-transparent flex items-center justify-center">
          <Megaphone className="w-10 h-10 text-primary/40" strokeWidth={1.3} />
          {notice.is_pinned && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow">
              <Pin className="w-3 h-3" /> Fixado
            </span>
          )}
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-heading font-bold text-base sm:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {notice.title}
        </h3>
        <div className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
          <RichText content={notice.content} />
        </div>

        {notice.event && (
          <div className="mt-3 inline-flex items-center gap-2 text-xs bg-primary/5 text-primary border border-primary/20 px-2.5 py-1.5 rounded-full w-fit">
            <CalendarDays className="w-3 h-3" />
            <span className="font-semibold">
              {new Date(notice.event.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </span>
            {notice.event.event_time && (
              <>
                <Clock className="w-3 h-3 ml-0.5" />
                <span>{notice.event.event_time.slice(0, 5)}</span>
              </>
            )}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarImage src={notice.author_avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground font-bold">
                {initials(notice.author_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate">
              <span className="font-medium text-foreground">{notice.author_name}</span> · {formatRelative(notice.created_at)}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}
