import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import SalaBadge from "@/components/SalaBadge";
import { X, Loader2 } from "lucide-react";

interface UserAvatarProps {
  userId?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  sala?: string | null;
  className?: string;
  fallbackClassName?: string;
  style?: React.CSSProperties;
  /** Disable the click-to-preview behavior */
  disablePreview?: boolean;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserAvatar({
  userId,
  name,
  avatarUrl,
  sala,
  className = "w-9 h-9",
  fallbackClassName = "text-xs bg-primary/10 text-primary font-semibold",
  style,
  disablePreview = false,
}: UserAvatarProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ full_name: string; class_name: string | null; avatar_url: string | null } | null>(
    name ? { full_name: name, class_name: sala ?? null, avatar_url: avatarUrl ?? null } : null
  );
  const [presence, setPresence] = useState<{ is_online: boolean; last_seen: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (next && userId) {
      const needsProfile = !data || data.class_name == null;
      if (needsProfile) setLoading(true);
      const [profileRes, presenceRes] = await Promise.all([
        needsProfile
          ? supabase.from("profiles").select("full_name, class_name, avatar_url").eq("user_id", userId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase.from("user_presence").select("is_online, last_seen").eq("user_id", userId).maybeSingle(),
      ]);
      if (profileRes.data) setData(profileRes.data as any);
      if (presenceRes.data) setPresence(presenceRes.data as any);
      setLoading(false);
    }
  };

  const formatLastSeen = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora mesmo";
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (sameDay) return `hoje às ${time}`;
    if (isYesterday) return `ontem às ${time}`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) + ` às ${time}`;
  };

  const trigger = (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 transition-transform hover:scale-105 active:scale-95"
      aria-label={name ? `Ver perfil de ${name}` : "Ver perfil"}
    >
      <Avatar className={className} style={style}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className={fallbackClassName}>{getInitials(name)}</AvatarFallback>
      </Avatar>
    </button>
  );

  if (disablePreview || !userId) {
    return (
      <Avatar className={className} style={style}>
        <AvatarImage src={avatarUrl || undefined} />
        <AvatarFallback className={fallbackClassName}>{getInitials(name)}</AvatarFallback>
      </Avatar>
    );
  }

  const display = data ?? { full_name: name ?? "Usuário", class_name: sala ?? null, avatar_url: avatarUrl ?? null };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-64 p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        side="bottom"
        align="center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-4 pt-5 pb-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex flex-col items-center text-center gap-2">
            <Avatar className="w-20 h-20 ring-4 ring-background shadow-lg">
              <AvatarImage src={display.avatar_url || undefined} />
              <AvatarFallback className="text-lg bg-primary/15 text-primary font-bold">
                {getInitials(display.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 w-full">
              <p className="font-body font-semibold text-sm leading-tight text-foreground truncate">
                {display.full_name}
              </p>
              <div className="mt-1.5 flex justify-center">
                {loading && !display.class_name ? (
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                ) : display.class_name ? (
                  <SalaBadge sala={display.class_name} />
                ) : (
                  <span className="text-[10px] text-muted-foreground">Sem sala</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
