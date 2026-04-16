import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { ToggleLeft, ToggleRight, Settings2, FileDown } from "lucide-react";
import ProposalReport from "@/components/proposals/ProposalReport";

const PHASES = [
  { value: "submission", label: "Submissão", desc: "Líderes podem criar e enviar propostas" },
  { value: "discussion", label: "Discussão", desc: "Propostas abertas para comentários" },
  { value: "voting", label: "Votação", desc: "Líderes podem votar nas propostas" },
  { value: "selection", label: "Seleção", desc: "Admin seleciona as melhores propostas" },
  { value: "direction", label: "Encaminhamento", desc: "Propostas enviadas para a Direção" },
];

export default function AdminEdital() {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, submitted: 0, approved: 0 });
  const [showReport, setShowReport] = useState(false);

  const fetchConfig = async () => {
    const { data } = await supabase.from("edital_config").select("*").limit(1).maybeSingle();
    if (data) setConfig(data);
  };

  const fetchStats = async () => {
    const { data } = await supabase.from("proposals").select("status");
    if (data) {
      setStats({
        total: data.length,
        submitted: data.filter((p: any) => p.status === "submitted").length,
        approved: data.filter((p: any) => p.status === "approved").length,
      });
    }
  };

  useEffect(() => { fetchConfig(); fetchStats(); }, []);

  const toggleActive = async () => {
    if (!config) return;
    setLoading(true);
    const newActive = !config.is_active;
    await supabase.from("edital_config").update({
      is_active: newActive,
      updated_by: user!.id,
      updated_at: new Date().toISOString(),
    } as any).eq("id", config.id);

    await sendPushNotification({
      title: newActive ? "📋 Edital de Propostas Aberto!" : "📋 Edital Encerrado",
      body: newActive
        ? "O Edital de Propostas foi aberto! Envie suas ideias 🚀"
        : "O Edital foi encerrado. Em breve, resultados.",
      url: "/propostas",
      contentType: "notice",
      referenceId: config.id,
    });

    toast.success(newActive ? "Edital ativado!" : "Edital desativado.");
    setLoading(false);
    fetchConfig();
  };

  const changePhase = async (phase: string) => {
    if (!config) return;
    await supabase.from("edital_config").update({
      current_phase: phase,
      updated_by: user!.id,
      updated_at: new Date().toISOString(),
    } as any).eq("id", config.id);
    toast.success(`Fase alterada para: ${PHASES.find(p => p.value === phase)?.label}`);
    fetchConfig();
  };

  if (!config) return null;

  const currentPhase = PHASES.find(p => p.value === config.current_phase);

  if (showReport) {
    return <ProposalReport onBack={() => setShowReport(false)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Status do Edital
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${config.is_active ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="font-medium">{config.is_active ? "Ativo" : "Inativo"}</span>
              <Badge variant={config.is_active ? "default" : "secondary"}>
                {currentPhase?.label || config.current_phase}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReport(true)}
                className="gap-1.5"
              >
                <FileDown className="w-4 h-4" />
                Relatório
              </Button>
              <Button
                variant={config.is_active ? "destructive" : "default"}
                size="sm"
                onClick={toggleActive}
                disabled={loading}
                className="gap-1.5"
              >
                {config.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {config.is_active ? "Desativar" : "Ativar"}
              </Button>
            </div>
          </div>

          {config.is_active && (
            <div className="space-y-3 pt-2 border-t">
              <div>
                <Label className="text-sm">Fase atual</Label>
                <Select value={config.current_phase} onValueChange={changePhase}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHASES.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <div className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-xs text-muted-foreground">{p.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{stats.submitted}</p>
                  <p className="text-xs text-muted-foreground">Enviadas</p>
                </div>
                <div className="bg-secondary rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">Aprovadas</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {config.is_active && <DirectionDashboard />}
    </div>
  );
}

function DirectionDashboard() {
  const [proposals, setProposals] = useState<any[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    supabase
      .from("proposals")
      .select("*")
      .neq("status", "draft")
      .order("vote_count", { ascending: false })
      .limit(20)
      .then(({ data }) => { if (data) setProposals(data); });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("proposals").update({ status } as any).eq("id", id);
    toast.success("Status atualizado!");
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const categories = [...new Set(proposals.map(p => p.category))];
  const catCounts = categories.map(c => ({ cat: c, count: proposals.filter(p => p.category === c).length }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          📊 Dashboard da Direção
          <Badge variant="outline" className="text-[10px]">Fornecido pela LíderAI</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Por Categoria</p>
          <div className="flex flex-wrap gap-2">
            {catCounts.map(c => (
              <Badge key={c.cat} variant="secondary">{c.cat}: {c.count}</Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top Propostas</p>
          <div className="space-y-2">
            {proposals.slice(0, 10).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <span className="text-lg font-bold text-primary w-6">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    👍 {p.positive_vote_count ?? p.vote_count} · 👎 {p.negative_vote_count ?? 0} · 💬 {p.comment_count}
                  </p>
                </div>
                <Select value={p.status} onValueChange={(v) => updateStatus(p.id, v)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Enviada</SelectItem>
                    <SelectItem value="in_review">Em análise</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                    <SelectItem value="in_execution">Em execução</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
