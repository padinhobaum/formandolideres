import { useEffect, useState, useCallback } from "react";
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
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("edital_config")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error("Erro ao buscar edital_config:", fetchError);
        setError("Erro ao carregar configuração do edital.");
      } else {
        setConfig(data as unknown as EditalConfig | null);
        setError(null);
      }
    } catch (e) {
      console.error("Erro inesperado ao buscar edital_config:", e);
      setError("Erro ao carregar configuração do edital.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    const channelName = `edital-config-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "edital_config" },
        (payload: any) => {
          setConfig(payload.new as EditalConfig);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConfig]);

  return { config, loading, error, refetch: fetchConfig };
}
