import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Pin, Maximize2, ExternalLink, CalendarDays, Clock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/RichTextEditor";
import NoticeRelayButton from "@/components/NoticeRelayButton";

interface CtaButton {
  text: string;
  url: string;
  newTab: boolean;
}

interface NoticeEvent {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
  image_url: string | null;
  cta_buttons: CtaButton[];
  event: NoticeEvent | null;
  requires_relay: boolean;
}

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.
        from("notices").
        select("*, events(id, title, event_date, event_time)").
        order("is_pinned", { ascending: false }).
        order("created_at", { ascending: false });
      if (data) {
        const filtered = data.filter((n: any) => !n.target_user_ids || user && n.target_user_ids.includes(user.id));
        setNotices(filtered.map((d: any) => ({
          ...d,
          cta_buttons: Array.isArray(d.cta_buttons) ? d.cta_buttons : [],
          event: d.events || null,
        })));
      }
    };
    fetchData();
  }, [user]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setFocusedId(null);
  }, []);

  useEffect(() => {
    if (focusedId) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [focusedId, handleKeyDown]);

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const focusedNotice = notices.find((n) => n.id === focusedId);

  const renderCtaButtons = (ctas: CtaButton[]) => {
    if (!ctas || ctas.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {ctas.map((cta, i) =>
        <a key={i} href={cta.url} target={cta.newTab ? "_blank" : "_self"} rel={cta.newTab ? "noopener noreferrer" : undefined} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="gap-1.5">
              {cta.text}
              {cta.newTab && <ExternalLink className="w-3 h-3" strokeWidth={1.5} />}
            </Button>
          </a>
        )}
    </div>);
  };

  const shareWhatsApp = (notice: Notice) => {
    const text = `📢 *${notice.title}*\n\n${notice.content.replace(/<[^>]*>/g, '').slice(0, 500)}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const renderEventBadge = (event: NoticeEvent | null) => {
    if (!event) return null;
    const date = new Date(event.event_date + "T12:00:00");
    const day = date.toLocaleDateString("pt-BR", { day: "2-digit" });
    const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
    const time = event.event_time ? event.event_time.slice(0, 5) : null;
    return (
      <div className="mt-3 border border-primary/20 bg-primary/5 rounded-xl p-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-sm font-heading font-bold text-primary leading-none">{day}</span>
          <span className="text-[9px] font-bold text-primary/70">{month}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 text-primary" strokeWidth={1.5} />
            <span className="text-xs font-bold text-primary">Evento</span>
          </div>
          <p className="text-xs font-medium text-foreground line-clamp-1">{event.title}</p>
          {time && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock className="w-2.5 h-2.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground">{time}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="w-full">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Mural de Avisos</h2>

        {notices.length === 0 ?
        <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> :

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notices.map((n) =>
          <div
            key={n.id}
            className={`border bg-card rounded-xl overflow-hidden flex flex-col ${n.is_pinned ? "ring-2 ring-primary/30" : ""}`}>
            
                {n.image_url &&
            <img src={n.image_url} alt="" className="w-full aspect-video object-cover" loading="lazy" />
            }
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {n.is_pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" strokeWidth={1.5} />}
                      <h3 className="font-heading font-bold text-lg line-clamp-2">{n.title}</h3>
                    </div>
                    <button onClick={() => setFocusedId(n.id)} className="text-muted-foreground hover:text-primary transition-colors p-1 flex-shrink-0" title="Modo Foco">
                      <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <div className="text-sm font-body text-foreground line-clamp-3 mb-3" style={{ fontFamily: "'Rawline', var(--font-body), sans-serif" }}>
                    <RichText content={n.content} />
                  </div>
                  {renderEventBadge(n.event)}
                  <NoticeRelayButton noticeId={n.id} requiresRelay={n.requires_relay} />
                  {renderCtaButtons(n.cta_buttons)}
                  <button
                    onClick={(e) => { e.stopPropagation(); shareWhatsApp(n); }}
                    className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-2 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Compartilhar no WhatsApp
                  </button>
                  <p className="text-xs text-muted-foreground mt-auto pt-3">
                    {n.author_name} · {formatDate(n.created_at)}
                  </p>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      {/* Focus Mode Overlay */}
      {focusedNotice &&
      <>
          <div className="focus-overlay" onClick={() => setFocusedId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="focus-content max-w-2xl w-full p-8 pointer-events-auto max-h-[80vh] overflow-y-auto rounded-xl">
              {focusedNotice.image_url && <img src={focusedNotice.image_url} alt="" className="w-full max-h-72 mb-4 object-cover rounded-xl" />}
              <div className="flex items-center gap-2 mb-4">
                {focusedNotice.is_pinned && <Pin className="w-3 h-3 text-primary" strokeWidth={1.5} />}
                <h2 className="font-heading font-bold text-2xl text-primary">{focusedNotice.title}</h2>
              </div>
              <div className="font-heading text-base leading-relaxed whitespace-pre-wrap mb-6">
                <RichText content={focusedNotice.content} />
              </div>
              {renderEventBadge(focusedNotice.event)}
              <NoticeRelayButton noticeId={focusedNotice.id} requiresRelay={focusedNotice.requires_relay} />
              {renderCtaButtons(focusedNotice.cta_buttons)}
              <button
                onClick={() => shareWhatsApp(focusedNotice)}
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-2 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar no WhatsApp
              </button>
              <p className="text-xs text-muted-foreground mt-4">
                {focusedNotice.author_name} · {formatDate(focusedNotice.created_at)}
              </p>
            </div>
          </div>
        </>
      }
    </AppLayout>);

}