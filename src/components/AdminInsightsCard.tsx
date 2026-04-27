import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Activity, Heart, AlertTriangle, ArrowUpRight, Sparkles, BarChart3, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  totalLeaders: number;
  activeOnline: number;
  weeklyClimateAvg: number | null;
  weeklyClimateCount: number;
  prevClimateAvg: number | null;
  worstClass: { name: string; avg: number } | null;
  bestClass: { name: string; avg: number } | null;
  lowMoodCount: number;
  forumActivity7d: number;
  noticesPublished7d: number;
  proposalsActive: number;
  participationRate: number;
}

function getWeekStartISO(d: Date = new Date()): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

const moodEmoji = (avg: number | null) => {
  if (avg == null) return "❓";
  if (avg >= 4.3) return "😄";
  if (avg >= 3.6) return "🙂";
  if (avg >= 2.6) return "😐";
  if (avg >= 1.6) return "😕";
  return "😢";
};

const moodLabel = (avg: number | null) => {
  if (avg == null) return "Sem dados";
  if (avg >= 4.3) return "Excelente";
  if (avg >= 3.6) return "Bom";
  if (avg >= 2.6) return "Neutro";
  if (avg >= 1.6) return "Atenção";
  return "Crítico";
};

export default function AdminInsightsCard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const weekStart = getWeekStartISO();
      const prevWeekStart = (() => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
      })();

      const [
        rolesRes,
        presenceRes,
        climateWeekRes,
        climatePrevRes,
        forumRes,
        noticesRes,
        proposalsRes,
      ] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "leader"),
        supabase
          .from("user_presence")
          .select("user_id", { count: "exact", head: true })
          .eq("is_online", true)
          .gte("last_seen", fiveMinAgo),
        supabase.from("class_climate_responses").select("mood_score, class_name").eq("week_start", weekStart),
        supabase.from("class_climate_responses").select("mood_score").eq("week_start", prevWeekStart),
        supabase.from("forum_topics").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("notices").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("proposals").select("id", { count: "exact", head: true }).neq("status", "draft"),
      ]);

      // Process climate week
      const climateWeek = (climateWeekRes.data || []) as { mood_score: number; class_name: string }[];
      const weeklyAvg = climateWeek.length
        ? climateWeek.reduce((a, b) => a + b.mood_score, 0) / climateWeek.length
        : null;
      const lowMood = climateWeek.filter((c) => c.mood_score <= 2).length;

      // Best / worst classes
      const byClass: Record<string, { sum: number; count: number }> = {};
      climateWeek.forEach((c) => {
        if (!c.class_name) return;
        if (!byClass[c.class_name]) byClass[c.class_name] = { sum: 0, count: 0 };
        byClass[c.class_name].sum += c.mood_score;
        byClass[c.class_name].count += 1;
      });
      const classAverages = Object.entries(byClass).map(([name, v]) => ({
        name,
        avg: v.sum / v.count,
      }));
      const sorted = [...classAverages].sort((a, b) => b.avg - a.avg);
      const bestClass = sorted[0] || null;
      const worstClass = sorted.length > 1 ? sorted[sorted.length - 1] : null;

      // Prev week
      const prevWeek = (climatePrevRes.data || []) as { mood_score: number }[];
      const prevAvg = prevWeek.length
        ? prevWeek.reduce((a, b) => a + b.mood_score, 0) / prevWeek.length
        : null;

      const totalLeaders = rolesRes.count || 0;
      const participation =
        totalLeaders > 0 ? Math.round((climateWeek.length / totalLeaders) * 100) : 0;

      if (!cancelled) {
        setStats({
          totalLeaders,
          activeOnline: presenceRes.count || 0,
          weeklyClimateAvg: weeklyAvg,
          weeklyClimateCount: climateWeek.length,
          prevClimateAvg: prevAvg,
          worstClass,
          bestClass,
          lowMoodCount: lowMood,
          forumActivity7d: forumRes.count || 0,
          noticesPublished7d: noticesRes.count || 0,
          proposalsActive: proposalsRes.count || 0,
          participationRate: participation,
        });
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="rounded-3xl border bg-card animate-pulse h-64 mb-8" />;
  }

  if (!stats) return null;

  const climateDelta =
    stats.weeklyClimateAvg != null && stats.prevClimateAvg != null
      ? stats.weeklyClimateAvg - stats.prevClimateAvg
      : null;

  // Build smart insights (auto-generated, statistical)
  const insights: { icon: React.ReactNode; text: string; tone: "positive" | "neutral" | "warning" }[] = [];

  if (stats.weeklyClimateAvg != null) {
    insights.push({
      icon: <Heart className="w-4 h-4" />,
      text: `Clima geral da semana: ${moodLabel(stats.weeklyClimateAvg)} (${stats.weeklyClimateAvg.toFixed(1)}/5)`,
      tone: stats.weeklyClimateAvg >= 3.6 ? "positive" : stats.weeklyClimateAvg >= 2.6 ? "neutral" : "warning",
    });
  }
  if (climateDelta != null && Math.abs(climateDelta) >= 0.2) {
    insights.push({
      icon: <TrendingUp className="w-4 h-4" />,
      text: `${climateDelta > 0 ? "Melhora" : "Queda"} de ${Math.abs(climateDelta).toFixed(1)} pts vs semana anterior`,
      tone: climateDelta > 0 ? "positive" : "warning",
    });
  }
  if (stats.lowMoodCount >= 2) {
    insights.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `${stats.lowMoodCount} líderes relataram clima baixo esta semana`,
      tone: "warning",
    });
  }
  if (stats.bestClass) {
    insights.push({
      icon: <Sparkles className="w-4 h-4" />,
      text: `Melhor sala: ${stats.bestClass.name} (${stats.bestClass.avg.toFixed(1)}/5)`,
      tone: "positive",
    });
  }
  if (stats.worstClass && stats.worstClass.avg < 3) {
    insights.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `Atenção: ${stats.worstClass.name} com média ${stats.worstClass.avg.toFixed(1)}`,
      tone: "warning",
    });
  }
  if (stats.participationRate < 40 && stats.totalLeaders > 5) {
    insights.push({
      icon: <Users className="w-4 h-4" />,
      text: `Participação no Clima: ${stats.participationRate}% — engaje os líderes`,
      tone: "neutral",
    });
  } else if (stats.participationRate >= 70) {
    insights.push({
      icon: <Users className="w-4 h-4" />,
      text: `Excelente participação: ${stats.participationRate}% dos líderes responderam`,
      tone: "positive",
    });
  }

  const toneDot = (tone: "positive" | "neutral" | "warning") =>
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "warning"
      ? "bg-amber-500"
      : "bg-primary";

  return (
    <div className="rounded-3xl border border-border/60 bg-card mb-8">
      <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-2">
        {/* Header — minimalista */}
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium mb-1">
              Painel Executivo
            </p>
            <h3 className="font-heading font-semibold text-2xl sm:text-[28px] text-foreground tracking-tight leading-tight">
              Visão geral
            </h3>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="hidden sm:inline-flex items-center gap-1 text-[13px] text-primary hover:opacity-70 transition-opacity whitespace-nowrap"
          >
            Admin
            <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Stat tiles — clean, sem cores de fundo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5 pb-6 border-b border-border/50">
          <StatTile
            label="Clima da semana"
            value={stats.weeklyClimateAvg != null ? stats.weeklyClimateAvg.toFixed(1) : "—"}
            unit={stats.weeklyClimateAvg != null ? "/ 5" : undefined}
            sub={`${stats.weeklyClimateCount} ${stats.weeklyClimateCount === 1 ? "resposta" : "respostas"}`}
            delta={climateDelta}
          />
          <StatTile
            label="Participação"
            value={`${stats.participationRate}`}
            unit="%"
            sub={`${stats.weeklyClimateCount} de ${stats.totalLeaders} líderes`}
          />
          <StatTile
            label="Online agora"
            value={`${stats.activeOnline}`}
            sub="usuários ativos"
          />
          <StatTile
            label="Engajamento · 7 dias"
            value={`${stats.forumActivity7d + stats.noticesPublished7d}`}
            sub={`${stats.forumActivity7d} tópicos · ${stats.noticesPublished7d} avisos`}
          />
        </div>
      </div>

      {/* Smart insights — lista limpa com bullet points */}
      {insights.length > 0 && (
        <div className="px-6 sm:px-8 py-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 font-medium mb-3">
            Destaques
          </p>
          <ul className="space-y-2.5">
            {insights.slice(0, 5).map((i, idx) => (
              <li key={idx} className="flex items-center gap-3 text-[14px] text-foreground/90">
                <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", toneDot(i.tone))} />
                <span className="leading-snug">{i.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface TileProps {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  delta?: number | null;
}

function StatTile({ label, value, unit, sub, delta }: TileProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/80 font-medium mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading font-semibold text-3xl text-foreground tracking-tight tabular-nums leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-medium">{unit}</span>
        )}
        {delta != null && Math.abs(delta) >= 0.05 && (
          <span
            className={cn(
              "inline-flex items-center text-[11px] font-medium ml-1",
              delta > 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            <TrendingUp className={cn("w-3 h-3 mr-0.5", delta < 0 && "rotate-180")} strokeWidth={2.2} />
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        )}
      </div>
      {sub && <p className="text-[12px] text-muted-foreground mt-1 truncate">{sub}</p>}
    </div>
  );
}
