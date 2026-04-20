import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const MOODS = [
  { score: 1, emoji: "😢", label: "Muito ruim", color: "from-red-500/20 to-red-500/5", ring: "ring-red-500", text: "text-red-600" },
  { score: 2, emoji: "😕", label: "Ruim", color: "from-orange-500/20 to-orange-500/5", ring: "ring-orange-500", text: "text-orange-600" },
  { score: 3, emoji: "😐", label: "Neutro", color: "from-yellow-500/20 to-yellow-500/5", ring: "ring-yellow-500", text: "text-yellow-600" },
  { score: 4, emoji: "🙂", label: "Bom", color: "from-lime-500/20 to-lime-500/5", ring: "ring-lime-500", text: "text-lime-600" },
  { score: 5, emoji: "😄", label: "Ótimo", color: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-500", text: "text-emerald-600" },
];

function getWeekStartISO(d: Date = new Date()): string {
  const day = d.getDay(); // 0 = Sun
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

function getWeekRangeLabel(): string {
  const start = new Date();
  const day = start.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function ClassClimateCard() {
  const { user, profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [existing, setExisting] = useState<any | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const week = getWeekStartISO();
      const { data } = await supabase
        .from("class_climate_responses")
        .select("*")
        .eq("user_id", user.id)
        .eq("week_start", week)
        .maybeSingle();
      if (!cancelled) {
        setExisting(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleSubmit = async () => {
    if (!user || !selected) return;
    if (!profile?.class_name) {
      toast.error("Sua sala não está definida no perfil. Entre em contato com a coordenação.");
      return;
    }
    setSubmitting(true);
    const week = getWeekStartISO();
    const { data, error } = await supabase
      .from("class_climate_responses")
      .insert({
        user_id: user.id,
        class_name: profile.class_name,
        mood_score: selected,
        comment: comment.trim() || null,
        week_start: week,
      } as any)
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      if ((error as any).code === "23505") {
        toast.error("Você já enviou sua resposta esta semana.");
        setExisting({ mood_score: selected, comment, week_start: week });
        return;
      }
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    toast.success("Obrigado! Sua resposta foi registrada 💚");
    setExisting(data);
  };

  if (isAdmin) return null; // Admins não respondem

  if (loading) {
    return (
      <div className="rounded-2xl border bg-card p-5 animate-pulse h-44 mb-8" />
    );
  }

  // Já respondeu esta semana
  if (existing) {
    const mood = MOODS.find(m => m.score === existing.mood_score) || MOODS[2];
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 mb-8",
        mood.color,
      )}>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-foreground/5 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="text-6xl drop-shadow-sm" aria-hidden>{mood.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">
              Clima desta semana ({getWeekRangeLabel()})
            </p>
            <p className={cn("font-heading font-bold text-xl", mood.text)}>
              Você marcou: {mood.label}
            </p>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Você já participou! Volte na próxima semana 🌟
            </p>
            {existing.comment && (
              <p className="text-sm italic mt-2 bg-card/60 backdrop-blur-sm rounded-lg p-2 border">
                "{existing.comment}"
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Pode responder
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-card to-accent/5 p-5 sm:p-6 mb-8">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-primary" fill="currentColor" />
          <p className="text-xs uppercase font-bold tracking-wider text-primary">
            Clima da Turma · {getWeekRangeLabel()}
          </p>
        </div>
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground mb-1">
          Como está o clima da sua sala esta semana?
        </h3>
        <p className="text-sm text-muted-foreground mb-5">
          Sua resposta é confidencial e ajuda a coordenação a entender melhor cada turma. Você pode responder uma vez por semana.
        </p>

        {/* Emoji scale */}
        <div className="flex items-center justify-between gap-1 sm:gap-3 mb-4">
          {MOODS.map((m) => {
            const isSel = selected === m.score;
            return (
              <button
                key={m.score}
                type="button"
                onClick={() => setSelected(m.score)}
                aria-label={m.label}
                className={cn(
                  "group flex-1 flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-2xl transition-all duration-200",
                  "hover:bg-card hover:scale-110 hover:shadow-md",
                  isSel && cn("bg-card shadow-lg scale-110 ring-2", m.ring),
                )}
              >
                <span className={cn(
                  "text-3xl sm:text-4xl transition-transform duration-200",
                  isSel ? "scale-125" : "grayscale-[40%] group-hover:grayscale-0",
                )}>
                  {m.emoji}
                </span>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium transition-colors",
                  isSel ? m.text : "text-muted-foreground",
                )}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="space-y-3 animate-fade-in">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 280))}
              placeholder="Quer comentar algo? (opcional)"
              className="rounded-xl resize-none bg-card/80 backdrop-blur-sm"
              rows={2}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">{comment.length}/280</span>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl gap-1.5 shadow-md"
              >
                {submitting ? "Enviando..." : "Enviar resposta"}
                {!submitting && <Sparkles className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
