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

  const toneClass = (tone: "positive" | "neutral" | "warning") =>
    tone === "positive"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : tone === "warning"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-accent/8 mb-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Decorative gradient blobs */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-widest text-primary/80">
                Painel Executivo
              </p>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-foreground leading-tight">
                Insights da Plataforma
              </h3>
            </div>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline whitespace-nowrap"
          >
            Ir ao Admin <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatTile
            icon={<Heart className="w-4 h-4" />}
            label="Clima da semana"
            value={stats.weeklyClimateAvg != null ? `${moodEmoji(stats.weeklyClimateAvg)} ${stats.weeklyClimateAvg.toFixed(1)}` : "—"}
            sub={`${stats.weeklyClimateCount} respostas`}
            delta={climateDelta}
            accent="from-rose-500/15 to-rose-500/5"
          />
          <StatTile
            icon={<Users className="w-4 h-4" />}
            label="Participação"
            value={`${stats.participationRate}%`}
            sub={`${stats.weeklyClimateCount}/${stats.totalLeaders} líderes`}
            accent="from-primary/15 to-primary/5"
          />
          <StatTile
            icon={<Activity className="w-4 h-4" />}
            label="Online agora"
            value={`${stats.activeOnline}`}
            sub="usuários ativos"
            accent="from-emerald-500/15 to-emerald-500/5"
          />
          <StatTile
            icon={<MessageSquare className="w-4 h-4" />}
            label="Engajamento 7d"
            value={`${stats.forumActivity7d + stats.noticesPublished7d}`}
            sub={`${stats.forumActivity7d} tópicos · ${stats.noticesPublished7d} avisos`}
            accent="from-accent/15 to-accent/5"
          />
        </div>

        {/* Smart insights */}
        {insights.length > 0 && (
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> Destaques inteligentes
            </p>
            <div className="flex flex-wrap gap-2">
              {insights.slice(0, 6).map((i, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border",
                    toneClass(i.tone)
                  )}
                >
                  {i.icon}
                  <span>{i.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface TileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  accent?: string;
}

function StatTile({ icon, label, value, sub, delta, accent = "from-primary/10 to-primary/5" }: TileProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3.5 backdrop-blur-sm", accent)}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-7 h-7 rounded-lg bg-card/80 flex items-center justify-center text-foreground/80">
          {icon}
        </div>
        {delta != null && Math.abs(delta) >= 0.05 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              delta > 0 ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"
            )}
          >
            <TrendingUp className={cn("w-2.5 h-2.5", delta < 0 && "rotate-180")} />
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)}
          </span>
        )}
      </div>
      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{label}</p>
      <p className="font-heading font-bold text-xl text-foreground leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{sub}</p>}
    </div>
  );
}
