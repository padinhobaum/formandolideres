import { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserXp } from "@/hooks/useUserXp";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/UserAvatar";
import SalaBadge from "@/components/SalaBadge";
import { RichText } from "@/components/RichTextEditor";
import ForumRanking from "@/components/ForumRanking";
import ForumComposer from "@/components/forum/ForumComposer";
import PostCard, { FeaturedCard, FeedTopic } from "@/components/forum/PostCard";
import DiscoveryRow from "@/components/forum/DiscoveryRow";
import ReactionBar from "@/components/forum/ReactionBar";
import SaveButton from "@/components/forum/SaveButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Compass, Users, GraduationCap, Bookmark, Send, ImagePlus, Reply, Heart, X, Trash2, Circle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendPushNotification } from "@/lib/sendPushNotification";

interface ForumCategory { id: string; name: string; color: string | null; }
interface ForumReply {
  id: string; topic_id: string; content: string; author_id: string;
  author_name: string; author_avatar_url: string | null; image_url: string | null;
  parent_reply_id: string | null; created_at: string;
  like_count: number; liked_by_me: boolean;
}
interface PollOption { id: string; topic_id: string; label: string; sort_order: number; vote_count: number; voted: boolean; }
interface OnlineUser { user_id: string; full_name: string; avatar_url: string | null; class_name: string | null; role?: string; }

