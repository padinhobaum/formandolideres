import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Pin, Maximize2, ExternalLink, CalendarDays, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/RichTextEditor";

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
}

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.
      from("notices").
      select("*").
      order("is_pinned", { ascending: false }).
      order("created_at", { ascending: false });
      if (data) {
        const filtered = data.filter((n: any) => !n.target_user_ids || user && n.target_user_ids.includes(user.id));
        setNotices(filtered.map((d: any) => ({
          ...d,
          cta_buttons: Array.isArray(d.cta_buttons) ? d.cta_buttons : []
        })));
      }
    };
    fetch();
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
                  <div className="text-sm font-body text-foreground line-clamp-3 mb-3">
                    <RichText content={n.content} />
                  </div>
                  {renderCtaButtons(n.cta_buttons)}
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
              {renderCtaButtons(focusedNotice.cta_buttons)}
              <p className="text-xs text-muted-foreground mt-4">
                {focusedNotice.author_name} · {formatDate(focusedNotice.created_at)}
              </p>
            </div>
          </div>
        </>
      }
    </AppLayout>);

}