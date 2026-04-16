import { useEffect, useState, useCallback, useRef } from "react";
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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const channelNameRef = useRef(`edital-config-live-${Math.random().toString(36).slice(2)}`);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);

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
    void fetchConfig();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase.channel(channelNameRef.current);
    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "edital_config" },
      (payload: any) => {
        if (payload?.new) {
          setConfig(payload.new as EditalConfig);
          setError(null);
        }
      }
    );
    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        console.error("Erro no canal realtime do edital_config");
      }
    });
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchConfig]);

  return { config, loading, error, refetch: fetchConfig };
}
