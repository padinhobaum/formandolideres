import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EditalConfig {
  id: string;
  is_active: boolean;
  current_phase: string;
  max_votes_per_user: number;
  allow_multiple_votes_same_proposal: boolean;
  scheduled_open_at: string | null;
  scheduled_close_at: string | null;
  updated_at: string;
}

export function useEditalConfig() {
  const [config, setConfig] = useState<EditalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const { data } = await supabase
      .from("edital_config")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (data) setConfig(data as unknown as EditalConfig);
    setLoading(false);
  };

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel("edital-config-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "edital_config" }, (payload: any) => {
        setConfig(payload.new as EditalConfig);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { config, loading, refetch: fetch };
}
