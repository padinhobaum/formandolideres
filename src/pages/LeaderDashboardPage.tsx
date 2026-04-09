import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Star, MessageSquare, Users, ThumbsUp } from "lucide-react";

const PIE_COLORS = ["hsl(145, 65%, 40%)", "hsl(1, 79%, 55%)"];

export default function LeaderDashboardPage() {
  const { user, profile } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("");
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get surveys this leader is associated with and results are released
      const { data: leaderSurveys } = await supabase
        .from("survey_leaders")
        .select("survey_id, surveys(id, title, bimester, results_released)")
        .eq("leader_user_id", user.id);

      const released = (leaderSurveys || [])
        .filter((ls: any) => ls.surveys?.results_released)
        .map((ls: any) => ls.surveys);

      setSurveys(released);
      if (released.length > 0) {
        setSelectedSurveyId(released[0].id);
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedSurveyId) { setResponses([]); return; }
    supabase
      .from("survey_responses")
      .select("score_general, score_communication, contributes_environment, keeps_informed, opens_space, comments")
      .eq("survey_id", selectedSurveyId)
      .then(({ data }) => setResponses((data as any[]) || []));
  }, [selectedSurveyId]);

  const selectedSurvey = surveys.find((s: any) => s.id === selectedSurveyId);
  const totalResponses = responses.length;

  const avgGeneral = totalResponses > 0 ? responses.reduce((s, r) => s + r.score_general, 0) / totalResponses : 0;
  const avgCommunication = totalResponses > 0 ? responses.reduce((s, r) => s + r.score_communication, 0) / totalResponses : 0;
  const pctEnvironment = totalResponses > 0 ? (responses.filter(r => r.contributes_environment).length / totalResponses) * 100 : 0;
  const pctInformed = totalResponses > 0 ? (responses.filter(r => r.keeps_informed).length / totalResponses) * 100 : 0;
  const pctSpace = totalResponses > 0 ? (responses.filter(r => r.opens_space).length / totalResponses) * 100 : 0;

  const barData = [
    { name: "Nota Geral", value: +avgGeneral.toFixed(1) },
    { name: "Comunicação", value: +avgCommunication.toFixed(1) },
  ];

  const makePieData = (pct: number) => [
    { name: "Sim", value: +pct.toFixed(1) },
    { name: "Não", value: +(100 - pct).toFixed(1) },
  ];

  const commentsFiltered = responses.filter(r => r.comments?.trim()).map(r => r.comments);

  // Insights
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (avgGeneral >= 7) strengths.push("Boa avaliação geral dos alunos");
  else improvements.push("Busque melhorar a percepção geral da turma sobre sua atuação");
  if (avgCommunication >= 7) strengths.push("Comunicação bem avaliada");
  else improvements.push("Invista em melhorar a comunicação com a turma");
  if (pctEnvironment >= 70) strengths.push("Contribui para um ambiente agradável");
  else improvements.push("Trabalhe para criar um ambiente mais acolhedor");
  if (pctInformed >= 70) strengths.push("Mantém a turma bem informada");
  else improvements.push("Compartilhe mais informações sobre eventos do colégio");
  if (pctSpace >= 70) strengths.push("Abre espaço para demandas dos colegas");
  else improvements.push("Crie mais oportunidades para ouvir os colegas");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
              {(profile?.full_name || "L").split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-heading font-bold text-foreground">{profile?.full_name}</h1>
            <p className="text-sm text-muted-foreground">Resultados | Pesquisa de Opinião | Líderes de Sala</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-10">Carregando...</p>
        ) : surveys.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground">Nenhuma pesquisa com resultados liberados no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Bimester filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {surveys.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSurveyId(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedSurveyId === s.id
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {s.bimester}º Bimestre
                </button>
              ))}
            </div>

            {selectedSurvey && totalResponses > 0 && (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <KpiCard icon={Users} label="Respostas" value={totalResponses.toString()} />
                  <KpiCard icon={Star} label="Nota Geral" value={avgGeneral.toFixed(1)} color={avgGeneral >= 7 ? "text-green-600" : "text-amber-600"} />
                  <KpiCard icon={MessageSquare} label="Comunicação" value={avgCommunication.toFixed(1)} color={avgCommunication >= 7 ? "text-green-600" : "text-amber-600"} />
                  <KpiCard icon={ThumbsUp} label="Aprovação" value={`${pctEnvironment.toFixed(0)}%`} color={pctEnvironment >= 70 ? "text-green-600" : "text-amber-600"} />
                </div>

                {/* Charts */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-heading">Notas Médias</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(207, 100%, 27%)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-heading">Ambiente Agradável</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-52 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={makePieData(pctEnvironment)} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                              {makePieData(pctEnvironment).map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Yes/No breakdown */}
                <div className="grid sm:grid-cols-3 gap-3 mb-6">
                  <YesNoCard label="Contribuem p/ ambiente agradável" pct={pctEnvironment} />
                  <YesNoCard label="Mantêm a classe informada" pct={pctInformed} />
                  <YesNoCard label="Abrem espaço p/ demandas" pct={pctSpace} />
                </div>

                {/* Insights */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-heading flex items-center gap-2 text-green-700">
                        <TrendingUp className="w-4 h-4" /> Pontos Fortes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {strengths.map((s, i) => (
                          <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                        {strengths.length === 0 && <li className="text-sm text-green-700 opacity-60">Nenhum destaque positivo neste período.</li>}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-heading flex items-center gap-2 text-amber-700">
                        <TrendingDown className="w-4 h-4" /> Pontos de Melhoria
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {improvements.map((s, i) => (
                          <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                        {improvements.length === 0 && <li className="text-sm text-amber-700 opacity-60">Excelente! Nenhum ponto crítico.</li>}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Comments */}
                {commentsFiltered.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-heading">Comentários dos Alunos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {commentsFiltered.map((c, i) => (
                          <div key={i} className="bg-secondary/50 rounded-lg p-3 text-sm text-foreground">
                            "{c}"
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Footer message */}
                <div className="text-center py-6 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    Caso os resultados não tenham lhe agradado, procure pela Orientação Educacional e trace um novo plano de ação.
                  </p>
                </div>
              </>
            )}

            {selectedSurvey && totalResponses === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">Nenhuma resposta registrada para esta pesquisa ainda.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function KpiCard({ icon: Icon, label, value, color = "text-foreground" }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function YesNoCard({ label, pct }: { label: string; pct: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-bold text-foreground">{pct.toFixed(0)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
