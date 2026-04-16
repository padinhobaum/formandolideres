import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileDown, Printer, ThumbsUp, ThumbsDown, MessageSquare, BarChart3 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho", submitted: "Enviada", in_review: "Em análise",
  approved: "Aprovada", rejected: "Rejeitada", in_execution: "Em execução", completed: "Concluída",
};
const IMPACT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
const EFFORT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

interface ProposalReportProps {
  onBack: () => void;
}

export default function ProposalReport({ onBack }: ProposalReportProps) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [pRes, cRes] = await Promise.all([
        supabase.from("proposals").select("*").neq("status", "draft").order("vote_count", { ascending: false }),
        supabase.from("proposal_collaborators").select("*").eq("status", "accepted"),
      ]);
      if (pRes.data) setProposals(pRes.data);
      if (cRes.data) setCollaborators(cRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  const totalPositive = proposals.reduce((s, p) => s + (p.positive_vote_count ?? p.vote_count ?? 0), 0);
  const totalNegative = proposals.reduce((s, p) => s + (p.negative_vote_count ?? 0), 0);
  const totalComments = proposals.reduce((s, p) => s + (p.comment_count ?? 0), 0);

  // Category distribution
  const categories = [...new Set(proposals.map(p => p.category))];
  const catData = categories.map(c => ({
    name: c,
    count: proposals.filter(p => p.category === c).length,
  })).sort((a, b) => b.count - a.count);
  const maxCatCount = Math.max(...catData.map(c => c.count), 1);

  // Impact/effort distribution
  const impactDist = ["baixo", "medio", "alto"].map(level => ({
    label: IMPACT_LABELS[level],
    count: proposals.filter(p => p.expected_impact === level).length,
  }));
  const effortDist = ["baixo", "medio", "alto"].map(level => ({
    label: EFFORT_LABELS[level],
    count: proposals.filter(p => p.estimated_effort === level).length,
  }));

  // Top voted and most rejected
  const topVoted = [...proposals].sort((a, b) =>
    ((b.positive_vote_count ?? b.vote_count ?? 0) - (b.negative_vote_count ?? 0)) -
    ((a.positive_vote_count ?? a.vote_count ?? 0) - (a.negative_vote_count ?? 0))
  ).slice(0, 5);
  const mostRejected = [...proposals].filter(p => (p.negative_vote_count ?? 0) > 0)
    .sort((a, b) => (b.negative_vote_count ?? 0) - (a.negative_vote_count ?? 0)).slice(0, 5);
  const mostEngaged = [...proposals].sort((a, b) =>
    ((b.positive_vote_count ?? b.vote_count ?? 0) + (b.negative_vote_count ?? 0) + (b.comment_count ?? 0)) -
    ((a.positive_vote_count ?? a.vote_count ?? 0) + (a.negative_vote_count ?? 0) + (a.comment_count ?? 0))
  ).slice(0, 5);

  const getCollaborators = (proposalId: string) =>
    collaborators.filter(c => c.proposal_id === proposalId);

  return (
    <div className="space-y-4">
      {/* Actions bar (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 rounded-xl">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Report content */}
      <div ref={printRef} className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="text-center border-b pb-4">
          <div className="flex items-center justify-center gap-4 mb-3 flex-wrap">
            <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-10 object-contain" />
          </div>
          <h1 className="font-heading font-bold text-xl sm:text-2xl">Relatório de Propostas — Edital</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total de Propostas" value={proposals.length} />
              <StatCard label="Votos Positivos" value={totalPositive} icon={<ThumbsUp className="w-4 h-4 text-primary" />} />
              <StatCard label="Votos Negativos" value={totalNegative} icon={<ThumbsDown className="w-4 h-4 text-destructive" />} />
              <StatCard label="Comentários" value={totalComments} icon={<MessageSquare className="w-4 h-4 text-muted-foreground" />} />
            </div>
          </CardContent>
        </Card>

        {/* Category distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {catData.map(c => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs w-28 text-right font-medium truncate">{c.name}</span>
                  <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${(c.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold w-6 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Impact & Effort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Nível de Impacto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {impactDist.map(d => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <span>{d.label}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Nível de Esforço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {effortDist.map(d => (
                  <div key={d.label} className="flex items-center justify-between text-sm">
                    <span>{d.label}</span>
                    <Badge variant="secondary">{d.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top voted */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">🏆 Propostas Mais Votadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topVoted.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                  <span className="text-lg font-bold text-primary w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Score: {(p.positive_vote_count ?? p.vote_count ?? 0) - (p.negative_vote_count ?? 0)} · {p.author_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most rejected */}
        {mostRejected.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">👎 Propostas com Mais Votos Negativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mostRejected.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-destructive/5">
                    <span className="text-lg font-bold text-destructive w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.negative_vote_count} votos negativos · {p.author_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Most engaged */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">🔥 Propostas Mais Engajadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mostEngaged.map((p, i) => {
                const engagement = (p.positive_vote_count ?? p.vote_count ?? 0) + (p.negative_vote_count ?? 0) + (p.comment_count ?? 0);
                return (
                  <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                    <span className="text-lg font-bold text-accent w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{engagement} interações · {p.author_name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Full list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">📋 Lista Completa de Propostas</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2 font-semibold">#</th>
                  <th className="py-2 pr-2 font-semibold">Título</th>
                  <th className="py-2 pr-2 font-semibold">Autor</th>
                  <th className="py-2 pr-2 font-semibold">Categoria</th>
                  <th className="py-2 pr-2 font-semibold">Impacto</th>
                  <th className="py-2 pr-2 font-semibold">Esforço</th>
                  <th className="py-2 pr-2 font-semibold text-center">👍</th>
                  <th className="py-2 pr-2 font-semibold text-center">👎</th>
                  <th className="py-2 pr-2 font-semibold text-center">Score</th>
                  <th className="py-2 pr-2 font-semibold text-center">💬</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((p, i) => {
                  const pos = p.positive_vote_count ?? p.vote_count ?? 0;
                  const neg = p.negative_vote_count ?? 0;
                  const collabs = getCollaborators(p.id);
                  return (
                    <tr key={p.id} className="border-b border-secondary/50 hover:bg-secondary/30">
                      <td className="py-2 pr-2 font-medium">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <p className="font-medium truncate max-w-[200px]">{p.title}</p>
                        {collabs.length > 0 && (
                          <p className="text-muted-foreground">+{collabs.length} colab.</p>
                        )}
                      </td>
                      <td className="py-2 pr-2 truncate max-w-[100px]">{p.author_name}</td>
                      <td className="py-2 pr-2">{p.category}</td>
                      <td className="py-2 pr-2">{IMPACT_LABELS[p.expected_impact]}</td>
                      <td className="py-2 pr-2">{EFFORT_LABELS[p.estimated_effort]}</td>
                      <td className="py-2 pr-2 text-center text-primary font-medium">{pos}</td>
                      <td className="py-2 pr-2 text-center text-destructive font-medium">{neg}</td>
                      <td className="py-2 pr-2 text-center font-bold">{pos - neg}</td>
                      <td className="py-2 pr-2 text-center">{p.comment_count}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-[10px]">
                          {STATUS_LABELS[p.status] || p.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-4 print:mt-8">
          <p>Relatório gerado automaticamente pelo sistema Formando Líderes</p>
          <p>© {new Date().getFullYear()} Formando Líderes – Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="bg-secondary rounded-xl p-3 text-center">
      {icon && <div className="flex justify-center mb-1">{icon}</div>}
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
