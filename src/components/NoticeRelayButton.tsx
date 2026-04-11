import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  noticeId: string;
  requiresRelay: boolean;
}

interface RelayUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function NoticeRelayButton({ noticeId, requiresRelay }: Props) {
  const { user, isAdmin } = useAuth();
  const [relayed, setRelayed] = useState(false);
  const [relayUsers, setRelayUsers] = useState<RelayUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requiresRelay) return;
    fetchRelays();
  }, [noticeId, requiresRelay]);

  const fetchRelays = async () => {
    const { data } = await supabase
      .from("notice_relays")
      .select("user_id")
      .eq("notice_id", noticeId);
    if (data && data.length > 0) {
      const ids = data.map((r: any) => r.user_id);
      if (user && ids.includes(user.id)) setRelayed(true);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      if (profiles) setRelayUsers(profiles as RelayUser[]);
    }
  };

  const handleRelay = async () => {
    if (!user || relayed) return;
    setLoading(true);
    const { error } = await supabase.from("notice_relays").insert({
      notice_id: noticeId,
      user_id: user.id,
    } as any);
    setLoading(false);
    if (error) {
      if (error.code === "23505") { setRelayed(true); return; }
      toast.error("Erro ao confirmar repasse.");
      return;
    }
    setRelayed(true);
    toast.success("Repasse confirmado! ✅");
    fetchRelays();
  };

  if (!requiresRelay) return null;

  const getInitials = (name: string) =>
    name?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  return (
    <div className="mt-3 flex items-center gap-3 flex-wrap">
      {!isAdmin && (
        <Button
          size="sm"
          variant={relayed ? "secondary" : "default"}
          onClick={handleRelay}
          disabled={relayed || loading}
          className="gap-1.5 text-xs"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {relayed ? "Repassado ✓" : loading ? "Confirmando..." : "Já repassei para minha turma"}
        </Button>
      )}
      {relayUsers.length > 0 && (
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {relayUsers.slice(0, 6).map(u => (
              <Avatar key={u.user_id} className="w-7 h-7 border-2 border-background">
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback className="text-[8px] font-bold bg-accent text-accent-foreground">
                  {getInitials(u.full_name)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {relayUsers.length > 6 && (
            <span className="text-[10px] text-muted-foreground ml-1">+{relayUsers.length - 6}</span>
          )}
          <span className="text-[10px] text-muted-foreground ml-2">
            {relayUsers.length} {relayUsers.length === 1 ? "confirmou" : "confirmaram"}
          </span>
        </div>
      )}
    </div>
  );
}
