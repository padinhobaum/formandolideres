import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 4000];

export interface UserXpData {
  totalXp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0-100
}

export function useUserXp() {
  const { user } = useAuth();
  const [data, setData] = useState<UserXpData>({
    totalXp: 0,
    level: 1,
    currentLevelXp: 0,
    nextLevelXp: 100,
    progress: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchXp = async () => {
    if (!user) return;
    const { data: row } = await supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .maybeSingle();

    const totalXp = (row as any)?.total_xp ?? 0;
    const level = (row as any)?.level ?? 1;
    const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
    const nextLevelXp = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const range = nextLevelXp - currentLevelXp;
    const progress = range > 0 ? Math.min(((totalXp - currentLevelXp) / range) * 100, 100) : 100;

    setData({ totalXp, level, currentLevelXp, nextLevelXp, progress });
    setLoading(false);
  };

  useEffect(() => {
    fetchXp();
  }, [user]);

  const awardXp = async (action: string, referenceId: string, xpAmount: number) => {
    if (!user) return;
    await supabase.rpc("award_xp", {
      _user_id: user.id,
      _action: action,
      _reference_id: referenceId,
      _xp_amount: xpAmount,
    });
    await fetchXp();
  };

  return { ...data, loading, awardXp, refetch: fetchXp };
}
