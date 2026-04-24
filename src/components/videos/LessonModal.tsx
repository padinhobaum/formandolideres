import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2, Trophy, Zap, X, Flame, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getYouTubeEmbed } from "@/lib/youtube";
import { type VideoLesson } from "@/hooks/useVideoLessons";
import VideoComments from "./VideoComments";
import Confetti from "./Confetti";

export interface CompletionResult {
  already_completed: boolean;
  xp_total?: number;
  xp_lesson?: number;
  xp_daily_bonus?: number;
  xp_streak_bonus?: number;
  xp_achievement_bonus?: number;
  current_streak?: number;
  new_achievements?: string[];
}

interface Props {
  lesson: VideoLesson | null;
  isCompleted: boolean;
  playlistTitle: string;
  onClose: () => void;
  onCompleted: (r: CompletionResult) => void;
}

export default function LessonModal({ lesson, isCompleted, playlistTitle, onClose, onCompleted }: Props) {
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!lesson) {
      setResult(null);
      setShowConfetti(false);
    }
  }, [lesson]);

  if (!lesson) return null;
  const embed = getYouTubeEmbed(lesson.video_url);

  const handleComplete = async () => {
    if (isCompleted || completing) return;
    setCompleting(true);
    const { data, error } = await supabase.rpc("complete_video_lesson", { _lesson_id: lesson.id });
    setCompleting(false);
    if (error) {
      toast.error("Erro ao registrar conclusão.");
      return;
    }
    const r = data as unknown as CompletionResult;
    setResult(r);
    if (!r.already_completed) {
      setShowConfetti(true);
      toast.success(`+${r.xp_total} XP conquistados!`, {
        description: r.new_achievements && r.new_achievements.length > 0 ? "🏆 Nova conquista desbloqueada!" : undefined,
      });
      onCompleted(r);
    }
  };

  return (
    <>
      <Confetti active={showConfetti} />
      <Dialog open={!!lesson} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] gap-0 flex flex-col">
          {/* Custom close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-foreground/70 hover:bg-foreground text-background flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="overflow-y-auto flex-1">
            {/* Video */}
            <div className="bg-black aspect-video">
              {embed ? (
                <iframe
                  src={`${embed}?rel=0&modestbranding=1`}
                  title={lesson.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-background/70 text-sm">
                  Vídeo indisponível
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">
                {playlistTitle}
              </p>
              <h2 className="font-heading font-bold text-xl sm:text-2xl text-foreground">{lesson.title}</h2>
              {lesson.description && (
                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{lesson.description}</p>
              )}

              {/* Reward feedback */}
              {result && !result.already_completed && (
                <div className="mt-4 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <p className="font-heading font-bold text-base text-foreground">Aula concluída! 🎉</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                    <RewardChip icon={Zap} label="Aula" value={result.xp_lesson} />
                    {result.xp_daily_bonus ? <RewardChip icon={Flame} label="Bônus diário" value={result.xp_daily_bonus} /> : null}
                    {result.xp_streak_bonus ? <RewardChip icon={Flame} label="Streak" value={result.xp_streak_bonus} /> : null}
                    {result.xp_achievement_bonus ? <RewardChip icon={Award} label="Conquista" value={result.xp_achievement_bonus} /> : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Total: <span className="font-bold text-foreground">+{result.xp_total} XP</span>
                    {result.current_streak ? ` · Sequência: ${result.current_streak} ${result.current_streak === 1 ? "dia" : "dias"} 🔥` : ""}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-col sm:flex-row gap-2">
                {isCompleted || result?.already_completed ? (
                  <Button disabled variant="outline" className="gap-2 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Já concluída
                  </Button>
                ) : (
                  <Button
                    onClick={handleComplete}
                    disabled={completing || !!result}
                    className="gap-2 rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md"
                  >
                    {completing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {result ? "Concluída ✓" : `Concluir aula (+${lesson.xp_reward} XP)`}
                  </Button>
                )}
                {lesson.extra_material_url && (
                  <a
                    href={lesson.extra_material_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-full border bg-card hover:bg-secondary transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Material complementar
                  </a>
                )}
              </div>

              {/* Comments */}
              <div className="mt-6 pt-6 border-t">
                <VideoComments lessonId={lesson.id} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RewardChip({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="bg-card border rounded-xl p-2.5 flex items-center gap-2">
      <Icon className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">{label}</p>
        <p className="font-heading font-bold text-sm text-foreground leading-tight">+{value}</p>
      </div>
    </div>
  );
}
