import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useTrackDetail, flattenLessons, type Lesson } from "@/hooks/useTracks";
import LessonNode, { type LessonNodeState } from "@/components/tracks/LessonNode";
import LessonModal, { type CompletionResult } from "@/components/tracks/LessonModal";
import { ArrowLeft, Trophy, Sparkles } from "lucide-react";
import { useUserXp } from "@/hooks/useUserXp";

export default function TrackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { track, completedIds, loading, refetch } = useTrackDetail(id);
  const { refetch: refetchXp } = useUserXp();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppLayout>
    );
  }
  if (!track) {
    return (
      <AppLayout>
        <button onClick={() => navigate("/trilhas")} className="text-sm text-primary hover:underline">
          ← Voltar
        </button>
        <p className="mt-4 text-sm text-muted-foreground">Trilha não encontrada.</p>
      </AppLayout>
    );
  }

  const flat = flattenLessons(track);
  const totalCompleted = flat.filter((l) => completedIds.has(l.id)).length;
  const progress = flat.length > 0 ? Math.round((totalCompleted / flat.length) * 100) : 0;

  // Encontra "current" para trilhas sequenciais (primeira não concluída)
  const currentIndex = track.is_sequential
    ? flat.findIndex((l) => !completedIds.has(l.id))
    : -1;

  const getNodeState = (l: Lesson, idx: number): LessonNodeState => {
    if (completedIds.has(l.id)) return "completed";
    if (!track.is_sequential) return "available";
    if (idx === currentIndex) return "current";
    return "locked";
  };

  const offsets: Array<"left" | "center" | "right"> = ["center", "right", "center", "left"];

  const handleCompleted = (_r: CompletionResult) => {
    refetch();
    refetchXp();
  };

  return (
    <AppLayout>
      <div className="w-full max-w-3xl mx-auto">
        <button onClick={() => navigate("/trilhas")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar para trilhas
        </button>

        {/* Header */}
        <div className="border bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-6 mb-8">
          <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground">{track.title}</h1>
          {track.description && <p className="text-sm text-muted-foreground mt-1">{track.description}</p>}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium">
                {totalCompleted}/{flat.length} aulas concluídas
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {progress === 100 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/30 px-3 py-1.5 rounded-full text-sm font-bold">
              <Trophy className="w-4 h-4" /> Trilha concluída! Parabéns 🎉
            </div>
          )}
        </div>

        {/* Caminho visual por módulo */}
        {track.modules.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">Esta trilha ainda não tem aulas.</p>
        )}

        {(() => {
          let globalIdx = -1;
          return track.modules.map((mod, mi) => (
            <section key={mod.id} className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {mi + 1}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Módulo {mi + 1}</p>
                  <h2 className="font-heading font-bold text-lg text-foreground">{mod.title}</h2>
                </div>
              </div>

              <div className="space-y-8">
                {mod.lessons.map((l, li) => {
                  globalIdx++;
                  const state = getNodeState(l, globalIdx);
                  const offset = offsets[globalIdx % offsets.length];
                  return (
                    <LessonNode
                      key={l.id}
                      state={state}
                      title={l.title}
                      index={globalIdx}
                      offset={offset}
                      xp={l.xp_reward}
                      onClick={() => setActiveLesson(l)}
                    />
                  );
                })}
              </div>
            </section>
          ));
        })()}

        {flat.length > 0 && progress < 100 && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Sparkles className="w-5 h-5 mx-auto text-accent mb-1" />
            Continue avançando para destravar bônus de XP!
          </div>
        )}
      </div>

      <LessonModal
        lesson={activeLesson}
        isCompleted={activeLesson ? completedIds.has(activeLesson.id) : false}
        trackTitle={track.title}
        onClose={() => setActiveLesson(null)}
        onCompleted={handleCompleted}
      />
    </AppLayout>
  );
}
