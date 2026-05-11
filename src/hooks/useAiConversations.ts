import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AiConversation = {
  id: string;
  title: string;
  last_message_at: string;
  created_at: string;
};

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export function useAiConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, last_message_at, created_at")
      .eq("user_id", userId)
      .order("last_message_at", { ascending: false });
    setConversations((data || []) as AiConversation[]);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await supabase.from("ai_conversations").delete().eq("id", id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  return { conversations, loading, refresh, remove, setConversations };
}

export async function loadMessages(conversationId: string): Promise<AiMessage[]> {
  const { data } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data || []) as AiMessage[];
}
