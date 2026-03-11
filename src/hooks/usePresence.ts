import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const HEARTBEAT_INTERVAL = 30_000; // 30s

export function usePresence() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const upsertPresence = async (online: boolean) => {
      await supabase.from("user_presence").upsert(
        { user_id: user.id, is_online: online, last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    };

    // Go online
    upsertPresence(true);

    // Heartbeat
    intervalRef.current = setInterval(() => upsertPresence(true), HEARTBEAT_INTERVAL);

    // Go offline on tab close
    const handleBeforeUnload = () => {
      navigator.sendBeacon && upsertPresence(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        upsertPresence(false);
      } else {
        upsertPresence(true);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      upsertPresence(false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user]);
}
