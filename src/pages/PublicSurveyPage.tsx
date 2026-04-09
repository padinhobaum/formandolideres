import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  bimester: number;
  is_active: boolean;
}

export default function PublicSurveyPage() {
  const { code } = useParams<{ code: string }>();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentRm, setStudentRm] = useState("");
  const [scoreGeneral, setScoreGeneral] = useState<number | null>(null);
  const [scoreCommunication, setScoreCommunication] = useState<number | null>(null);
  const [contributesEnvironment, setContributesEnvironment] = useState<boolean | null>(null);
  const [keepsInformed, setKeepsInformed] = useState<boolean | null>(null);
  const [opensSpace, setOpensSpace] = useState<boolean | null>(null);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!code) return;
    supabase
      .from("surveys")
      .select("id, title, description, bimester, is_active")
      .eq("short_code", code)
      .maybeSingle()
      .then(({ data }) => {
        setSurvey(data as SurveyData | null);
        setLoading(false);
      });
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || scoreGeneral === null || scoreCommunication === null || contributesEnvironment === null || keepsInformed === null || opensSpace === null) {
      toast.error("Por favor, responda todas as perguntas obrigatórias.");
      return;
    }
    if (!studentName.trim() || !studentRm.trim()) {
      toast.error("Preencha seu nome e RM.");
      return;
    }
    if (!/^\d+$/.test(studentRm.trim())) {
      toast.error("O RM deve conter apenas números.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("survey_responses").insert({
      survey_id: survey.id,
      student_name: studentName.trim(),
      student_rm: studentRm.trim(),
      score_general: scoreGeneral,
      score_communication: scoreCommunication,
      contributes_environment: contributesEnvironment,
      keeps_informed: keepsInformed,
      opens_space: opensSpace,
      comments: comments.trim() || null,
    } as any);
    setSubmitting(false);

    if (error) {
      toast.error("Erro ao enviar resposta. Tente novamente.");
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-pulse text-muted-foreground">Carregando pesquisa...</div>
      </div>
    );
  }

  if (!survey || !survey.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="text-center max-w-md">
          <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-12 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">Pesquisa não encontrada</h1>
          <p className="text-gray-500 text-sm">Esta pesquisa não existe ou não está mais ativa.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Obrigado!</h1>
          <p className="text-gray-500">Sua resposta foi enviada com sucesso. Agradecemos sua participação!</p>
          <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-10 mx-auto mt-6 opacity-60" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-lg mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-12 mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{survey.title}</h1>
          {survey.description && <p className="text-sm text-gray-500 mt-1">{survey.description}</p>}
          <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {survey.bimester}º Bimestre
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-center">
          <p className="text-sm text-amber-800 font-medium">
            Responda com seriedade. Sua opinião é fundamental para a melhoria da liderança da sua turma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student info */}
          <SurveySection number={1} title="Nome do Aluno">
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Digite seu nome completo" required className="bg-white" />
          </SurveySection>

          <SurveySection number={2} title="Número de Matrícula (RM)">
            <Input value={studentRm} onChange={(e) => setStudentRm(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 12345" required inputMode="numeric" pattern="\d+" className="bg-white" />
          </SurveySection>

          {/* Score General */}
          <SurveySection number={3} title="Em uma escala de 0 a 10, qual nota você dá aos seus Líderes de Classe?">
            <ScoreBubbles value={scoreGeneral} onChange={setScoreGeneral} />
          </SurveySection>

          {/* Score Communication */}
          <SurveySection number={4} title="Em uma escala de 0 a 10, qual nota você dá para a comunicação dos seus Líderes de Classe?">
            <ScoreBubbles value={scoreCommunication} onChange={setScoreCommunication} />
          </SurveySection>

          {/* Yes/No questions */}
          <SurveySection number={5} title="De uma forma geral, você acredita que seus Líderes contribuem para um ambiente agradável dentro da sala de aula?">
            <YesNoButtons value={contributesEnvironment} onChange={setContributesEnvironment} />
          </SurveySection>

          <SurveySection number={6} title="Seus Líderes mantêm a classe informada dos eventos propostos pelo colégio?">
            <YesNoButtons value={keepsInformed} onChange={setKeepsInformed} />
          </SurveySection>

          <SurveySection number={7} title="Seus Líderes abrem espaço para que você leve até eles suas demandas?">
            <YesNoButtons value={opensSpace} onChange={setOpensSpace} />
          </SurveySection>

          {/* Comments */}
          <SurveySection number={8} title="Comentários, sugestões, elogios ou reclamações" optional>
            <Textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Escreva aqui... (opcional)" className="bg-white min-h-[80px]" />
          </SurveySection>

          <Button type="submit" disabled={submitting} className="w-full h-12 text-base gap-2 rounded-xl bg-[hsl(207,100%,27%)] hover:bg-[hsl(207,100%,22%)]">
            <Send className="w-4 h-4" />
            {submitting ? "Enviando..." : "Enviar Resposta"}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Formando Líderes – Seus dados são tratados com confidencialidade.
        </p>
      </div>
    </div>
  );
}

function SurveySection({ number, title, children, optional }: { number: number; title: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[hsl(207,100%,27%)] text-white text-xs font-bold mr-2">{number}</span>
        {title}
        {optional && <span className="text-gray-400 font-normal ml-1">(opcional)</span>}
      </label>
      {children}
    </div>
  );
}

function ScoreBubbles({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`w-10 h-10 rounded-full text-sm font-bold transition-all duration-200 border-2 ${
            value === i
              ? "bg-[hsl(207,100%,27%)] text-white border-[hsl(207,100%,27%)] scale-110 shadow-lg"
              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[hsl(207,100%,40%)] hover:bg-blue-50"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

function YesNoButtons({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
          value === true
            ? "bg-green-500 text-white border-green-500 shadow-md"
            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-300 hover:bg-green-50"
        }`}
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
          value === false
            ? "bg-red-500 text-white border-red-500 shadow-md"
            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-red-300 hover:bg-red-50"
        }`}
      >
        Não
      </button>
    </div>
  );
}
