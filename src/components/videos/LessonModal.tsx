import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getYouTubeEmbed } from "@/lib/youtube";
import { type VideoLesson } from "@/hooks/useVideoLessons";
import VideoComments from "./VideoComments";

export interface CompletionResult {
  already_completed: boolean;
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
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!lesson) setDone(false);
  }, [lesson]);

  if (!lesson) return null;
  const embed = getYouTubeEmbed(lesson.video_url);

  const handleComplete = async () => {
    if (isCompleted || completing || done) return;
    setCompleting(true);
    const { data, error } = await supabase.rpc("complete_video_lesson", { _lesson_id: lesson.id });
    setCompleting(false);
    if (error) {
      toast.error("Erro ao registrar conclusão.");
      return;
    }
    const r = data as unknown as CompletionResult;
    setDone(true);
    if (!r.already_completed) {
      toast.success("Aula concluída!");
      onCompleted(r);
    }
  };

  return (
    <Dialog open={!!lesson} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[92vh] gap-0 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-foreground/70 hover:bg-foreground text-background flex items-center justify-center transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto flex-1">
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

            <div className="mt-5 flex flex-col sm:flex-row gap-2">
              {isCompleted || done ? (
                <Button disabled variant="outline" className="gap-2 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Aula concluída
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={completing} className="gap-2 rounded-full">
                  {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Marcar como concluída
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

            <div className="mt-6 pt-6 border-t">
              <VideoComments lessonId={lesson.id} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
