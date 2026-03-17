import { useEffect, useState, useCallback, useRef } from "react";
import { useUserXp } from "@/hooks/useUserXp";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  MessageSquare, Plus, ThumbsUp, BarChart3, Send, Trash2, ChevronDown, ChevronUp, Circle, ImagePlus, Reply, Heart, X, Filter, Pin } from
"lucide-react";
import { Badge } from "@/components/ui/badge";
import RichTextEditor, { RichText } from "@/components/RichTextEditor";
import SalaBadge from "@/components/SalaBadge";
import ForumRanking from "@/components/ForumRanking";

interface ForumCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
}

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  image_url: string | null;
  is_poll: boolean;
  is_pinned: boolean;
  category_id: string | null;
  category_name?: string;
  category_color?: string | null;
  created_at: string;
  reply_count?: number;
}

interface ForumReply {
  id: string;
  topic_id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  image_url: string | null;
  parent_reply_id: string | null;
  created_at: string;
  like_count: number;
  liked_by_me: boolean;
}

interface PollOption {
  id: string;
  topic_id: string;
  label: string;
  sort_order: number;
  vote_count: number;
  voted: boolean;
}

interface OnlineUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role?: string;
  class_name?: string | null;
}

export default function ForumPage() {
  const { user, profile, isAdmin } = useAuth();
  const { awardXp } = useUserXp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const deepLinked = useRef(false);
  const [replies, setReplies] = useState<Record<string, ForumReply[]>>({});
  const [authorProfiles, setAuthorProfiles] = useState<Record<string, string | null>>({});
  const [pollData, setPollData] = useState<Record<string, PollOption[]>>({});
  const [replyText, setReplyText] = useState("");
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<{id: string;name: string;} | null>(null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // New topic form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [newCategoryId, setNewCategoryId] = useState<string>("");

  const uploadImage = async (file: File): Promise<string | null> => {
    const path = `${user!.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("forum_images").upload(path, file);
    if (error) {toast.error("Erro ao enviar imagem.");return null;}
    const { data } = supabase.storage.from("forum_images").getPublicUrl(path);
    return data.publicUrl;
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("forum_categories").select("*").order("sort_order");
    if (data) setCategories(data as ForumCategory[]);
  };

  const fetchTopics = async () => {
    const { data } = await supabase.
    from("forum_topics").
    select("*, forum_categories(name, color)").
    order("is_pinned", { ascending: false }).
    order("created_at", { ascending: false });
    if (!data) return;

    const topicIds = data.map((t: any) => t.id);
    const { data: repliesData } = await supabase.
    from("forum_replies").
    select("topic_id").
    in("topic_id", topicIds.length > 0 ? topicIds : ["__none__"]);

    const countMap: Record<string, number> = {};
    repliesData?.forEach((r: any) => {
      countMap[r.topic_id] = (countMap[r.topic_id] || 0) + 1;
    });

    const topicsData = data.map((t: any) => ({
      ...t,
      reply_count: countMap[t.id] || 0,
      category_name: t.forum_categories?.name || null,
      category_color: t.forum_categories?.color || null
    }));
    setTopics(topicsData);

    // Fetch class_name for all topic authors
    const authorIds = [...new Set(topicsData.map((t: any) => t.author_id))];
    if (authorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, class_name").in("user_id", authorIds);
      if (profs) {
        setAuthorProfiles((prev) => {
          const next = { ...prev };
          profs.forEach((p: any) => {next[p.user_id] = p.class_name;});
          return next;
        });
      }
    }
  };

  const fetchOnlineUsers = async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: presenceData } = await supabase.
    from("user_presence").
    select("user_id").
    eq("is_online", true).
    gte("last_seen", fiveMinAgo);

    if (!presenceData || presenceData.length === 0) {
      setOnlineUsers([]);
      return;
    }

    const userIds = presenceData.map((p: any) => p.user_id);
    const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("user_id, full_name, avatar_url, class_name").in("user_id", userIds),
    supabase.from("user_roles").select("user_id, role").in("user_id", userIds)]
    );

    const rolesMap: Record<string, string> = {};
    rolesRes.data?.forEach((r: any) => {rolesMap[r.user_id] = r.role;});

    if (profilesRes.data) {
      setOnlineUsers(profilesRes.data.map((p: any) => ({
        ...p,
        role: rolesMap[p.user_id] || "leader"
      })));
    }
  };

  useEffect(() => {
    fetchTopics();
    fetchCategories();
    fetchOnlineUsers();

    const channel = supabase.
    channel("presence-changes").
    on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
      fetchOnlineUsers();
    }).
    subscribe();

    return () => {supabase.removeChannel(channel);};
  }, []);

  // Deep-link: auto-expand topic from URL param
  useEffect(() => {
    const topicId = searchParams.get("topic");
    if (topicId && topics.length > 0 && !deepLinked.current) {
      deepLinked.current = true;
      handleExpandTopic(topicId);
      searchParams.delete("topic");
      setSearchParams(searchParams, { replace: true });
      setTimeout(() => {
        document.getElementById(`topic-${topicId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [topics, searchParams]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user) return;

    let imageUrl: string | null = null;
    if (newImage) {
      imageUrl = await uploadImage(newImage);
    }

    const { data: topicData, error } = await supabase.from("forum_topics").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      is_poll: isPoll,
      image_url: imageUrl,
      category_id: newCategoryId || null
    } as any).select().single();

    if (error) {toast.error("Erro ao criar tópico.");return;}

    if (isPoll && topicData) {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length >= 2) {
        await supabase.from("poll_options").insert(
          validOptions.map((label, i) => ({
            topic_id: (topicData as any).id,
            label: label.trim(),
            sort_order: i
          })) as any
        );
      }
    }

    toast.success("Tópico criado!");
    // Award 20 XP for creating a topic
    if (topicData) await awardXp("create_topic", (topicData as any).id, 20);
    setNewTitle("");setNewContent("");setNewImage(null);setIsPoll(false);setPollOptions(["", ""]);setNewCategoryId("");setShowNewTopic(false);
    fetchTopics();
  };

  const fetchRepliesWithLikes = async (topicId: string) => {
    const { data: repliesData } = await supabase.
    from("forum_replies").
    select("*").
    eq("topic_id", topicId).
    order("created_at");

    if (!repliesData) return;

    const replyIds = repliesData.map((r: any) => r.id);
    let likesData: any[] = [];
    if (replyIds.length > 0) {
      const { data } = await supabase.
      from("reply_likes").
      select("reply_id, user_id").
      in("reply_id", replyIds);
      likesData = data || [];
    }

    const enriched: ForumReply[] = repliesData.map((r: any) => ({
      ...r,
      like_count: likesData.filter((l) => l.reply_id === r.id).length,
      liked_by_me: likesData.some((l) => l.reply_id === r.id && l.user_id === user?.id)
    }));

    setReplies((prev) => ({ ...prev, [topicId]: enriched }));

    // Fetch class_name for reply authors
    const replyAuthorIds = [...new Set(repliesData.map((r: any) => r.author_id))];
    if (replyAuthorIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, class_name").in("user_id", replyAuthorIds);
      if (profs) {
        setAuthorProfiles((prev) => {
          const next = { ...prev };
          profs.forEach((p: any) => {next[p.user_id] = p.class_name;});
          return next;
        });
      }
    }
  };

  const handleExpandTopic = async (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
      return;
    }
    setExpandedTopicId(topicId);
    setReplyingTo(null);
    setReplyText("");
    setReplyImage(null);

    await fetchRepliesWithLikes(topicId);

    const topic = topics.find((t) => t.id === topicId);
    if (topic?.is_poll) {
      const { data: options } = await supabase.
      from("poll_options").
      select("*").
      eq("topic_id", topicId).
      order("sort_order");

      if (options && options.length > 0) {
        const optionIds = options.map((o: any) => o.id);
        const { data: votes } = await supabase.
        from("poll_votes").
        select("option_id, user_id").
        in("option_id", optionIds);

        const enriched = options.map((o: any) => ({
          ...o,
          vote_count: votes?.filter((v: any) => v.option_id === o.id).length || 0,
          voted: votes?.some((v: any) => v.option_id === o.id && v.user_id === user?.id) || false
        }));
        setPollData((prev) => ({ ...prev, [topicId]: enriched }));
      }
    }
  };

  const handleReply = async (topicId: string) => {
    if (!replyText.trim() || !user) return;

    let imageUrl: string | null = null;
    if (replyImage) {
      imageUrl = await uploadImage(replyImage);
    }

    const { error } = await supabase.from("forum_replies").insert({
      topic_id: topicId,
      content: replyText.trim(),
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      image_url: imageUrl,
      parent_reply_id: replyingTo?.id || null
    } as any);
    if (error) {toast.error("Erro ao responder.");return;}
    // Award 10 XP for replying
    await awardXp("reply_topic", `${topicId}_${Date.now()}`, 10);
    setReplyText("");
    setReplyImage(null);
    setReplyingTo(null);
    await fetchRepliesWithLikes(topicId);
    fetchTopics();
  };

  const handleToggleLike = async (replyId: string, topicId: string, alreadyLiked: boolean) => {
    if (!user) return;
    if (alreadyLiked) {
      await supabase.from("reply_likes").delete().eq("reply_id", replyId).eq("user_id", user.id);
    } else {
      await supabase.from("reply_likes").insert({ reply_id: replyId, user_id: user.id } as any);
    }
    await fetchRepliesWithLikes(topicId);
  };

  const handleVote = async (optionId: string, topicId: string, alreadyVoted: boolean) => {
    if (!user) return;
    if (alreadyVoted) {
      await supabase.from("poll_votes").delete().eq("option_id", optionId).eq("user_id", user.id);
    } else {
      await supabase.from("poll_votes").insert({ option_id: optionId, user_id: user.id } as any);
    }
    handleExpandTopic(topicId);
  };

  const handleDeleteTopic = async (id: string) => {
    const { error } = await supabase.from("forum_topics").delete().eq("id", id);
    if (error) {toast.error("Erro ao excluir.");return;}
    toast.success("Tópico excluído.");
    fetchTopics();
  };

  const handleTogglePin = async (topicId: string, currentlyPinned: boolean) => {
    const { error } = await supabase.from("forum_topics").update({ is_pinned: !currentlyPinned } as any).eq("id", topicId);
    if (error) {toast.error("Erro ao fixar/desafixar.");return;}
    toast.success(currentlyPinned ? "Tópico desafixado." : "Tópico fixado!");
    fetchTopics();
  };

  const handleDeleteReply = async (replyId: string, topicId: string) => {
    const { error } = await supabase.from("forum_replies").delete().eq("id", replyId);
    if (error) {toast.error("Erro ao excluir resposta.");return;}
    toast.success("Resposta excluída.");
    await fetchRepliesWithLikes(topicId);
  };

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  // Group replies: top-level and nested
  const getThreadedReplies = (topicId: string) => {
    const all = replies[topicId] || [];
    const topLevel = all.filter((r) => !r.parent_reply_id);
    const childrenMap: Record<string, ForumReply[]> = {};
    all.filter((r) => r.parent_reply_id).forEach((r) => {
      if (!childrenMap[r.parent_reply_id!]) childrenMap[r.parent_reply_id!] = [];
      childrenMap[r.parent_reply_id!].push(r);
    });
    return { topLevel, childrenMap };
  };

  const renderReply = (reply: ForumReply, topicId: string, isChild = false) =>
  <div key={reply.id} className={`flex gap-2 sm:gap-3 ${isChild ? "pl-6 sm:pl-10" : ""} py-3 ${!isChild ? "border-t border-border" : ""}`}>
      <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 mt-0.5">
        <AvatarImage src={reply.author_avatar_url || undefined} />
        <AvatarFallback className="text-[9px] bg-primary text-primary-foreground font-bold">
          {getInitials(reply.author_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span className="font-heading font-bold text-xs sm:text-sm">{reply.author_name}</span>
          <SalaBadge sala={authorProfiles[reply.author_id]} />
          <span className="text-muted-foreground text-[10px] sm:text-xs">· {formatDate(reply.created_at)}</span>
        </div>
        {reply.parent_reply_id &&
      <p className="text-muted-foreground text-[10px] sm:text-xs mt-0.5">
            respondendo a <span className="text-primary font-medium">{replies[topicId]?.find((r) => r.id === reply.parent_reply_id)?.author_name || "..."}</span>
          </p>
      }
        <div className="mt-1 text-xs sm:text-sm leading-relaxed break-words"><RichText content={reply.content} /></div>
        {reply.image_url &&
      <img src={reply.image_url} alt="" className="mt-2 max-w-full sm:max-w-xs max-h-48 rounded-xl object-cover" loading="lazy" />
      }
        <div className="flex items-center gap-3 sm:gap-4 mt-2">
          <button
          onClick={() => handleToggleLike(reply.id, topicId, reply.liked_by_me)}
          className={`flex items-center gap-1 text-xs transition-colors ${
          reply.liked_by_me ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`
          }>
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${reply.liked_by_me ? "fill-current" : ""}`} />
            {reply.like_count > 0 && <span>{reply.like_count}</span>}
          </button>
          <button
          onClick={() => setReplyingTo({ id: reply.id, name: reply.author_name })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Responder</span>
          </button>
          {(reply.author_id === user?.id || isAdmin) &&
        <button
          onClick={() => handleDeleteReply(reply.id, topicId)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
        }
        </div>
      </div>
    </div>;

  return (
    <AppLayout>
      <div className="w-full flex flex-col lg:flex-row gap-4 lg:gap-6">
      <div className="flex-1 min-w-0 max-w-3xl mx-auto w-full">
        <h2 className="font-heading font-bold mb-1 text-2xl sm:text-3xl lg:text-4xl text-accent">Fórum de Líderes</h2>
        <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg">Discussões, perguntas e enquetes</p>

        {/* Online Users - mobile/tablet only */}
        <section className="mb-4 border bg-card rounded-xl p-4 space-y-4 lg:hidden">
          {(() => {
              const adminsOnline = onlineUsers.filter((u) => u.role === "admin");
              const leadersOnline = onlineUsers.filter((u) => u.role !== "admin");

              const renderGroup = (users: OnlineUser[], label: string) =>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-3 h-3 text-accent fill-accent" />
                  <h3 className="font-heading font-bold text-sm">
                    {label} ({users.length})
                  </h3>
                </div>
                {users.length === 0 ?
                <p className="text-xs text-muted-foreground">Nenhum online no momento.</p> :
                <div className="flex flex-wrap gap-3">
                    {users.map((u) =>
                  <div key={u.user_id} className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {getInitials(u.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-card" />
                        </div>
                        <span className="text-xs font-body">{u.full_name.split(" ")[0]}</span>
                        <SalaBadge sala={u.class_name} />
                      </div>
                  )}
                  </div>
                }
              </div>;

              return (
                <>
                {renderGroup(adminsOnline, "Administradores Online")}
                {renderGroup(leadersOnline, "Líderes Online")}
              </>);
            })()}
        </section>

        {/* New Topic + Category Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowNewTopic(!showNewTopic)} size="sm" className="rounded-full px-5">
            <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
            Novo Tópico
          </Button>
          {categories.length > 0 &&
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="border bg-background px-3 py-1.5 text-sm font-body rounded-full h-9">
                <option value="all">Todas</option>
                {categories.map((c) =>
                <option key={c.id} value={c.id}>{c.name}</option>
                )}
              </select>
            </div>
            }
        </div>

        {/* New Topic Form */}
        {showNewTopic &&
          <form onSubmit={handleCreateTopic} className="border bg-card rounded-xl p-5 mb-4 space-y-3">
            <h3 className="font-heading font-bold text-sm">Criar Tópico</h3>
            <div>
              <Label className="text-sm">Título</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Conteúdo</Label>
              <RichTextEditor value={newContent} onChange={setNewContent} placeholder="Escreva o conteúdo..." />
            </div>
            <div>
              <Label className="text-sm">Categoria</Label>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10">
                <option value="">Sem categoria</option>
                {categories.map((c) =>
                <option key={c.id} value={c.id}>{c.name}</option>
                )}
              </select>
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1">
                <ImagePlus className="w-4 h-4" /> Imagem (opcional)
              </Label>
              <Input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files?.[0] || null)} className="mt-1" />
              {newImage &&
              <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(newImage)} alt="Preview" className="max-h-32 rounded-lg" />
                  <button type="button" onClick={() => setNewImage(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              }
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPoll} onChange={(e) => setIsPoll(e.target.checked)} />
              <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
              Incluir enquete/votação
            </label>
            {isPoll &&
            <div className="space-y-2 pl-6">
                <Label className="text-sm">Opções da enquete</Label>
                {pollOptions.map((opt, i) =>
              <div key={i} className="flex gap-2">
                    <Input placeholder={`Opção ${i + 1}`} value={opt} onChange={(e) => {const updated = [...pollOptions];updated[i] = e.target.value;setPollOptions(updated);}} className="h-8 text-sm" />
                    {i >= 2 && <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
              )}
                {pollOptions.length < 6 &&
              <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar opção
                  </button>
              }
              </div>
            }
            <Button type="submit" size="sm">Publicar</Button>
          </form>
          }

        {/* Topics Feed */}
        {topics.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhum tópico ainda. Seja o primeiro a criar!</p> :

          <div className="border bg-card rounded-xl overflow-hidden divide-y divide-border">
            {topics.filter((t) => selectedCategoryFilter === "all" || t.category_id === selectedCategoryFilter).map((topic) => {
              const isExpanded = expandedTopicId === topic.id;
              const { topLevel, childrenMap } = getThreadedReplies(topic.id);
              const topicPoll = pollData[topic.id] || [];
              const canDelete = topic.author_id === user?.id || isAdmin;
              const totalVotes = topicPoll.reduce((sum, o) => sum + o.vote_count, 0);
              const catColor = topic.category_color || null;

              return (
                <div key={topic.id} id={`topic-${topic.id}`}>
                  <button
                    onClick={() => handleExpandTopic(topic.id)}
                    className="w-full text-left hover:bg-muted/50 transition-colors"
                    style={catColor ? { borderLeft: `3px solid ${catColor}` } : {}}>
                    <div className="flex gap-3 p-4">
                      <Avatar className="w-10 h-10 flex-shrink-0 mt-0.5">
                        <AvatarImage src={topic.author_avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground font-bold">
                          {getInitials(topic.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-heading font-bold text-sm text-slate-600">{topic.author_name}</span>
                          <SalaBadge sala={authorProfiles[topic.author_id]} />
                          <span className="text-muted-foreground text-xs">· {formatDate(topic.created_at)}</span>
                        </div>
                        <h4 className="font-heading font-bold text-base mt-1 text-primary">{topic.title}</h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {topic.is_pinned &&
                          <Badge variant="default" className="gap-1 text-[10px] px-1.5 py-0.5 h-5">
                              <Pin className="w-3 h-3" strokeWidth={2} /> Fixado
                            </Badge>
                          }
                          {topic.category_name &&
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                            style={catColor ? { backgroundColor: `${catColor}20`, color: catColor, borderColor: `${catColor}40` } : {}}>
                              {topic.category_name}
                            </span>
                          }
                          {topic.is_poll &&
                          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                              Enquete
                            </span>
                          }
                        </div>
                        {/* Interaction stats */}
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5" /> {topic.reply_count || 0}
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isExpanded &&
                  <div className="px-4 pb-4">
                      {/* Topic content */}
                      <div className="text-sm whitespace-pre-wrap leading-relaxed py-3 pl-[52px]"><RichText content={topic.content} /></div>
                      {topic.image_url &&
                    <img src={topic.image_url} alt="" className="mb-3 ml-[52px] max-w-full max-h-72 object-cover rounded-xl" loading="lazy" />
                    }

                      {/* Poll */}
                      {topic.is_poll && topicPoll.length > 0 &&
                    <div className="space-y-2 mb-4 ml-[52px] border bg-muted/30 rounded-xl p-3">
                          {topicPoll.map((opt) => {
                        const pct = totalVotes > 0 ? Math.round(opt.vote_count / totalVotes * 100) : 0;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleVote(opt.id, topic.id, opt.voted)}
                            className={`w-full text-left rounded-lg p-2.5 text-sm transition-colors relative overflow-hidden ${
                            opt.voted ? "bg-primary/10 border border-primary" : "bg-card border hover:bg-secondary"}`
                            }>
                                <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all" style={{ width: `${pct}%` }} />
                                <div className="relative flex justify-between items-center">
                                  <span className="font-body">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground">{opt.vote_count} ({pct}%)</span>
                                </div>
                              </button>);
                      })}
                          <p className="text-xs text-muted-foreground text-center">{totalVotes} voto(s)</p>
                        </div>
                    }

                      {/* Threaded Replies */}
                      {topLevel.length > 0 &&
                    <div className="ml-[52px]">
                          {topLevel.map((reply) =>
                      <div key={reply.id}>
                              {renderReply(reply, topic.id)}
                              {childrenMap[reply.id]?.map((child) => renderReply(child, topic.id, true))}
                            </div>
                      )}
                        </div>
                    }

                      {/* Replying-to indicator */}
                      {replyingTo &&
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5 mb-2 ml-[52px]">
                          <Reply className="w-3 h-3" />
                          <span>Respondendo a <strong>{replyingTo.name}</strong></span>
                          <button onClick={() => setReplyingTo(null)} className="ml-auto"><X className="w-3 h-3" /></button>
                        </div>
                    }

                      {/* Reply input */}
                      <div className="space-y-2 mt-3 ml-[52px]">
                        {replyImage &&
                      <div className="relative inline-block">
                            <img src={URL.createObjectURL(replyImage)} alt="Preview" className="max-h-24 rounded-lg" />
                            <button onClick={() => setReplyImage(null)} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                      }
                        <div className="flex gap-2">
                          <label className="flex-shrink-0 cursor-pointer flex items-center justify-center h-9 w-9 rounded-full border border-input hover:bg-secondary transition-colors">
                            <ImagePlus className="w-4 h-4 text-muted-foreground" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => setReplyImage(e.target.files?.[0] || null)} />
                          </label>
                          <Input
                          placeholder={replyingTo ? `Respondendo a ${replyingTo.name}...` : "Escreva uma resposta..."}
                          value={expandedTopicId === topic.id ? replyText : ""}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="h-9 text-sm rounded-full"
                          onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) handleReply(topic.id);}} />
                          <Button size="sm" onClick={() => handleReply(topic.id)} className="h-9 px-3 rounded-full">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3 ml-[52px]">
                        {isAdmin &&
                      <button
                        onClick={() => handleTogglePin(topic.id, topic.is_pinned)}
                        className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Pin className="w-3 h-3" /> {topic.is_pinned ? "Desafixar" : "Fixar"}
                    </button>
                      }
                        {canDelete &&
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                      }
                      </div>
                    </div>
                  }
                </div>);

            })}
          </div>
          }
      </div>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-4 mt-[6.75rem]">
        {/* Online users desktop */}
        <section className="border bg-card rounded-xl p-4 space-y-4">
          {(() => {
              const adminsOnline = onlineUsers.filter((u) => u.role === "admin");
              const leadersOnline = onlineUsers.filter((u) => u.role !== "admin");

              const renderGroup = (users: OnlineUser[], label: string) =>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Circle className="w-3 h-3 text-accent fill-accent" />
                  <h3 className="font-heading font-bold text-xs">{label} ({users.length})</h3>
                </div>
                {users.length === 0 ?
                <p className="text-xs text-muted-foreground">Nenhum online.</p> :
                <div className="space-y-2">
                    {users.map((u) =>
                  <div key={u.user_id} className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">{getInitials(u.full_name)}</AvatarFallback>
                          </Avatar>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full border-2 border-card" />
                        </div>
                        <span className="text-xs font-body truncate">{u.full_name.split(" ")[0]}</span>
                        <SalaBadge sala={u.class_name} />
                      </div>
                  )}
                  </div>
                }
              </div>;

              return (
                <>
                {renderGroup(adminsOnline, "Admins Online")}
                {renderGroup(leadersOnline, "Líderes Online")}
              </>);
            })()}
        </section>
        <ForumRanking />
      </aside>
      </div>
    </AppLayout>);

}