import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

interface RankedUser {
  user_id: string;
  total_xp: number;
  level: number;
  full_name: string;
  avatar_url: string | null;
}

export default function ForumRanking() {
  const [ranked, setRanked] = useState<RankedUser[]>([]);

  useEffect(() => {
    const fetch = async () => {
      // Get admin user IDs to exclude
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const adminIds = new Set((adminRoles || []).map((r: any) => r.user_id));

      const { data: xpRows } = await supabase
        .from("user_xp")
        .select("user_id, total_xp, level")
        .order("level", { ascending: false })
        .order("total_xp", { ascending: false })
        .limit(20);

      if (!xpRows || xpRows.length === 0) return;

      // Filter out admins
      const filtered = xpRows.filter((r: any) => !adminIds.has(r.user_id)).slice(0, 10);
      if (filtered.length === 0) return;

      const userIds = filtered.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap: Record<string, { full_name: string; avatar_url: string | null }> = {};
      profiles?.forEach((p: any) => {
        profileMap[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
      });

      setRanked(
        filtered.map((r: any) => ({
          ...r,
          full_name: profileMap[r.user_id]?.full_name || "Usuário",
          avatar_url: profileMap[r.user_id]?.avatar_url || null,
        }))
      );
    };

    fetch();
  }, []);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const getPodiumIcon = (pos: number) => {
    if (pos === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (pos === 1) return <Medal className="w-4 h-4 text-gray-400" />;
    if (pos === 2) return <Award className="w-4 h-4 text-amber-600" />;
    return null;
  };

  const getPodiumBg = (pos: number) => {
    if (pos === 0) return "bg-yellow-500/10 border-yellow-500/30";
    if (pos === 1) return "bg-gray-400/10 border-gray-400/30";
    if (pos === 2) return "bg-amber-600/10 border-amber-600/30";
    return "";
  };

  if (ranked.length === 0) return null;

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Ranking de Líderes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {ranked.map((u, i) => (
          <div
            key={u.user_id}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
              i < 3 ? `border ${getPodiumBg(i)}` : "hover:bg-muted/50"
            }`}
          >
            <span className="w-5 text-xs font-bold text-muted-foreground text-center shrink-0">
              {getPodiumIcon(i) || `#${i + 1}`}
            </span>
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={u.avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                {getInitials(u.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-tight">{u.full_name}</p>
            </div>
            <span className="text-xs font-heading font-bold text-accent shrink-0">
              Nv. {u.level}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