type TabKey = "explorar" | "minha-escola" | "seguindo" | "salvos";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "explorar", label: "Explorar", icon: Compass },
  { key: "minha-escola", label: "Minha Escola", icon: GraduationCap },
  { key: "seguindo", label: "Seguindo", icon: Users },
  { key: "salvos", label: "Salvos", icon: Bookmark },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ForumPage() {
  const { user, profile, isAdmin } = useAuth();
  const { awardXp } = useUserXp();
  const [searchParams, setSearchParams] = useSearchParams();

  const [topics, setTopics] = useState<FeedTopic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, string | null>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  const [activeTab, setActiveTab] = useState<TabKey>("explorar");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");

  // Detail dialog
  const [detailTopicId, setDetailTopicId] = useState<string | null>(null);
  const [detailReplies, setDetailReplies] = useState<ForumReply[]>([]);
  const [detailPoll, setDetailPoll] = useState<PollOption[]>([]);
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const deepLinked = useRef(false);

  // ---------- Fetchers ----------
  const fetchCategories = async () => {
    const { data } = await supabase.from("forum_categories").select("*").order("sort_order");
    if (data) setCategories(data as ForumCategory[]);
  };

  const fetchTopics = async () => {
    const { data } = await supabase
      .from("forum_topics")
      .select("*, forum_categories(name, color)")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(120);
    if (!data) return;

    const topicIds = data.map((t: any) => t.id);
    const safeIds = topicIds.length > 0 ? topicIds : ["__none__"];

    const [repliesRes, reactionsRes, authorsRes] = await Promise.all([
      supabase.from("forum_replies").select("topic_id").in("topic_id", safeIds),
      (supabase as any).from("topic_reactions").select("topic_id").in("topic_id", safeIds),
      supabase.from("profiles").select("user_id, class_name").in("user_id", [...new Set(data.map((t: any) => t.author_id))]),
    ]);

    const replyCounts: Record<string, number> = {};
    repliesRes.data?.forEach((r: any) => { replyCounts[r.topic_id] = (replyCounts[r.topic_id] || 0) + 1; });
    const rxCounts: Record<string, number> = {};
    reactionsRes.data?.forEach((r: any) => { rxCounts[r.topic_id] = (rxCounts[r.topic_id] || 0) + 1; });
    setReactionCounts(rxCounts);

    const classMap: Record<string, string | null> = {};
    authorsRes.data?.forEach((p: any) => { classMap[p.user_id] = p.class_name; });
    setAuthorProfiles(classMap);

    const enriched: FeedTopic[] = data.map((t: any) => ({
      ...t,
      reply_count: replyCounts[t.id] || 0,
      author_class: classMap[t.author_id] || null,
      category_name: t.forum_categories?.name || null,
      category_color: t.forum_categories?.color || null,
    }));
    setTopics(enriched);
  };

  const fetchSaved = async () => {
    if (!user) return;
    const { data } = await (supabase as any).from("topic_saves").select("topic_id").eq("user_id", user.id);
    setSavedIds(new Set((data || []).map((d: any) => d.topic_id)));
  };

  const fetchOnline = async () => {
    const cutoff = new Date(Date.now() - 90_000).toISOString();
    const { data: presence } = await supabase
      .from("user_presence").select("user_id, last_seen")
      .eq("is_online", true).gte("last_seen", cutoff);
    const ids = (presence || []).map((p: any) => p.user_id);
    if (ids.length === 0) { setOnlineUsers([]); return; }
    const [profsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, avatar_url, class_name").in("user_id", ids),
      supabase.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const rmap: Record<string, string> = {};
    rolesRes.data?.forEach((r: any) => { rmap[r.user_id] = r.role; });
    setOnlineUsers((profsRes.data || []).map((p: any) => ({ ...p, role: rmap[p.user_id] || "leader" })));
  };

  useEffect(() => { fetchCategories(); fetchTopics(); }, []);
  useEffect(() => { if (user) { fetchSaved(); fetchOnline(); } }, [user?.id]);

  // Realtime: refresh feed on new topics
  useEffect(() => {
    const ch = supabase.channel("forum-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "forum_topics" }, () => fetchTopics())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Deep link
  useEffect(() => {
    const t = searchParams.get("topic");
    if (t && topics.length && !deepLinked.current) {
      deepLinked.current = true;
      openDetail(t);
      searchParams.delete("topic");
      setSearchParams(searchParams, { replace: true });
    }
  }, [topics, searchParams]);

  // ---------- Actions ----------
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("forum_topics").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir.");
    toast.success("Publicação excluída.");
    fetchTopics();
    if (detailTopicId === id) setDetailTopicId(null);
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    const { error } = await supabase.from("forum_topics").update({ is_pinned: !current } as any).eq("id", id);
    if (error) return toast.error("Erro.");
    toast.success(current ? "Desafixado." : "Fixado!");
    fetchTopics();
  };

  // ---------- Detail dialog ----------
  const openDetail = async (id: string) => {
    setDetailTopicId(id);
    setReplyingTo(null); setReplyText(""); setReplyImage(null);
    await loadReplies(id);
    const topic = topics.find((t) => t.id === id);
    if (topic?.is_poll) await loadPoll(id);
    else setDetailPoll([]);
  };

  const loadReplies = async (topicId: string) => {
    const { data: rd } = await supabase.from("forum_replies").select("*").eq("topic_id", topicId).order("created_at");
    if (!rd) return;
    const ids = rd.map((r: any) => r.id);
    let likes: any[] = [];
    if (ids.length) {
      const { data } = await supabase.from("reply_likes").select("reply_id, user_id").in("reply_id", ids);
      likes = data || [];
    }
    const enriched = rd.map((r: any) => ({
      ...r,
      like_count: likes.filter((l) => l.reply_id === r.id).length,
      liked_by_me: likes.some((l) => l.reply_id === r.id && l.user_id === user?.id),
    }));
    setDetailReplies(enriched);
    const authorIds = [...new Set(rd.map((r: any) => r.author_id))];
    if (authorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, class_name").in("user_id", authorIds);
      profs?.forEach((p: any) => { setAuthorProfiles((prev) => ({ ...prev, [p.user_id]: p.class_name })); });
    }
  };

  const loadPoll = async (topicId: string) => {
    const { data: options } = await supabase.from("poll_options").select("*").eq("topic_id", topicId).order("sort_order");
    if (!options?.length) return;
    const optIds = options.map((o: any) => o.id);
    const { data: votes } = await supabase.from("poll_votes").select("option_id, user_id").in("option_id", optIds);
    setDetailPoll(options.map((o: any) => ({
      ...o,
      vote_count: votes?.filter((v: any) => v.option_id === o.id).length || 0,
      voted: votes?.some((v: any) => v.option_id === o.id && v.user_id === user?.id) || false,
    })));
  };

  const handleVote = async (optionId: string, voted: boolean) => {
    if (!user || !detailTopicId) return;
    if (voted) await supabase.from("poll_votes").delete().eq("option_id", optionId).eq("user_id", user.id);
    else await supabase.from("poll_votes").insert({ option_id: optionId, user_id: user.id } as any);
    loadPoll(detailTopicId);
  };

  const uploadReplyImage = async (file: File) => {
    const path = `${user!.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("forum_images").upload(path, file);
    if (error) { toast.error("Erro ao enviar imagem."); return null; }
    return supabase.storage.from("forum_images").getPublicUrl(path).data.publicUrl;
  };

  const handleReply = async () => {
    if (!replyText.trim() || !user || !detailTopicId) return;
    let img: string | null = null;
    if (replyImage) img = await uploadReplyImage(replyImage);
    const { error } = await supabase.from("forum_replies").insert({
      topic_id: detailTopicId, content: replyText.trim(), author_id: user.id,
      author_name: profile?.full_name || "", author_avatar_url: profile?.avatar_url || null,
      image_url: img, parent_reply_id: replyingTo?.id || null,
    } as any);
    if (error) return toast.error("Erro ao responder.");
    if (!isAdmin) await awardXp("reply_topic", `${detailTopicId}_${Date.now()}`, 10);
    setReplyText(""); setReplyImage(null); setReplyingTo(null);
    await loadReplies(detailTopicId);
    fetchTopics();
  };

  const handleToggleLike = async (replyId: string, liked: boolean) => {
    if (!user || !detailTopicId) return;
    if (liked) await supabase.from("reply_likes").delete().eq("reply_id", replyId).eq("user_id", user.id);
    else await supabase.from("reply_likes").insert({ reply_id: replyId, user_id: user.id } as any);
    loadReplies(detailTopicId);
  };

  const handleDeleteReply = async (id: string) => {
    const { error } = await supabase.from("forum_replies").delete().eq("id", id);
    if (error) return toast.error("Erro.");
    if (detailTopicId) loadReplies(detailTopicId);
  };

  // ---------- Filtering / sections ----------
  const filtered = useMemo(() => {
    let arr = topics;
    if (selectedCategory !== "all") arr = arr.filter((t) => t.category_id === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.author_name.toLowerCase().includes(q)
      );
    }
    if (activeTab === "minha-escola" && profile?.class_name) {
      arr = arr.filter((t) => authorProfiles[t.author_id] === profile.class_name);
    }
    if (activeTab === "salvos") {
      arr = arr.filter((t) => savedIds.has(t.id));
    }
    if (activeTab === "seguindo") {
      // No follow data yet — show self + pinned
      arr = arr.filter((t) => t.author_id === user?.id || t.is_pinned);
    }
    return arr;
  }, [topics, selectedCategory, search, activeTab, profile, authorProfiles, savedIds, user]);

  const sections = useMemo(() => {
    if (activeTab !== "explorar" || search.trim() || selectedCategory !== "all") return null;
    const sevenDaysAgo = Date.now() - 7 * 86400_000;
    const oneDayAgo = Date.now() - 86400_000;

    const featured = [...topics]
      .filter((t) => t.is_pinned || (reactionCounts[t.id] || 0) >= 3)
      .sort((a, b) => (reactionCounts[b.id] || 0) - (reactionCounts[a.id] || 0))
      .slice(0, 6);

    const fromSchool = profile?.class_name
      ? topics.filter((t) => authorProfiles[t.author_id] === profile.class_name).slice(0, 6)
      : [];

    const recent = [...topics]
      .filter((t) => new Date(t.created_at).getTime() > oneDayAgo)
      .slice(0, 6);

    const mostLiked = [...topics]
      .filter((t) => new Date(t.created_at).getTime() > sevenDaysAgo)
      .sort((a, b) => (reactionCounts[b.id] || 0) - (reactionCounts[a.id] || 0))
      .filter((t) => (reactionCounts[t.id] || 0) > 0)
      .slice(0, 6);

    const newLeaders = topics
      .filter((t) => !t.is_pinned)
      .reduce<FeedTopic[]>((acc, t) => {
        if (!acc.find((x) => x.author_id === t.author_id)) acc.push(t);
        return acc;
      }, [])
      .slice(-6)
      .reverse();

    return { featured, fromSchool, recent, mostLiked, newLeaders };
  }, [topics, reactionCounts, profile, authorProfiles, activeTab, search, selectedCategory]);

  const currentTopic = topics.find((t) => t.id === detailTopicId) || null;
  const threadedReplies = useMemo(() => {
    const top = detailReplies.filter((r) => !r.parent_reply_id);
    const children: Record<string, ForumReply[]> = {};
    detailReplies.filter((r) => r.parent_reply_id).forEach((r) => {
      (children[r.parent_reply_id!] ||= []).push(r);
    });
    return { top, children };
  }, [detailReplies]);

  // ---------- Render ----------
  return (
    <AppLayout>
      <div className="w-full flex flex-col lg:flex-row gap-6">
        {/* Main column */}
        <div className="flex-1 min-w-0 max-w-3xl w-full space-y-5">
          {/* Header: title + search */}
          <header className="space-y-3">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-accent leading-tight">
                Fórum de Líderes
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Conecte, inspire e construa junto com a comunidade ✨
              </p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar discussões, líderes, ideias..."
                className="pl-10 h-11 rounded-full bg-muted/40 border-border focus-visible:ring-primary/30"
              />
            </div>
          </header>

          {/* Sticky tabs */}
          <nav className="sticky top-0 z-20 -mx-4 px-4 sm:mx-0 sm:px-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 py-2 border-b border-border">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Composer */}
          <ForumComposer categories={categories} onCreated={fetchTopics} />

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                  selectedCategory === "all"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card border-border hover:border-foreground/40"
                )}
              >
                Todas
              </button>
              {categories.map((c) => {
                const active = selectedCategory === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                      active ? "text-white" : "hover:opacity-80"
                    )}
                    style={
                      active && c.color
                        ? { backgroundColor: c.color, borderColor: c.color }
                        : c.color
                        ? { color: c.color, borderColor: `${c.color}50`, backgroundColor: `${c.color}10` }
                        : {}
                    }
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Discovery sections (only on Explorar/no filter) */}
          {sections && (
            <div className="space-y-6">
              {sections.featured.length > 0 && (
                <DiscoveryRow title="Em destaque" emoji="🔥" hint="Hot" pulse>
                  {sections.featured.map((t, i) => (
                    <FeaturedCard
                      key={t.id}
                      topic={t}
                      onOpen={openDetail}
                      accent={(["primary", "accent", "purple", "rose"] as const)[i % 4]}
                    />
                  ))}
                </DiscoveryRow>
              )}
              {sections.fromSchool.length > 0 && (
                <DiscoveryRow title="Da sua escola" emoji="👥" hint={profile?.class_name || ""}>
                  {sections.fromSchool.map((t) => (
                    <FeaturedCard key={t.id} topic={t} onOpen={openDetail} accent="accent" />
                  ))}
                </DiscoveryRow>
              )}
              {sections.mostLiked.length > 0 && (
                <DiscoveryRow title="Mais curtidos" emoji="⭐" hint="7 dias">
                  {sections.mostLiked.map((t) => (
                    <FeaturedCard key={t.id} topic={t} onOpen={openDetail} accent="purple" />
                  ))}
                </DiscoveryRow>
              )}
              {sections.newLeaders.length > 0 && (
                <DiscoveryRow title="Novos líderes participando" emoji="🚀">
                  {sections.newLeaders.map((t) => (
                    <FeaturedCard key={t.id} topic={t} onOpen={openDetail} accent="rose" />
                  ))}
                </DiscoveryRow>
              )}
            </div>
          )}

          {/* Main feed */}
          <section className="space-y-1">
            <h2 className="font-heading font-bold text-base sm:text-lg flex items-center gap-2 pt-2">
              <span aria-hidden>💬</span> Conversas recentes
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({filtered.length})
              </span>
            </h2>
            {filtered.length === 0 ? (
              <div className="border bg-card rounded-3xl p-10 text-center">
                <p className="text-4xl mb-3">🌱</p>
                <p className="font-heading font-bold text-base">Nada por aqui ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "salvos"
                    ? "Você ainda não salvou nenhuma publicação."
                    : "Seja o primeiro a publicar algo!"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 mt-3">
                {filtered.map((t) => (
                  <PostCard
                    key={t.id}
                    topic={t}
                    onOpen={openDetail}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                    canManage={t.author_id === user?.id || isAdmin}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-4 mt-[6.5rem]">
          {/* Online users */}
          <section className="border bg-card rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Circle className="w-3 h-3 text-accent fill-accent" />
              <h3 className="font-heading font-bold text-sm">
                Online agora ({onlineUsers.length})
              </h3>
            </div>
            {onlineUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ninguém por aqui ainda.</p>
            ) : (
              <div className="space-y-2">
                {onlineUsers.slice(0, 8).map((u) => (
                  <div key={u.user_id} className="flex items-center gap-2">
                    <div className="relative">
                      <UserAvatar
                        userId={u.user_id} name={u.full_name} avatarUrl={u.avatar_url}
                        sala={u.class_name}
                        className="w-7 h-7"
                        fallbackClassName="text-[9px] bg-primary text-primary-foreground"
                      />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-accent rounded-full ring-2 ring-card" />
                    </div>
                    <span className="text-xs font-body truncate flex-1">{u.full_name.split(" ")[0]}</span>
                    {u.role === "admin" && (
                      <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 rounded uppercase">Admin</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          <ForumRanking />
        </aside>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailTopicId} onOpenChange={(o) => !o && setDetailTopicId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {currentTopic && (
            <>
              <DialogHeader className="px-5 sm:px-6 pt-5 pb-3 border-b border-border sticky top-0 bg-card/95 backdrop-blur z-10">
                <DialogTitle className="font-heading text-base sm:text-lg pr-8 text-left">
                  {currentTopic.title}
                </DialogTitle>
              </DialogHeader>

              <div className="px-5 sm:px-6 py-4 space-y-4">
                {/* Author */}
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userId={currentTopic.author_id}
                    name={currentTopic.author_name}
                    avatarUrl={currentTopic.author_avatar_url}
                    sala={authorProfiles[currentTopic.author_id]}
                    className="w-11 h-11"
                    fallbackClassName="bg-primary text-primary-foreground"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-heading font-bold text-sm">{currentTopic.author_name}</span>
                      <SalaBadge sala={authorProfiles[currentTopic.author_id]} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(currentTopic.created_at)}</p>
                  </div>
                  <SaveButton topicId={currentTopic.id} />
                </div>

                {/* Image */}
                {currentTopic.image_url && (
                  <img
                    src={currentTopic.image_url} alt=""
                    className="w-full max-h-96 object-contain rounded-2xl bg-muted"
                    loading="lazy"
                  />
                )}

                {/* Content */}
                <div className="font-heading text-base leading-relaxed break-words">
                  <RichText content={currentTopic.content} />
                </div>

                {/* Poll */}
                {currentTopic.is_poll && detailPoll.length > 0 && (
                  <div className="border bg-muted/30 rounded-2xl p-3 space-y-2">
                    {(() => {
                      const total = detailPoll.reduce((s, o) => s + o.vote_count, 0);
                      return (
                        <>
                          {detailPoll.map((opt) => {
                            const pct = total > 0 ? Math.round((opt.vote_count / total) * 100) : 0;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleVote(opt.id, opt.voted)}
                                className={cn(
                                  "w-full text-left rounded-xl p-3 text-sm relative overflow-hidden transition-colors border",
                                  opt.voted ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted"
                                )}
                              >
                                <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all" style={{ width: `${pct}%` }} />
                                <div className="relative flex justify-between items-center">
                                  <span className="font-body">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground">{opt.vote_count} ({pct}%)</span>
                                </div>
                              </button>
                            );
                          })}
                          <p className="text-xs text-muted-foreground text-center">{total} voto(s)</p>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Reactions */}
                <div className="pt-2 border-t border-border">
                  <ReactionBar topicId={currentTopic.id} />
                </div>

                {/* Replies */}
                <div className="pt-2">
                  <h4 className="font-heading font-bold text-sm mb-2">
                    {detailReplies.length} comentário{detailReplies.length !== 1 ? "s" : ""}
                  </h4>
                  {threadedReplies.top.length > 0 && (
                    <div className="space-y-1">
                      {threadedReplies.top.map((reply) => (
                        <div key={reply.id}>
                          {renderReply(reply, false)}
                          {threadedReplies.children[reply.id]?.map((c) => renderReply(c, true))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Reply composer */}
              <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border p-3 space-y-2">
                {replyingTo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5">
                    <Reply className="w-3 h-3" />
                    Respondendo a <strong className="text-foreground">{replyingTo.name}</strong>
                    <button onClick={() => setReplyingTo(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                  </div>
                )}
                {replyImage && (
                  <div className="relative inline-block">
                    <img src={URL.createObjectURL(replyImage)} alt="" className="max-h-24 rounded-lg" />
                    <button onClick={() => setReplyImage(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <label className="flex-shrink-0 cursor-pointer flex items-center justify-center h-10 w-10 rounded-full border border-input hover:bg-muted">
                    <ImagePlus className="w-4 h-4 text-muted-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setReplyImage(e.target.files?.[0] || null)} />
                  </label>
                  <Input
                    placeholder={replyingTo ? `Resposta para ${replyingTo.name}...` : "Escreva um comentário..."}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    className="h-10 rounded-full"
                  />
                  <Button onClick={handleReply} size="icon" className="rounded-full h-10 w-10 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );

  // ---------- Reply renderer ----------
  function renderReply(reply: ForumReply, isChild: boolean) {
    return (
      <div key={reply.id} className={cn("flex gap-2.5 py-3", isChild ? "pl-10" : "border-t border-border first:border-t-0")}>
        <UserAvatar
          userId={reply.author_id} name={reply.author_name} avatarUrl={reply.author_avatar_url}
          sala={authorProfiles[reply.author_id]}
          className="w-8 h-8 flex-shrink-0 mt-0.5"
          fallbackClassName="text-[9px] bg-primary text-primary-foreground"
        />
        <div className="flex-1 min-w-0">
          <div className="bg-muted/40 rounded-2xl rounded-tl-md px-3 py-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-heading font-bold text-xs">{reply.author_name}</span>
              <SalaBadge sala={authorProfiles[reply.author_id]} />
            </div>
            {reply.parent_reply_id && (
              <p className="text-[10px] text-muted-foreground">
                respondendo a <span className="text-primary font-semibold">
                  {detailReplies.find((r) => r.id === reply.parent_reply_id)?.author_name || "..."}
                </span>
              </p>
            )}
            <div className="mt-1 text-sm break-words"><RichText content={reply.content} /></div>
            {reply.image_url && (
              <img src={reply.image_url} alt="" className="mt-2 max-w-xs max-h-48 rounded-xl" loading="lazy" />
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 px-2">
            <span className="text-[10px] text-muted-foreground">{formatDate(reply.created_at)}</span>
            <button
              onClick={() => handleToggleLike(reply.id, reply.liked_by_me)}
              className={cn("flex items-center gap-1 text-[11px] font-semibold transition-colors",
                reply.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-destructive")}
            >
              <Heart className={cn("w-3 h-3", reply.liked_by_me && "fill-current")} />
              {reply.like_count > 0 && reply.like_count}
            </button>
            <button
              onClick={() => setReplyingTo({ id: reply.id, name: reply.author_name })}
              className="text-[11px] font-semibold text-muted-foreground hover:text-primary"
            >
              Responder
            </button>
            {(reply.author_id === user?.id || isAdmin) && (
              <button
                onClick={() => handleDeleteReply(reply.id)}
                className="text-muted-foreground hover:text-destructive ml-auto"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
