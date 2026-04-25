import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Pin, Maximize2, ExternalLink, CalendarDays, Clock, Share2, Search, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichText } from "@/components/RichTextEditor";
import NoticeRelayButton from "@/components/NoticeRelayButton";
import NoticeCard, { type NoticeCardData } from "@/components/NoticeCard";

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
  author_avatar_url?: string | null;
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"todos" | "fixados" | "eventos">("todos");

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from("notices")
        .select("*, events(id, title, event_date, event_time)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (!data) return;

      const filtered = data.filter((n: any) => !n.target_user_ids || (user && n.target_user_ids.includes(user.id)));

      // Buscar avatares dos autores
      const authorIds = Array.from(new Set(filtered.map((n: any) => n.author_id).filter(Boolean)));
      let avatarMap: Record<string, string | null> = {};
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", authorIds as string[]);
        (profiles || []).forEach((p: any) => { avatarMap[p.user_id] = p.avatar_url; });
      }

      setNotices(filtered.map((d: any) => ({
        ...d,
        cta_buttons: Array.isArray(d.cta_buttons) ? d.cta_buttons : [],
        event: d.events || null,
        author_avatar_url: avatarMap[d.author_id] || null,
      })));
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

  const visibleNotices = useMemo(() => {
    let arr = notices;
    if (filter === "fixados") arr = arr.filter((n) => n.is_pinned);
    if (filter === "eventos") arr = arr.filter((n) => !!n.event);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
    }
    return arr;
  }, [notices, filter, search]);

  const featured = visibleNotices.find((n) => n.is_pinned);
  const others = visibleNotices.filter((n) => n.id !== featured?.id);
  const focusedNotice = notices.find((n) => n.id === focusedId);

  const renderCtaButtons = (ctas: CtaButton[]) => {
    if (!ctas || ctas.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {ctas.map((cta, i) => (
          <a key={i} href={cta.url} target={cta.newTab ? "_blank" : "_self"} rel={cta.newTab ? "noopener noreferrer" : undefined} onClick={(e) => e.stopPropagation()}>
            <Button size="sm" className="gap-1.5">
              {cta.text}
              {cta.newTab && <ExternalLink className="w-3 h-3" strokeWidth={1.5} />}
            </Button>
          </a>
        ))}
      </div>
    );
  };

  const shareWhatsApp = (notice: Notice) => {
    const plain = notice.content
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    const text = `📢 *${notice.title}*\n\n${plain}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Megaphone className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="font-heading font-bold text-4xl text-accent">Mural de Avisos</h2>
            <p className="text-sm text-muted-foreground">Comunicados e novidades da Formando Líderes</p>
          </div>
        </div>

        {/* Busca + filtros */}
        <div className="my-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar avisos..."
              className="pl-10 h-11 rounded-xl bg-card"
            />
          </div>
          <div className="flex gap-2">
            {([
              { key: "todos", label: "Todos" },
              { key: "fixados", label: "Fixados" },
              { key: "eventos", label: "Eventos" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 h-11 rounded-xl text-sm font-medium transition-all ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visibleNotices.length === 0 && (
          <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-card">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Megaphone className="w-8 h-8 text-muted-foreground/60" strokeWidth={1.3} />
            </div>
            <p className="text-base font-heading font-bold text-foreground">Nenhum aviso encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Tente outra busca." : "Aguarde, em breve novos avisos aparecerão aqui."}
            </p>
          </div>
        )}

        {/* Aviso fixado em destaque */}
        {featured && (
          <div className="mb-6">
            <NoticeCard
              variant="featured"
              notice={featured as unknown as NoticeCardData}
              onOpen={() => setFocusedId(featured.id)}
            />
          </div>
        )}

        {/* Demais avisos */}
        {others.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {others.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n as unknown as NoticeCardData}
                onOpen={() => setFocusedId(n.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Focus Mode */}
      {focusedNotice && (
        <>
          <div className="focus-overlay" onClick={() => setFocusedId(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="focus-content max-w-2xl w-full p-6 sm:p-8 pointer-events-auto max-h-[85vh] overflow-y-auto rounded-2xl relative">
              <button
                onClick={() => setFocusedId(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
              {focusedNotice.image_url && (
                <img src={focusedNotice.image_url} alt="" className="w-full max-h-72 mb-4 object-cover rounded-xl" />
              )}
              <div className="flex items-center gap-2 mb-4 pr-10">
                {focusedNotice.is_pinned && <Pin className="w-4 h-4 text-primary" strokeWidth={2} />}
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
                className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-3 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar no WhatsApp
              </button>
              <p className="text-xs text-muted-foreground mt-4 pt-4 border-t">
                {focusedNotice.author_name} · {formatDate(focusedNotice.created_at)}
              </p>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
