import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useTracksList } from "@/hooks/useTracks";
import { Map, Lock, CheckCircle2, ChevronRight } from "lucide-react";
import StreakBadge from "@/components/StreakBadge";

export default function TracksPage() {
  const navigate = useNavigate();
  const { tracks, loading } = useTracksList();

  return (
    <AppLayout>
      <div className="w-full max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <Map className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl sm:text-4xl text-accent">Trilhas de Aprendizagem</h1>
            <p className="text-muted-foreground text-sm">Avance, ganhe XP e suba no ranking</p>
          </div>
        </div>

        <div className="my-6">
          <StreakBadge variant="card" />
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando trilhas...</p>}

        {!loading && tracks.length === 0 && (
          <div className="border border-dashed rounded-2xl p-10 text-center">
            <Map className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma trilha publicada ainda.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tracks.map((t) => {
            const progress = t.totalLessons > 0 ? Math.round((t.completedLessons / t.totalLessons) * 100) : 0;
            const completed = progress === 100 && t.totalLessons > 0;
            return (
              <button
                key={t.id}
                onClick={() => navigate(`/trilhas/${t.id}`)}
                className="text-left border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all rounded-2xl overflow-hidden group"
              >
                <div className="aspect-[16/7] bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 relative">
                  {t.cover_url ? (
                    <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Map className="w-12 h-12 text-primary/40" strokeWidth={1.2} />
                    </div>
                  )}
                  {completed && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow">
                      <CheckCircle2 className="w-3 h-3" /> Concluída
                    </span>
                  )}
                  {t.is_sequential && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-foreground/70 text-background text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full backdrop-blur">
                      <Lock className="w-3 h-3" /> Sequencial
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-lg text-foreground line-clamp-1">{t.title}</h3>
                  {t.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{t.description}</p>
                  )}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-foreground">
                        {t.completedLessons}/{t.totalLessons} aulas
                      </span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary group-hover:gap-2 transition-all">
                    Entrar na trilha <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
