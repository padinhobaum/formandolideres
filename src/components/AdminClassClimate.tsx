import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight, Printer, Download, Users, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOOD_META: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😢", label: "Muito ruim", color: "bg-red-500" },
  2: { emoji: "😕", label: "Ruim", color: "bg-orange-500" },
  3: { emoji: "😐", label: "Neutro", color: "bg-yellow-500" },
  4: { emoji: "🙂", label: "Bom", color: "bg-lime-500" },
  5: { emoji: "😄", label: "Ótimo", color: "bg-emerald-500" },
};

interface Response {
  id: string;
  user_id: string;
  class_name: string;
  mood_score: number;
  comment: string | null;
  week_start: string;
  created_at: string;
}

function isoWeekStart(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtRange(week: Date) {
  const end = new Date(week);
  end.setDate(week.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(week)} – ${fmt(end)} de ${end.getFullYear()}`;
}

function trendIcon(delta: number | null) {
  if (delta === null) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  if (delta > 0.1) return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (delta < -0.1) return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
  return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
}

export default function AdminClassClimate() {
  const [week, setWeek] = useState<Date>(() => isoWeekStart(new Date()));
  const [current, setCurrent] = useState<Response[]>([]);
  const [previous, setPrevious] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const prevWeek = new Date(week); prevWeek.setDate(week.getDate() - 7);
      const wIso = week.toISOString().slice(0, 10);
      const pIso = prevWeek.toISOString().slice(0, 10);
      const [cur, prev] = await Promise.all([
        supabase.from("class_climate_responses").select("*").eq("week_start", wIso),
        supabase.from("class_climate_responses").select("*").eq("week_start", pIso),
      ]);
      if (!cancelled) {
        setCurrent((cur.data || []) as Response[]);
        setPrevious((prev.data || []) as Response[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [week]);

  const stats = useMemo(() => {
    const total = current.length;
    const avg = total > 0 ? current.reduce((s, r) => s + r.mood_score, 0) / total : 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    current.forEach(r => { distribution[r.mood_score] = (distribution[r.mood_score] || 0) + 1; });

    const byClass: Record<string, { count: number; sum: number; avg: number; comments: string[] }> = {};
    current.forEach(r => {
      if (!byClass[r.class_name]) byClass[r.class_name] = { count: 0, sum: 0, avg: 0, comments: [] };
      byClass[r.class_name].count += 1;
      byClass[r.class_name].sum += r.mood_score;
      if (r.comment) byClass[r.class_name].comments.push(r.comment);
    });
    Object.values(byClass).forEach(v => { v.avg = v.count > 0 ? v.sum / v.count : 0; });

    const prevByClass: Record<string, number> = {};
    const prevSum: Record<string, { sum: number; count: number }> = {};
    previous.forEach(r => {
      if (!prevSum[r.class_name]) prevSum[r.class_name] = { sum: 0, count: 0 };
      prevSum[r.class_name].sum += r.mood_score;
      prevSum[r.class_name].count += 1;
    });
    Object.entries(prevSum).forEach(([k, v]) => { prevByClass[k] = v.count > 0 ? v.sum / v.count : 0; });

    const sortedClasses = Object.entries(byClass)
      .map(([name, d]) => ({
        name,
        ...d,
        delta: prevByClass[name] !== undefined ? d.avg - prevByClass[name] : null,
      }))
      .sort((a, b) => b.avg - a.avg);

    return { total, avg, distribution, sortedClasses, classCount: sortedClasses.length };
  }, [current, previous]);

  // Insights automáticos (sem IA)
  const insights = useMemo(() => {
    const list: string[] = [];
    if (stats.total === 0) return list;

    if (stats.avg >= 4) list.push(`✨ Clima geral excelente esta semana (média ${stats.avg.toFixed(1)}/5).`);
    else if (stats.avg >= 3) list.push(`🙂 Clima geral positivo (média ${stats.avg.toFixed(1)}/5).`);
    else if (stats.avg >= 2) list.push(`⚠️ Clima geral abaixo do ideal (média ${stats.avg.toFixed(1)}/5). Atenção recomendada.`);
    else list.push(`🚨 Clima geral preocupante (média ${stats.avg.toFixed(1)}/5). Intervenção recomendada.`);

    const best = stats.sortedClasses[0];
    const worst = stats.sortedClasses[stats.sortedClasses.length - 1];
    if (best && best.avg >= 4) list.push(`🏆 Sala com melhor clima: ${best.name} (${best.avg.toFixed(1)}/5).`);
    if (worst && worst !== best && worst.avg < 3) list.push(`📉 Sala com pior clima: ${worst.name} (${worst.avg.toFixed(1)}/5).`);

    stats.sortedClasses.forEach(c => {
      if (c.delta !== null) {
        if (c.delta <= -1) list.push(`⬇️ Sala ${c.name} teve queda significativa de ${Math.abs(c.delta).toFixed(1)} pontos vs semana anterior.`);
        else if (c.delta >= 1) list.push(`⬆️ Sala ${c.name} teve melhora significativa de ${c.delta.toFixed(1)} pontos vs semana anterior.`);
      }
    });

    const veryBad = stats.distribution[1] || 0;
    if (veryBad > 0) list.push(`💔 ${veryBad} líder(es) marcaram "Muito ruim" esta semana.`);

    return list;
  }, [stats]);

  const navigateWeek = (offset: number) => {
    const next = new Date(week);
    next.setDate(week.getDate() + offset * 7);
    setWeek(next);
  };

  const isCurrentWeek = week.toISOString().slice(0, 10) === isoWeekStart(new Date()).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Week navigator */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)} className="rounded-xl">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 rounded-xl bg-secondary text-sm font-medium">
            {fmtRange(week)}
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)} disabled={isCurrentWeek} className="rounded-xl">
            <ChevronRight className="w-4 h-4" />
          </Button>
          {!isCurrentWeek && (
            <Button variant="ghost" size="sm" onClick={() => setWeek(isoWeekStart(new Date()))} className="text-xs rounded-xl">
              Semana atual
            </Button>
          )}
        </div>
        <Button onClick={() => window.print()} variant="outline" size="sm" className="gap-1.5 rounded-xl">
          <Printer className="w-4 h-4" /> Imprimir / PDF
        </Button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-10" />
          <div className="text-right">
            <h1 className="font-heading font-bold text-xl">Relatório Clima das Turmas</h1>
            <p className="text-xs text-muted-foreground">{fmtRange(week)}</p>
            <p className="text-[10px] text-muted-foreground">Gerado em {new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 rounded-xl bg-muted animate-pulse" />
          <div className="h-24 rounded-xl bg-muted animate-pulse" />
          <div className="h-24 rounded-xl bg-muted animate-pulse" />
        </div>
      ) : stats.total === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-heading font-bold text-lg mb-1">Nenhuma resposta nesta semana</p>
            <p className="text-sm text-muted-foreground">Os líderes ainda não enviaram suas respostas para esta semana.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Respostas</p>
                <p className="font-heading font-bold text-3xl">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> em {stats.classCount} sala(s)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">Média geral</p>
                <p className="font-heading font-bold text-3xl flex items-center gap-2">
                  {stats.avg.toFixed(1)}
                  <span className="text-2xl">
                    {stats.avg >= 4.5 ? "😄" : stats.avg >= 3.5 ? "🙂" : stats.avg >= 2.5 ? "😐" : stats.avg >= 1.5 ? "😕" : "😢"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">de 5 pontos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-2">Distribuição</p>
                <div className="flex items-end gap-1 h-12">
                  {[1, 2, 3, 4, 5].map(s => {
                    const v = stats.distribution[s] || 0;
                    const max = Math.max(...Object.values(stats.distribution), 1);
                    const h = (v / max) * 100;
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-0.5">
                        <div className={cn("w-full rounded-t transition-all", MOOD_META[s].color)} style={{ height: `${h}%`, minHeight: v > 0 ? "4px" : "0" }} />
                        <span className="text-[10px]">{MOOD_META[s].emoji}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="font-heading font-bold text-sm text-primary">Insights automáticos</p>
                </div>
                <ul className="space-y-1.5">
                  {insights.map((ins, i) => (
                    <li key={i} className="text-sm leading-relaxed">{ins}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Per-class breakdown */}
          <div>
            <h3 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" /> Desempenho por sala
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.sortedClasses.map(c => {
                const meta = MOOD_META[Math.round(c.avg)] || MOOD_META[3];
                return (
                  <Card key={c.name}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-heading font-bold text-base">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.count} resposta(s)</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xl">{meta.emoji}</span>
                            <span className="font-heading font-bold text-xl">{c.avg.toFixed(1)}</span>
                          </div>
                          {c.delta !== null && (
                            <div className="flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground">
                              {trendIcon(c.delta)}
                              <span>{c.delta > 0 ? "+" : ""}{c.delta.toFixed(1)} vs semana anterior</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {c.comments.length > 0 && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {c.comments.slice(0, 3).map((cm, i) => (
                            <p key={i} className="text-xs italic text-muted-foreground line-clamp-2">"{cm}"</p>
                          ))}
                          {c.comments.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">+ {c.comments.length - 3} comentário(s)</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
