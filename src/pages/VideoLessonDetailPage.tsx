import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { usePlaylistDetail, type VideoLesson } from "@/hooks/useVideoLessons";
import { ArrowLeft, PlayCircle, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { formatDuration, getYouTubeThumbnail } from "@/lib/youtube";
import LessonModal, { type CompletionResult } from "@/components/videos/LessonModal";
import { useUserXp } from "@/hooks/useUserXp";

export default function VideoLessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlist, completedIds, loading, refetch } = usePlaylistDetail(id);
  const { refetch: refetchXp } = useUserXp();
  const [activeLesson, setActiveLesson] = useState<VideoLesson | null>(null);

  if (loading) {
    return (
      <AppLayout>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppLayout>
    );
  }
  if (!playlist) {
    return (
      <AppLayout>
        <button onClick={() => navigate("/videoaulas")} className="text-sm text-primary hover:underline">
          ← Voltar
        </button>
        <p className="mt-4 text-sm text-muted-foreground">Curso não encontrado.</p>
      </AppLayout>
    );
  }

  const totalCompleted = playlist.lessons.filter((l) => completedIds.has(l.id)).length;
  const progress = playlist.lessons.length > 0 ? Math.round((totalCompleted / playlist.lessons.length) * 100) : 0;
  const totalSeconds = playlist.lessons.reduce((acc, l) => acc + (l.duration_seconds || 0), 0);
  const accent = playlist.category?.color || "hsl(var(--primary))";

  const handleCompleted = (_r: CompletionResult) => {
    refetch();
    refetchXp();
  };

  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/videoaulas")}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para videoaulas
        </button>

        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 mb-6 text-primary-foreground shadow-sm"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
        >
          <div className="relative">
            {playlist.category && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                <GraduationCap className="w-3 h-3" />
                {playlist.category.name}
              </span>
            )}
            <h1 className="font-heading font-bold text-2xl sm:text-3xl">{playlist.title}</h1>
            {playlist.description && (
              <p className="text-primary-foreground/90 text-sm sm:text-base mt-1.5 max-w-2xl">{playlist.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <div className="inline-flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4" />
                <span>{playlist.lessons.length} {playlist.lessons.length === 1 ? "aula" : "aulas"}</span>
              </div>
              {totalSeconds > 0 && (
                <div className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(totalSeconds)}</span>
                </div>
              )}
            </div>

            {playlist.lessons.length > 0 && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs mb-1.5 text-primary-foreground/90">
                  <span className="font-bold">{totalCompleted}/{playlist.lessons.length} concluídas</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {playlist.lessons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">Este curso ainda não tem aulas.</p>
        )}

        <div className="space-y-3">
          {playlist.lessons.map((lesson, idx) => {
            const completed = completedIds.has(lesson.id);
            const thumb = lesson.thumbnail_url || getYouTubeThumbnail(lesson.video_url);
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`group w-full text-left border rounded-2xl overflow-hidden bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row ${
                  completed ? "border-primary/40" : ""
                }`}
              >
                <div className="relative w-full sm:w-56 aspect-video sm:aspect-auto sm:h-32 flex-shrink-0 bg-muted overflow-hidden">
                  {thumb ? (
                    <img src={thumb} alt={lesson.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                      <PlayCircle className="w-10 h-10 text-primary/50" strokeWidth={1.3} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 group-hover:bg-foreground/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-background/95 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                      <PlayCircle className="w-7 h-7 text-primary" strokeWidth={1.5} />
                    </div>
                  </div>
                  {lesson.duration_seconds && (
                    <span className="absolute bottom-1.5 right-1.5 bg-foreground/80 text-background text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {formatDuration(lesson.duration_seconds)}
                    </span>
                  )}
                  {completed && (
                    <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{lesson.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <LessonModal
        lesson={activeLesson}
        isCompleted={activeLesson ? completedIds.has(activeLesson.id) : false}
        playlistTitle={playlist.title}
        onClose={() => setActiveLesson(null)}
        onCompleted={handleCompleted}
      />
    </AppLayout>
  );
}
