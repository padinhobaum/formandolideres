import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, QrCode, Link2, Eye, EyeOff, Download, Users, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BIMESTERS = [1, 2, 3, 4] as const;

export default function AdminSurveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bimester, setBimester] = useState<number>(1);
  const [creating, setCreating] = useState(false);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null);
  const [surveyLeaders, setSurveyLeaders] = useState<Record<string, string[]>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAll = async () => {
    const [surveysRes, leadersRes] = await Promise.all([
      supabase.from("surveys").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, avatar_url").then(async (profilesRes) => {
        if (!profilesRes.data) return [];
        const { data: roles } = await supabase.from("user_roles").select("user_id, role").eq("role", "leader");
        const leaderIds = new Set((roles || []).map((r: any) => r.user_id));
        return profilesRes.data.filter((p: any) => leaderIds.has(p.user_id));
      }),
    ]);
    if (surveysRes.data) setSurveys(surveysRes.data);
    setLeaders(leadersRes);

    // Fetch leader associations
    if (surveysRes.data && surveysRes.data.length > 0) {
      const { data: slData } = await supabase.from("survey_leaders").select("survey_id, leader_user_id");
      const map: Record<string, string[]> = {};
      (slData || []).forEach((sl: any) => {
        if (!map[sl.survey_id]) map[sl.survey_id] = [];
        map[sl.survey_id].push(sl.leader_user_id);
      });
      setSurveyLeaders(map);
    }

    // Fetch response counts
    if (surveysRes.data) {
      const counts: Record<string, number> = {};
      for (const s of surveysRes.data) {
        const { count } = await supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", s.id);
        counts[s.id] = count || 0;
      }
      setResponseCounts(counts);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("surveys").insert({
      title: title.trim(),
      description: description.trim() || null,
      bimester,
      created_by: user!.id,
    } as any);
    setCreating(false);
    if (error) { toast.error("Erro ao criar pesquisa."); return; }
    toast.success("Pesquisa criada!");
    setTitle(""); setDescription(""); setBimester(1);
    fetchAll();
  };

  const toggleResults = async (surveyId: string, current: boolean) => {
    const { error } = await supabase.from("surveys").update({ results_released: !current } as any).eq("id", surveyId);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success(!current ? "Resultados liberados!" : "Resultados ocultados.");
    fetchAll();
  };

  const toggleActive = async (surveyId: string, current: boolean) => {
    const { error } = await supabase.from("surveys").update({ is_active: !current } as any).eq("id", surveyId);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success(!current ? "Pesquisa ativada." : "Pesquisa desativada.");
    fetchAll();
  };

  const deleteSurvey = async (surveyId: string) => {
    const { error } = await supabase.from("surveys").delete().eq("id", surveyId);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Pesquisa excluída.");
    fetchAll();
  };

  const toggleLeader = async (surveyId: string, leaderId: string) => {
    const current = surveyLeaders[surveyId] || [];
    if (current.includes(leaderId)) {
      await supabase.from("survey_leaders").delete().eq("survey_id", surveyId).eq("leader_user_id", leaderId);
    } else {
      await supabase.from("survey_leaders").insert({ survey_id: surveyId, leader_user_id: leaderId } as any);
    }
    fetchAll();
  };

  const exportCsv = async (surveyId: string, surveyTitle: string) => {
    const { data } = await supabase.from("survey_responses").select("*").eq("survey_id", surveyId);
    if (!data || data.length === 0) { toast.error("Nenhuma resposta para exportar."); return; }
    const headers = ["student_name", "student_rm", "score_general", "score_communication", "contributes_environment", "keeps_informed", "opens_space", "comments", "created_at"];
    const csvRows = [headers.join(",")];
    data.forEach((r: any) => {
      csvRows.push(headers.map(h => {
        const val = r[h];
        if (typeof val === "boolean") return val ? "Sim" : "Não";
        if (typeof val === "string" && val.includes(",")) return `"${val}"`;
        return val ?? "";
      }).join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pesquisa-${surveyTitle.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado!");
  };

  const getSurveyUrl = (shortCode: string) => `${window.location.origin}/pesquisa/${shortCode}`;

  const copyLink = (shortCode: string, surveyId: string) => {
    navigator.clipboard.writeText(getSurveyUrl(shortCode));
    setCopiedId(surveyId);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* Create form */}
      <Card className="mb-6 border-dashed border-primary/20 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Nova Pesquisa de Opinião
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-sm">Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pesquisa de Opinião - 1º Bimestre" required className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Descrição (opcional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrição..." className="mt-1" />
            </div>
            <div>
              <Label className="text-sm">Bimestre</Label>
              <div className="flex gap-2 mt-1">
                {BIMESTERS.map(b => (
                  <button key={b} type="button" onClick={() => setBimester(b)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bimester === b ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                    {b}º
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" size="sm" disabled={creating} className="gap-1.5">
              <Plus className="w-4 h-4" /> {creating ? "Criando..." : "Criar Pesquisa"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {surveys.map((s: any) => (
          <Card key={s.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-semibold text-sm">{s.title}</h3>
                    <Badge variant="outline" className="text-[10px]">{s.bimester}º Bimestre</Badge>
                    {s.is_active ? <Badge className="bg-green-100 text-green-700 text-[10px]">Ativa</Badge> : <Badge variant="secondary" className="text-[10px]">Inativa</Badge>}
                    {s.results_released && <Badge className="bg-blue-100 text-blue-700 text-[10px]">Resultados liberados</Badge>}
                  </div>
                  {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    <Users className="w-3 h-3 inline mr-1" />{responseCounts[s.id] || 0} respostas
                    {(surveyLeaders[s.id] || []).length > 0 && <> · {(surveyLeaders[s.id] || []).length} líder(es)</>}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Copy link */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyLink(s.short_code, s.id)}>
                    {copiedId === s.id ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
                  </Button>
                  {/* QR Code */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><QrCode className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs">
                      <DialogHeader>
                        <DialogTitle className="text-sm">QR Code da Pesquisa</DialogTitle>
                      </DialogHeader>
                      <div className="flex flex-col items-center gap-3 py-4">
                        <QRCodeSVG value={getSurveyUrl(s.short_code)} size={200} />
                        <p className="text-xs text-muted-foreground text-center break-all">{getSurveyUrl(s.short_code)}</p>
                        <Button size="sm" variant="outline" onClick={() => copyLink(s.short_code, s.id)} className="gap-1">
                          <Copy className="w-3 h-3" /> Copiar Link
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Toggle results */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleResults(s.id, s.results_released)}
                    title={s.results_released ? "Ocultar resultados" : "Liberar resultados"}>
                    {s.results_released ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  {/* Export CSV */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => exportCsv(s.id, s.title)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  {/* Toggle active */}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(s.id, s.is_active)}>
                    {s.is_active ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5 text-green-500" />}
                  </Button>
                  {/* Delete */}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSurvey(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Expand to manage leaders */}
              <button onClick={() => setExpandedSurvey(expandedSurvey === s.id ? null : s.id)}
                className="text-xs text-primary hover:underline mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" />
                {expandedSurvey === s.id ? "Ocultar líderes" : "Gerenciar líderes"}
              </button>

              {expandedSurvey === s.id && (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Associar líderes a esta pesquisa:</p>
                  {leaders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum líder cadastrado.</p>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {leaders.map((l: any) => {
                        const isAssociated = (surveyLeaders[s.id] || []).includes(l.user_id);
                        return (
                          <label key={l.user_id} className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-secondary/50">
                            <input type="checkbox" checked={isAssociated} onChange={() => toggleLeader(s.id, l.user_id)} />
                            <span>{l.full_name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {surveys.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma pesquisa criada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
