import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, Sparkles, ExternalLink, FileText, Trophy, Flame } from "lucide-react";
import { getYouTubeEmbed, formatDuration } from "@/lib/youtube";
import type { Lesson } from "@/hooks/useTracks";
import Confetti from "@/components/tracks/Confetti";

interface LessonModalProps {
  lesson: Lesson | null;
  isCompleted: boolean;
  trackTitle: string;
  onClose: () => void;
  onCompleted: (result: CompletionResult) => void;
}

export interface CompletionResult {
  xp_total: number;
  xp_lesson: number;
  xp_daily_bonus: number;
  xp_streak_bonus: number;
  xp_track_bonus: number;
  xp_achievement_bonus: number;
  current_streak: number;
  track_completed: boolean;
  new_achievements: string[];
}

const DIFFICULTY_LABEL: Record<string, string> = {
  simples: "Simples",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function LessonModal({ lesson, isCompleted, trackTitle, onClose, onCompleted }: LessonModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [reward, setReward] = useState<CompletionResult | null>(null);

  if (!lesson) return null;
  const embed = getYouTubeEmbed(lesson.video_url);

  const handleComplete = async () => {
    setSubmitting(true);
    const { data, error } = await supabase.rpc("complete_lesson" as any, { _lesson_id: lesson.id } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao concluir aula.");
      return;
    }
    const result = data as unknown as CompletionResult & { already_completed?: boolean };
    if (result?.already_completed) {
      toast.info("Você já concluiu esta aula.");
      onCompleted(result as CompletionResult);
      onClose();
      return;
    }
    setReward(result);
    setConfetti(true);
    onCompleted(result);
  };

  const handleClose = () => {
    setReward(null);
    setConfetti(false);
    onClose();
  };

  return (
    <>
      <Confetti active={confetti} />
      <Dialog open={!!lesson} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {reward ? (
            <CompletionScreen reward={reward} onClose={handleClose} />
          ) : (
            <div>
              {embed ? (
                <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
                  <iframe
                    src={embed}
                    title={lesson.title}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={lesson.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-muted p-12 text-primary hover:underline"
                >
                  <ExternalLink className="w-5 h-5" /> Abrir vídeo
                </a>
              )}

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-bold text-primary mb-1">{trackTitle}</p>
                  <h2 className="font-heading font-bold text-2xl text-foreground">{lesson.title}</h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-secondary font-medium">
                      {DIFFICULTY_LABEL[lesson.difficulty] || lesson.difficulty}
                    </span>
                    <span>+{lesson.xp_reward} XP</span>
                    {lesson.duration_seconds && <span>{formatDuration(lesson.duration_seconds)}</span>}
                  </div>
                </div>

                {lesson.description && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {lesson.description}
                  </p>
                )}

                {lesson.extra_material_url && (
                  <a
                    href={lesson.extra_material_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
                  >
                    <FileText className="w-4 h-4" /> Material complementar
                  </a>
                )}

                <div className="flex justify-end pt-2">
                  {isCompleted ? (
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-primary px-4 py-2 rounded-full bg-primary/10">
                      <Check className="w-4 h-4" /> Aula concluída
                    </div>
                  ) : (
                    <Button onClick={handleComplete} disabled={submitting} size="lg" className="gap-2">
                      <Check className="w-4 h-4" />
                      {submitting ? "Salvando..." : "Marcar como concluída"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const ACH_LABELS: Record<string, string> = {
  first_lesson: "🎯 Primeiro Passo",
  five_lessons: "🔥 Em Ritmo",
  first_track: "🗺️ Trilha Conquistada",
  streak_7_days: "📅 Constância de 7 dias",
};

function CompletionScreen({ reward, onClose }: { reward: CompletionResult; onClose: () => void }) {
  return (
    <div className="p-8 text-center space-y-5">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/30 animate-scale-in">
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </div>
      <div className="animate-fade-in">
        <h3 className="font-heading font-bold text-3xl text-foreground">Parabéns!</h3>
        <p className="text-muted-foreground mt-1">Você concluiu a aula 💪</p>
      </div>

      <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 space-y-2 text-left animate-fade-in">
        <RewardLine label={`Aula concluída`} xp={reward.xp_lesson} />
        {reward.xp_daily_bonus > 0 && <RewardLine label="🌅 Primeira aula do dia" xp={reward.xp_daily_bonus} />}
        {reward.xp_streak_bonus > 0 && (
          <RewardLine label={`🔥 Bônus de sequência (${reward.current_streak} dias)`} xp={reward.xp_streak_bonus} />
        )}
        {reward.xp_track_bonus > 0 && <RewardLine label="🏆 Trilha completa!" xp={reward.xp_track_bonus} />}
        {reward.xp_achievement_bonus > 0 && (
          <RewardLine label="🏅 Conquistas desbloqueadas" xp={reward.xp_achievement_bonus} />
        )}
        <div className="border-t pt-2 mt-2 flex items-center justify-between">
          <span className="font-heading font-bold">XP total</span>
          <span className="font-heading font-bold text-2xl text-primary">+{reward.xp_total}</span>
        </div>
      </div>

      {reward.new_achievements.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Conquistas</p>
          <div className="flex flex-wrap justify-center gap-2">
            {reward.new_achievements.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 bg-accent/10 text-accent border border-accent/30 px-3 py-1.5 rounded-full text-sm font-bold"
              >
                <Trophy className="w-3.5 h-3.5" /> {ACH_LABELS[a] || a}
              </span>
            ))}
          </div>
        </div>
      )}

      {reward.current_streak > 1 && (
        <div className="inline-flex items-center gap-2 text-sm text-orange-600 font-bold">
          <Flame className="w-4 h-4 fill-current" />
          Sequência de {reward.current_streak} dias!
        </div>
      )}

      <Button onClick={onClose} size="lg" className="w-full">
        Continuar
      </Button>
    </div>
  );
}

function RewardLine({ label, xp }: { label: string; xp: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span className="font-bold text-primary">+{xp} XP</span>
    </div>
  );
}
