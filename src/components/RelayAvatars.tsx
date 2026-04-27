import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RelayUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

interface Props {
  noticeId: string;
  /** How many avatars to show before collapsing into +N */
  maxVisible?: number;
  /** Avatar diameter in px (tailwind size) — passes via inline style for flexibility */
  size?: number;
  /** Compact variant (no label, no icon) — ideal for cards */
  compact?: boolean;
}

/**
 * Shows overlapping circular avatars of users who confirmed relay of a notice.
 * Designed to be premium-looking, responsive and used both in cards and detail views.
 */
export default function RelayAvatars({
  noticeId,
  maxVisible = 4,
  size = 24,
  compact = false,
}: Props) {
  const [users, setUsers] = useState<RelayUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("notice_relays")
        .select("user_id")
        .eq("notice_id", noticeId);
      if (!data || data.length === 0) {
        if (!cancelled) {
          setUsers([]);
          setLoading(false);
        }
        return;
      }
      const ids = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);
      if (!cancelled) {
        setUsers((profiles || []) as RelayUser[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [noticeId]);

  if (loading || users.length === 0) return null;

  const initials = (name: string) =>
    name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - visible.length;

  return (
    <div
      className={`inline-flex items-center gap-2 ${compact ? "" : "px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"}`}
      onClick={(e) => e.stopPropagation()}
    >
      {!compact && (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" strokeWidth={2.2} />
      )}
      <div className="flex -space-x-1.5">
        {visible.map((u) => (
          <Tooltip key={u.user_id}>
            <TooltipTrigger asChild>
              <Avatar
                className="ring-2 ring-card hover:scale-110 hover:z-10 transition-transform cursor-default"
                style={{ width: size, height: size }}
              >
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback className="text-[8px] font-bold bg-emerald-500/15 text-emerald-700">
                  {initials(u.full_name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {u.full_name}
            </TooltipContent>
          </Tooltip>
        ))}
        {overflow > 0 && (
          <div
            className="ring-2 ring-card rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center text-[9px] font-bold"
            style={{ width: size, height: size }}
            title={`+${overflow} confirmaram`}
          >
            +{overflow}
          </div>
        )}
      </div>
      {!compact && (
        <span className="text-[10px] font-semibold text-emerald-700">
          {users.length} {users.length === 1 ? "repasse" : "repasses"}
        </span>
      )}
    </div>
  );
}
