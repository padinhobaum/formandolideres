import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotificationItem {
  id: string;
  type: "notice" | "topic" | "video" | "material" | "forum_reply" | "video_reply";
  title: string;
  created_at: string;
  route?: string;
  author_avatar_url?: string | null;
  author_name?: string;
}

function getNotificationRoute(item: NotificationItem): string {
  if (item.route) return item.route;
  switch (item.type) {
    case "notice": return "/mural";
    case "topic": return `/forum?topic=${item.id}`;
    case "video": return "/videoaulas";
    case "material": return "/materiais";
    case "forum_reply": return item.route || "/forum";
    case "video_reply": return item.route || "/videoaulas";
    default: return "/home";
  }
}

export default function NotificationPopover({ variant = "sidebar" }: { variant?: "sidebar" | "header" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const [clearedAt, setClearedAt] = useState<string | null>(null);

  const fetchLastRead = async () => {
    if (!user) return { lr: null, ca: null };
    const { data } = await supabase
      .from("notification_last_read")
      .select("last_read_at, cleared_at")
      .eq("user_id", user.id)
      .maybeSingle();
    const lr = (data as any)?.last_read_at || null;
    const ca = (data as any)?.cleared_at || null;
    setLastReadAt(lr);
    setClearedAt(ca);
    return { lr, ca };
  };

  const fetchNotifications = async () => {
    if (!user) return;
    const { lr, ca } = await fetchLastRead();

    const [notices, topics, videos, materials, forumReplies, videoReplies] = await Promise.all([
      supabase.from("notices").select("id, title, created_at, target_user_ids, author_id, author_name").order("created_at", { ascending: false }).limit(10),
      supabase.from("forum_topics").select("id, title, created_at, author_id, author_name, author_avatar_url").order("created_at", { ascending: false }).limit(10),
      supabase.from("video_lessons").select("id, title, created_at, created_by").order("created_at", { ascending: false }).limit(10),
      supabase.from("materials").select("id, title, created_at, uploaded_by").order("created_at", { ascending: false }).limit(10),
      // Replies to my forum comments
      supabase.from("forum_replies").select("id, topic_id, author_name, parent_reply_id, created_at")
        .not("author_id", "eq", user.id)
        .not("parent_reply_id", "is", null)
        .order("created_at", { ascending: false }).limit(20),
      // Replies to my video comments
      supabase.from("video_comments").select("id, video_id, user_name, parent_comment_id, created_at, user_id")
        .not("user_id", "eq", user.id)
        .not("parent_comment_id", "is", null)
        .order("created_at", { ascending: false }).limit(20),
    ]);

    const filteredNotices = (notices.data || []).filter((n: any) => {
      if (!n.target_user_ids || n.target_user_ids.length === 0) return true;
      return n.target_user_ids.includes(user.id);
    });

    // Filter forum replies: only those replying to MY comments
    let myForumReplyNotifs: NotificationItem[] = [];
    if (forumReplies.data && forumReplies.data.length > 0) {
      const parentIds = [...new Set((forumReplies.data as any[]).map((r: any) => r.parent_reply_id).filter(Boolean))];
      if (parentIds.length > 0) {
        const { data: parentReplies } = await supabase.from("forum_replies").select("id, author_id").in("id", parentIds);
        const myParentIds = new Set((parentReplies || []).filter((p: any) => p.author_id === user.id).map((p: any) => p.id));
        myForumReplyNotifs = (forumReplies.data as any[])
          .filter((r: any) => myParentIds.has(r.parent_reply_id))
          .map((r: any) => ({
            id: r.id,
            title: `${r.author_name} respondeu ao seu comentário no fórum`,
            created_at: r.created_at,
            type: "forum_reply" as const,
            route: `/forum?topic=${r.topic_id}`,
          }));
      }
    }

    // Filter video replies: only those replying to MY comments
    let myVideoReplyNotifs: NotificationItem[] = [];
    if (videoReplies.data && videoReplies.data.length > 0) {
      const parentIds = [...new Set((videoReplies.data as any[]).map((r: any) => r.parent_comment_id).filter(Boolean))];
      if (parentIds.length > 0) {
        const { data: parentComments } = await supabase.from("video_comments").select("id, user_id").in("id", parentIds);
        const myParentIds = new Set((parentComments || []).filter((p: any) => p.user_id === user.id).map((p: any) => p.id));
        myVideoReplyNotifs = (videoReplies.data as any[])
          .filter((r: any) => myParentIds.has(r.parent_comment_id))
          .map((r: any) => ({
            id: r.id,
            title: `${r.user_name} respondeu ao seu comentário na videoaula`,
            created_at: r.created_at,
            type: "video_reply" as const,
            route: "/videoaulas",
          }));
      }
    }

    let all: NotificationItem[] = [
      ...filteredNotices.map((n: any) => ({ id: n.id, title: n.title, created_at: n.created_at, type: "notice" as const })),
      ...(topics.data || []).map((t: any) => ({ ...t, type: "topic" as const })),
      ...(videos.data || []).map((v: any) => ({ ...v, type: "video" as const })),
      ...(materials.data || []).map((m: any) => ({ ...m, type: "material" as const })),
      ...myForumReplyNotifs,
      ...myVideoReplyNotifs,
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Filter out items that were cleared
    if (ca) {
      all = all.filter((i) => new Date(i.created_at) > new Date(ca));
    }

    all = all.slice(0, 20);
    setItems(all);

    if (lr) {
      setUnreadCount(all.filter((i) => new Date(i.created_at) > new Date(lr)).length);
    } else {
      setUnreadCount(all.length);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && user && unreadCount > 0) {
      const now = new Date().toISOString();
      await supabase.from("notification_last_read").upsert({ user_id: user.id, last_read_at: now } as any, { onConflict: "user_id" });
      setUnreadCount(0);
      setLastReadAt(now);
    }
  };

  const handleItemClick = (item: NotificationItem) => {
    setOpen(false);
    navigate(getNotificationRoute(item));
  };

  const handleClearAll = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from("notification_last_read").upsert({ user_id: user.id, last_read_at: now, cleared_at: now } as any, { onConflict: "user_id" });
    setUnreadCount(0);
    setLastReadAt(now);
    setClearedAt(now);
    setItems([]);
  };

  const typeLabel: Record<string, string> = {
    notice: "Aviso",
    topic: "Fórum",
    video: "Videoaula",
    material: "Material",
    forum_reply: "Resposta",
    video_reply: "Resposta",
  };

  const typeColor: Record<string, string> = {
    notice: "bg-primary",
    topic: "bg-accent",
    video: "bg-destructive",
    material: "bg-secondary-foreground",
    forum_reply: "bg-accent",
    video_reply: "bg-destructive",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const isUnread = (created_at: string) => !lastReadAt || new Date(created_at) > new Date(lastReadAt);

  if (variant === "header") {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button className="relative p-1">
            <Bell className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" align="end">
        <NotificationHeader unreadCount={unreadCount} onClearAll={handleClearAll} />
        <NotificationList items={items} typeLabel={typeLabel} typeColor={typeColor} formatDate={formatDate} isUnread={isUnread} onItemClick={handleItemClick} />
      </PopoverContent>
    </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-body rounded transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
          <Bell className="w-[20px] h-[20px]" strokeWidth={1.5} />
          <span className="text-lg">Notificações</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" side="right" align="start">
        <NotificationHeader unreadCount={unreadCount} onClearAll={handleClearAll} />
        <NotificationList items={items} typeLabel={typeLabel} typeColor={typeColor} formatDate={formatDate} isUnread={isUnread} onItemClick={handleItemClick} />
      </PopoverContent>
    </Popover>
  );
}

function NotificationList({ items, typeLabel, typeColor, formatDate, isUnread, onItemClick }: {
  items: NotificationItem[];
  typeLabel: Record<string, string>;
  typeColor: Record<string, string>;
  formatDate: (d: string) => string;
  isUnread: (d: string) => boolean;
  onItemClick: (item: NotificationItem) => void;
}) {
  if (items.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação.</p>;
  }
  return (
    <div className="divide-y">
      {items.map((item) => (
        <button
          key={`${item.type}-${item.id}`}
          onClick={() => onItemClick(item)}
          className={`w-full text-left p-3 text-sm hover:bg-muted/50 transition-colors cursor-pointer ${isUnread(item.created_at) ? "bg-secondary/50" : ""}`}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] text-primary-foreground px-1.5 py-0.5 rounded font-body ${typeColor[item.type]}`}>
              {typeLabel[item.type]}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
          </div>
          <p className="font-body text-sm line-clamp-2">{item.title}</p>
        </button>
      ))}
    </div>
  );
}

function NotificationHeader({ unreadCount, onClearAll }: { unreadCount: number; onClearAll: () => void }) {
  return (
    <div className="p-3 border-b flex items-center justify-between">
      <span className="font-heading font-bold text-sm">Notificações</span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <CheckCheck className="w-3.5 h-3.5" />
            Limpar tudo
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar notificações?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as notificações serão marcadas como lidas e a lista será limpa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onClearAll}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}