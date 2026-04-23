import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StreakData {
  current: number;
  longest: number;
  lastActivity: string | null;
  isActiveToday: boolean;
}

export function useUserStreak() {
  const { user } = useAuth();
  const [data, setData] = useState<StreakData>({
    current: 0,
    longest: 0,
    lastActivity: null,
    isActiveToday: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: row } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_activity_date")
      .eq("user_id", user.id)
      .maybeSingle();

    const r: any = row;
    const today = new Date().toISOString().slice(0, 10);
    setData({
      current: r?.current_streak ?? 0,
      longest: r?.longest_streak ?? 0,
      lastActivity: r?.last_activity_date ?? null,
      isActiveToday: r?.last_activity_date === today,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { ...data, loading, refetch: fetchStreak };
}
