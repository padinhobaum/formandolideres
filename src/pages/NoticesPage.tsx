import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Pin, Maximize2 } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.
      from("notices").
      select("*").
      order("is_pinned", { ascending: false }).
      order("created_at", { ascending: false });
      if (data) setNotices(data);
    };
    fetch();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusedId(null);
    },
    []
  );

  useEffect(() => {
    if (focusedId) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [focusedId, handleKeyDown]);

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const focusedNotice = notices.find((n) => n.id === focusedId);

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Mural de Avisos</h2>

        {notices.length === 0 ?
        <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> :

        <div className="space-y-3">
            {notices.map((n) =>
          <div
            key={n.id}
            className={`border bg-card p-5 ${n.is_pinned ? "bg-secondary" : ""}`}>
            
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <Pin className="w-3 h-3 text-primary" strokeWidth={1.5} />}
                    <h3 className="font-heading font-bold text-base">{n.title}</h3>
                  </div>
                  <button
                onClick={() => setFocusedId(n.id)}
                className="text-muted-foreground hover:text-primary transition-colors p-1"
                title="Modo Foco">
                
                    <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
                <p className="text-sm font-body text-foreground whitespace-pre-wrap mb-3">
                  {n.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {n.author_name} · {formatDate(n.created_at)}
                </p>
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
            <div className="focus-content max-w-2xl w-full p-8 pointer-events-auto max-h-[80vh] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                {focusedNotice.is_pinned && <Pin className="w-3 h-3 text-primary" strokeWidth={1.5} />}
                <h2 className="text-xl font-heading font-bold">{focusedNotice.title}</h2>
              </div>
              <p className="font-heading text-base leading-relaxed whitespace-pre-wrap mb-6">
                {focusedNotice.content}
              </p>
              <p className="text-xs text-muted-foreground">
                {focusedNotice.author_name} · {formatDate(focusedNotice.created_at)}
              </p>
            </div>
          </div>
        </>
      }
    </AppLayout>);

}