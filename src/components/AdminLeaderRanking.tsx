import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/UserAvatar";
import { getLevelName } from "@/lib/levels";
import { Trophy, Medal, Award, Search, Users, Sparkles, CalendarCheck, ThumbsUp } from "lucide-react";

interface LeaderRow {
  user_id: string;
  full_name: string;
  class_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  climate_weeks: number;
  approval: number | null;
  responses: number;
}

type SortKey = "xp" | "climate" | "approval" | "name";

export default function AdminLeaderRanking() {
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("xp");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [adminRes, profilesRes, xpRes, climateRes, leadersRes, responsesRes] = await Promise.all([
        (supabase as any).rpc("get_admin_user_ids"),
        supabase.from("profiles").select("user_id, full_name, class_name, avatar_url"),
        supabase.from("user_xp").select("user_id, total_xp, level"),
        supabase.from("class_climate_responses").select("user_id, week_start"),
        supabase.from("survey_leaders").select("survey_id, leader_user_id"),
        supabase.from("survey_responses").select("survey_id, score_general, score_communication"),
      ]);

      const adminIds = new Set(
        ((adminRes.data || []) as any[]).map((r: any) => (typeof r === "string" ? r : r.user_id))
      );

      const xpMap = new Map<string, { total_xp: number; level: number }>();
      (xpRes.data || []).forEach((r: any) => xpMap.set(r.user_id, { total_xp: r.total_xp, level: r.level }));

      const weeksMap = new Map<string, Set<string>>();
      (climateRes.data || []).forEach((r: any) => {
        if (!weeksMap.has(r.user_id)) weeksMap.set(r.user_id, new Set());
        weeksMap.get(r.user_id)!.add(r.week_start);
      });

      // survey_id -> leader ids
      const surveyLeaders = new Map<string, string[]>();
      (leadersRes.data || []).forEach((r: any) => {
        const arr = surveyLeaders.get(r.survey_id) || [];
        arr.push(r.leader_user_id);
        surveyLeaders.set(r.survey_id, arr);
      });

      // leader -> accumulated scores
      const scoreMap = new Map<string, { sum: number; count: number }>();
      (responsesRes.data || []).forEach((r: any) => {
        const leaders = surveyLeaders.get(r.survey_id) || [];
        const avg = (Number(r.score_general) + Number(r.score_communication)) / 2;
        leaders.forEach((lid) => {
          const cur = scoreMap.get(lid) || { sum: 0, count: 0 };
          cur.sum += avg;
          cur.count += 1;
          scoreMap.set(lid, cur);
        });
      });

      const built: LeaderRow[] = (profilesRes.data || [])
        .filter((p: any) => !adminIds.has(p.user_id))
        .map((p: any) => {
          const xp = xpMap.get(p.user_id);
          const score = scoreMap.get(p.user_id);
          return {
            user_id: p.user_id,
            full_name: p.full_name,
            class_name: p.class_name,
            avatar_url: p.avatar_url,
            total_xp: xp?.total_xp ?? 0,
            level: xp?.level ?? 1,
            climate_weeks: weeksMap.get(p.user_id)?.size ?? 0,
            approval: score && score.count > 0 ? (score.sum / score.count) * 10 : null,
            responses: score?.count ?? 0,
          };
        });

      setRows(built);
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        !term ||
        r.full_name.toLowerCase().includes(term) ||
        (r.class_name || "").toLowerCase().includes(term)
    );
    const sorted = [...list].sort((a, b) => {
      if (sortKey === "name") return a.full_name.localeCompare(b.full_name);
      if (sortKey === "climate") return b.climate_weeks - a.climate_weeks || b.total_xp - a.total_xp;
      if (sortKey === "approval") return (b.approval ?? -1) - (a.approval ?? -1) || b.total_xp - a.total_xp;
      return b.total_xp - a.total_xp || b.level - a.level;
    });
    return sorted;
  }, [rows, search, sortKey]);

  const stats = useMemo(() => {
    const withApproval = rows.filter((r) => r.approval !== null);
    return {
      leaders: rows.length,
      totalXp: rows.reduce((s, r) => s + r.total_xp, 0),
      avgWeeks: rows.length ? rows.reduce((s, r) => s + r.climate_weeks, 0) / rows.length : 0,
      avgApproval: withApproval.length
        ? withApproval.reduce((s, r) => s + (r.approval || 0), 0) / withApproval.length
        : null,
    };
  }, [rows]);

  const podium = (pos: number) => {
    if (pos === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (pos === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (pos === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const approvalColor = (v: number) =>
    v >= 80 ? "text-emerald-600" : v >= 60 ? "text-amber-600" : "text-destructive";

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "xp", label: "XP" },
    { key: "climate", label: "Clima" },
    { key: "approval", label: "Aprovação" },
    { key: "name", label: "Nome" },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Líderes" value={String(stats.leaders)} />
        <KpiCard icon={Sparkles} label="XP total" value={stats.totalXp.toLocaleString("pt-BR")} />
        <KpiCard icon={CalendarCheck} label="Semanas / líder" value={stats.avgWeeks.toFixed(1)} />
        <KpiCard
          icon={ThumbsUp}
          label="Aprovação média"
          value={stats.avgApproval === null ? "—" : `${stats.avgApproval.toFixed(0)}%`}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" strokeWidth={1.5} />
            Ranking completo de líderes
          </CardTitle>
          <CardDescription>
            XP acumulado, participação semanal no Clima da Turma e índice médio de aprovação nas pesquisas de opinião.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou turma..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {sortOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setSortKey(o.key)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                    sortKey === o.key
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Carregando ranking...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum líder encontrado.</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                      <th className="py-2 pr-2 w-10">#</th>
                      <th className="py-2 pr-2">Líder</th>
                      <th className="py-2 pr-2">Turma</th>
                      <th className="py-2 pr-2 text-right">XP</th>
                      <th className="py-2 pr-2">Nível</th>
                      <th className="py-2 pr-2 text-center">Semanas de clima</th>
                      <th className="py-2 pr-2 text-right">Aprovação</th>
                      <th className="py-2 text-center">Respostas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.user_id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 pr-2">
                          <span className="flex items-center justify-center w-6 text-xs font-bold text-muted-foreground">
                            {podium(i) || i + 1}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar
                              userId={r.user_id}
                              name={r.full_name}
                              avatarUrl={r.avatar_url}
                              className="w-8 h-8 shrink-0"
                              fallbackClassName="text-[10px] bg-muted text-muted-foreground"
                            />
                            <span className="font-medium truncate">{r.full_name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-2 text-muted-foreground">{r.class_name || "—"}</td>
                        <td className="py-2.5 pr-2 text-right font-heading font-bold">
                          {r.total_xp.toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2.5 pr-2">
                          <Badge variant="secondary" className="font-normal whitespace-nowrap">
                            Nv. {r.level} · {getLevelName(r.level)}
                          </Badge>
                        </td>
                        <td className="py-2.5 pr-2 text-center">{r.climate_weeks}</td>
                        <td className="py-2.5 pr-2 text-right font-semibold">
                          {r.approval === null ? (
                            <span className="text-muted-foreground font-normal">—</span>
                          ) : (
                            <span className={approvalColor(r.approval)}>{r.approval.toFixed(0)}%</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center text-muted-foreground">{r.responses}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filtered.map((r, i) => (
                  <div key={r.user_id} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 text-xs font-bold text-muted-foreground text-center shrink-0">
                        {podium(i) || i + 1}
                      </span>
                      <UserAvatar
                        userId={r.user_id}
                        name={r.full_name}
                        avatarUrl={r.avatar_url}
                        className="w-9 h-9 shrink-0"
                        fallbackClassName="text-[10px] bg-muted text-muted-foreground"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.class_name || "Sem turma"} · Nv. {r.level}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <MiniStat label="XP" value={r.total_xp.toLocaleString("pt-BR")} />
                      <MiniStat label="Semanas" value={String(r.climate_weeks)} />
                      <MiniStat
                        label="Aprovação"
                        value={r.approval === null ? "—" : `${r.approval.toFixed(0)}%`}
                        className={r.approval === null ? "" : approvalColor(r.approval)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Icon className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-xs">{label}</span>
        </div>
        <p className="font-heading font-bold text-xl text-primary">{value}</p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`font-heading font-bold text-sm ${className}`}>{value}</p>
    </div>
  );
}
