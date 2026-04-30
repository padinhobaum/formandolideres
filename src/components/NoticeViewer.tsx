import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Pin, X, ExternalLink, CalendarDays, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/RichTextEditor";
import NoticeRelayButton from "@/components/NoticeRelayButton";
import NoticeComments from "@/components/NoticeComments";

interface CtaButton { text: string; url: string; newTab?: boolean }

export interface NoticeViewerEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  description?: string | null;
}

export interface NoticeViewerData {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar_url?: string | null;
  is_pinned?: boolean;
  created_at: string;
  image_url?: string | null;
  cta_buttons?: CtaButton[];
  event?: NoticeViewerEvent | null;
  requires_relay?: boolean;
}

interface Props {
  notice: NoticeViewerData | null;
  onClose: () => void;
}

export default function NoticeViewer({ notice, onClose }: Props) {
  useEffect(() => {
    if (!notice) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [notice, onClose]);

  if (!notice) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const initials = notice.author_name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  const renderEvent = () => {
    if (!notice.event) return null;
    const date = new Date(notice.event.event_date + "T12:00:00");
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit" });
    const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
    const time = notice.event.event_time ? notice.event.event_time.slice(0, 5) : null;
    return (
      <div className="mt-6 border border-primary/20 bg-primary/5 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-lg font-heading font-bold text-primary leading-none">{day}</span>
          <span className="text-[10px] font-bold text-primary/70 mt-0.5">{month}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Evento</span>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{notice.event.title}</p>
          {time && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
          )}
          {notice.event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notice.event.description}</p>
          )}
        </div>
      </div>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-background overflow-y-auto animate-fade-in"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Close button — sticky for easy access */}
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-10 w-11 h-11 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-lg flex items-center justify-center hover:bg-secondary hover:scale-105 active:scale-95 transition-all"
        style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Hero image */}
      {notice.image_url ? (
        <div className="relative w-full h-56 sm:h-72 md:h-96 overflow-hidden">
          <img src={notice.image_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>
      ) : (
        <div className="relative w-full h-32 sm:h-44 bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}

      {/* Content container */}
      <article className="relative max-w-3xl mx-auto px-5 sm:px-8 -mt-16 sm:-mt-24 pb-16 animate-fade-in">
        <div className="bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-10">
          {/* Pinned badge */}
          {notice.is_pinned && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Pin className="w-3 h-3" strokeWidth={2.5} />
              FIXADO
            </div>
          )}

          {/* Title */}
          <h1 className="font-heading font-bold text-2xl sm:text-4xl text-foreground leading-tight mb-4">
            {notice.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 pb-6 mb-6 border-b border-border">
            <Avatar className="w-10 h-10">
              <AvatarImage src={notice.author_avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{notice.author_name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(notice.created_at)}</p>
            </div>
          </div>

          {/* Body */}
          <div className="font-heading text-base sm:text-lg leading-relaxed text-foreground/90 prose-headings:font-heading">
            <RichText content={notice.content} />
          </div>

          {/* Event */}
          {renderEvent()}

          {/* Relay */}
          {notice.requires_relay && (
            <div className="mt-6">
              <NoticeRelayButton noticeId={notice.id} requiresRelay={notice.requires_relay} />
            </div>
          )}

          {/* CTAs */}
          {notice.cta_buttons && notice.cta_buttons.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {notice.cta_buttons.map((cta, i) => (
                <a
                  key={i}
                  href={cta.url}
                  target={cta.newTab ? "_blank" : "_self"}
                  rel={cta.newTab ? "noopener noreferrer" : undefined}
                >
                  <Button className="gap-1.5 rounded-xl">
                    {cta.text}
                    {cta.newTab && <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />}
                  </Button>
                </a>
              ))}
            </div>
          )}

          {/* Comments */}
          <NoticeComments noticeId={notice.id} />
        </div>
      </article>
    </div>,
    document.body
  );
}
