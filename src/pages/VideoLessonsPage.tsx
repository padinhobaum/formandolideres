import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useVideoOverview } from "@/hooks/useVideoLessons";
import { GraduationCap, PlayCircle, CheckCircle2, ChevronRight, Sparkles, Crown, MessageCircle, Shield, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ICON_MAP: Record<string, React.ElementType> = {
  crown: Crown,
  "message-circle": MessageCircle,
  shield: Shield,
  users: Users,
  sparkles: Sparkles,
  "graduation-cap": GraduationCap,
};

export default function VideoLessonsPage() {
  const navigate = useNavigate();
  const { categories, playlists, loading } = useVideoOverview();
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    return playlists.filter((p) => {
      if (activeCat !== "all" && p.category_id !== activeCat) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.title.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [playlists, search, activeCat]);

  return (
    <AppLayout>
      <div className="w-full">
        <div className="mb-6">
          <h2 className="font-heading font-bold text-4xl text-accent">Videoaulas</h2>
          <p className="text-sm text-muted-foreground mt-1">Aprenda no seu ritmo e desenvolva sua liderança.</p>
        </div>

        {/* Search + filtros */}
        <div className="mb-6 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar uma aula ou tema..."
              className="pl-10 h-11 rounded-xl bg-card"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <button
                onClick={() => setActiveCat("all")}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCat === "all"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Todos
              </button>
              {categories.map((c) => {
                const Icon = ICON_MAP[c.icon] || GraduationCap;
                const active = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      active
                        ? "text-primary-foreground shadow-md"
                        : "bg-secondary text-foreground hover:bg-secondary/70"
                    }`}
                    style={active ? { backgroundColor: c.color } : undefined}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando aulas...</p>}

        {!loading && filtered.length === 0 && (
          <div className="border-2 border-dashed rounded-2xl p-12 text-center bg-card">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
              <PlayCircle className="w-8 h-8 text-muted-foreground/60" strokeWidth={1.3} />
            </div>
            <p className="text-base font-heading font-bold text-foreground">Nenhuma aula encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || activeCat !== "all"
                ? "Tente outra busca ou categoria."
                : "Em breve, novas aulas serão publicadas aqui."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const Icon = p.category ? ICON_MAP[p.category.icon] || GraduationCap : GraduationCap;
              const progress = p.totalLessons > 0 ? Math.round((p.completedLessons / p.totalLessons) * 100) : 0;
              const completed = progress === 100 && p.totalLessons > 0;
              const accent = p.category?.color || "hsl(var(--primary))";
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/videoaulas/${p.id}`)}
                  className="group text-left border bg-card rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}10)` }}>
                        <Icon className="w-14 h-14 opacity-40" style={{ color: accent }} strokeWidth={1.2} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-background/95 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                        <PlayCircle className="w-7 h-7 text-primary" strokeWidth={1.5} />
                      </div>
                    </div>

                    {completed && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-3 h-3" /> Concluído
                      </span>
                    )}

                    {p.category && (
                      <span
                        className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md text-white shadow"
                        style={{ backgroundColor: `${accent}E6` }}
                      >
                        <Icon className="w-3 h-3" />
                        {p.category.name}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-heading font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    {p.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                    )}

                    {p.totalLessons > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-foreground">
                            {p.completedLessons}/{p.totalLessons} {p.totalLessons === 1 ? "aula" : "aulas"}
                          </span>
                          <span className="text-muted-foreground font-semibold">{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: accent }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: accent }}>
                      {completed ? "Revisar curso" : progress > 0 ? "Continuar" : "Começar agora"}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
