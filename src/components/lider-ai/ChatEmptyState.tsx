import { Sparkles, MessageCircle, Users, Lightbulb, Calendar, Target } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SuggestionCard {
  icon: React.ElementType;
  text: string;
  color: string;
}

const SUGGESTIONS: SuggestionCard[] = [
  { icon: MessageCircle, text: "Como posso melhorar a comunicação com minha turma?", color: "text-blue-500" },
  { icon: Users, text: "Dicas para resolver conflitos entre alunos", color: "text-orange-500" },
  { icon: Lightbulb, text: "Como motivar colegas desmotivados?", color: "text-yellow-500" },
  { icon: Calendar, text: "Como organizar uma reunião de turma eficiente?", color: "text-purple-500" },
  { icon: Target, text: "Qual o papel do líder de classe?", color: "text-green-500" },
];

interface ChatEmptyStateProps {
  onSelectSuggestion: (text: string) => void;
}

export function ChatEmptyState({ onSelectSuggestion }: ChatEmptyStateProps) {
  const { profile } = useAuth();
  const firstName = profile?.full_name?.trim().split(" ")[0] || "";
  return (
    <div className="flex flex-col items-center justify-center min-h-full gap-8 md:gap-10 px-4 py-8 md:py-12">
      {/* Hero icon with glow */}
      <div className="relative animate-in zoom-in duration-500">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 blur-3xl scale-150 animate-pulse" />
        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
          <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-primary-foreground" />
        </div>
      </div>

      {/* Heading */}
      <div className="text-center space-y-3 max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        <h1 className="text-2xl md:text-4xl font-bold font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
          Olá{firstName ? `, ${firstName}` : ""}! Como posso te ajudar?
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed px-4">
          Sou a <span className="font-semibold text-foreground">LíderAI</span>, sua assistente de liderança de sala de aula. Faça uma pergunta ou escolha uma sugestão abaixo.
        </p>
      </div>

      {/* Suggestion cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.text}
              onClick={() => onSelectSuggestion(s.text)}
              className="group flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card hover:bg-accent/5 hover:border-primary/40 hover:shadow-md transition-all text-left"
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors leading-snug pt-1">
                {s.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
