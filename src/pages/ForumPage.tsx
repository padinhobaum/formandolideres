import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  MessageSquare, Plus, ThumbsUp, BarChart3, Send, Trash2, ChevronDown, ChevronUp, Circle
} from "lucide-react";

interface ForumTopic {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  is_poll: boolean;
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
  created_at: string;
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
}

export default function ForumPage() {
  const { user, profile } = useAuth();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, ForumReply[]>>({});
  const [pollData, setPollData] = useState<Record<string, PollOption[]>>({});
  const [replyText, setReplyText] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);

  // New topic form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  const fetchTopics = async () => {
    const { data } = await supabase
      .from("forum_topics")
      .select("*")
      .order("created_at", { ascending: false });
    if (!data) return;

    // Get reply counts
    const topicIds = data.map((t: any) => t.id);
    const { data: repliesData } = await supabase
      .from("forum_replies")
      .select("topic_id")
      .in("topic_id", topicIds.length > 0 ? topicIds : ["__none__"]);

    const countMap: Record<string, number> = {};
    repliesData?.forEach((r: any) => {
      countMap[r.topic_id] = (countMap[r.topic_id] || 0) + 1;
    });

    setTopics(data.map((t: any) => ({ ...t, reply_count: countMap[t.id] || 0 })));
  };

  const fetchOnlineUsers = async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: presenceData } = await supabase
      .from("user_presence")
      .select("user_id")
      .eq("is_online", true)
      .gte("last_seen", fiveMinAgo);

    if (!presenceData || presenceData.length === 0) {
      setOnlineUsers([]);
      return;
    }

    const userIds = presenceData.map((p: any) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    if (profiles) setOnlineUsers(profiles as OnlineUser[]);
  };

  useEffect(() => {
    fetchTopics();
    fetchOnlineUsers();

    // Realtime presence updates
    const channel = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchOnlineUsers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user) return;

    const { data: topicData, error } = await supabase.from("forum_topics").insert({
      title: newTitle.trim(),
      content: newContent.trim(),
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      is_poll: isPoll,
    } as any).select().single();

    if (error) { toast.error("Erro ao criar tópico."); return; }

    // Create poll options if poll
    if (isPoll && topicData) {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length >= 2) {
        await supabase.from("poll_options").insert(
          validOptions.map((label, i) => ({
            topic_id: (topicData as any).id,
            label: label.trim(),
            sort_order: i,
          })) as any
        );
      }
    }

    toast.success("Tópico criado!");
    setNewTitle(""); setNewContent(""); setIsPoll(false); setPollOptions(["", ""]); setShowNewTopic(false);
    fetchTopics();
  };

  const handleExpandTopic = async (topicId: string) => {
    if (expandedTopicId === topicId) {
      setExpandedTopicId(null);
      return;
    }
    setExpandedTopicId(topicId);

    // Fetch replies
    const { data: repliesData } = await supabase
      .from("forum_replies")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at");
    if (repliesData) setReplies((prev) => ({ ...prev, [topicId]: repliesData as ForumReply[] }));

    // Fetch poll data if poll
    const topic = topics.find((t) => t.id === topicId);
    if (topic?.is_poll) {
      const { data: options } = await supabase
        .from("poll_options")
        .select("*")
        .eq("topic_id", topicId)
        .order("sort_order");

      if (options && options.length > 0) {
        const optionIds = options.map((o: any) => o.id);
        const { data: votes } = await supabase
          .from("poll_votes")
          .select("option_id, user_id")
          .in("option_id", optionIds);

        const enriched = options.map((o: any) => ({
          ...o,
          vote_count: votes?.filter((v: any) => v.option_id === o.id).length || 0,
          voted: votes?.some((v: any) => v.option_id === o.id && v.user_id === user?.id) || false,
        }));
        setPollData((prev) => ({ ...prev, [topicId]: enriched }));
      }
    }
  };

  const handleReply = async (topicId: string) => {
    if (!replyText.trim() || !user) return;
    const { error } = await supabase.from("forum_replies").insert({
      topic_id: topicId,
      content: replyText.trim(),
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
    } as any);
    if (error) { toast.error("Erro ao responder."); return; }
    setReplyText("");
    handleExpandTopic(topicId);
    fetchTopics();
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
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Tópico excluído.");
    fetchTopics();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h2 className="font-heading font-bold mb-1 text-4xl text-accent">Fórum de Líderes</h2>
        <p className="text-muted-foreground mb-6 text-lg">Discussões, perguntas e enquetes</p>

        {/* Online Leaders */}
        <section className="mb-6 border bg-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Circle className="w-3 h-3 text-accent fill-accent" />
            <h3 className="font-heading font-bold text-sm">
              Líderes Online ({onlineUsers.length})
            </h3>
          </div>
          {onlineUsers.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum líder online no momento.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {onlineUsers.map((u) => (
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
                </div>
              ))}
            </div>
          )}
        </section>

        {/* New Topic Button */}
        <div className="mb-4">
          <Button onClick={() => setShowNewTopic(!showNewTopic)} size="sm">
            <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
            Novo Tópico
          </Button>
        </div>

        {/* New Topic Form */}
        {showNewTopic && (
          <form onSubmit={handleCreateTopic} className="border bg-card rounded-xl p-5 mb-6 space-y-3">
            <h3 className="font-heading font-bold text-sm">Criar Tópico</h3>
            <div>
              <Label className="text-sm">Título</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Conteúdo</Label>
              <Textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="mt-1" required />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isPoll} onChange={(e) => setIsPoll(e.target.checked)} />
              <BarChart3 className="w-4 h-4" strokeWidth={1.5} />
              Incluir enquete/votação
            </label>
            {isPoll && (
              <div className="space-y-2 pl-6">
                <Label className="text-sm">Opções da enquete</Label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Opção ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[i] = e.target.value;
                        setPollOptions(updated);
                      }}
                      className="h-8 text-sm"
                    />
                    {i >= 2 && (
                      <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))} className="text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Adicionar opção
                  </button>
                )}
              </div>
            )}
            <Button type="submit" size="sm">Publicar</Button>
          </form>
        )}

        {/* Topics List */}
        {topics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum tópico ainda. Seja o primeiro a criar!</p>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => {
              const isExpanded = expandedTopicId === topic.id;
              const topicReplies = replies[topic.id] || [];
              const topicPoll = pollData[topic.id] || [];
              const canDelete = topic.author_id === user?.id;
              const totalVotes = topicPoll.reduce((sum, o) => sum + o.vote_count, 0);

              return (
                <div key={topic.id} className="border bg-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleExpandTopic(topic.id)}
                    className="w-full p-4 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9 mt-0.5 flex-shrink-0">
                        <AvatarImage src={topic.author_avatar_url || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                          {getInitials(topic.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-sm">{topic.title}</h4>
                          {topic.is_poll && (
                            <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded font-body">
                              Enquete
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {topic.author_name} · {formatDate(topic.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {topic.reply_count || 0}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      {/* Topic content */}
                      <p className="text-sm font-body whitespace-pre-wrap py-3">{topic.content}</p>

                      {/* Poll */}
                      {topic.is_poll && topicPoll.length > 0 && (
                        <div className="space-y-2 mb-4 border bg-secondary/30 rounded-lg p-3">
                          {topicPoll.map((opt) => {
                            const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => handleVote(opt.id, topic.id, opt.voted)}
                                className={`w-full text-left rounded-lg p-2 text-sm transition-colors relative overflow-hidden ${
                                  opt.voted ? "bg-primary/10 border border-primary" : "bg-card border hover:bg-secondary"
                                }`}
                              >
                                <div
                                  className="absolute inset-y-0 left-0 bg-primary/10 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex justify-between items-center">
                                  <span className="font-body">{opt.label}</span>
                                  <span className="text-xs text-muted-foreground">{opt.vote_count} ({pct}%)</span>
                                </div>
                              </button>
                            );
                          })}
                          <p className="text-xs text-muted-foreground text-center">{totalVotes} voto(s)</p>
                        </div>
                      )}

                      {/* Replies */}
                      {topicReplies.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {topicReplies.map((reply) => (
                            <div key={reply.id} className="flex gap-2 pl-2 border-l-2 border-muted">
                              <Avatar className="w-6 h-6 flex-shrink-0 mt-0.5">
                                <AvatarImage src={reply.author_avatar_url || undefined} />
                                <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                                  {getInitials(reply.author_name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-medium">{reply.author_name} <span className="text-muted-foreground font-normal">· {formatDate(reply.created_at)}</span></p>
                                <p className="text-sm font-body mt-0.5">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply input */}
                      <div className="flex gap-2 mt-3">
                        <Input
                          placeholder="Escreva uma resposta..."
                          value={expandedTopicId === topic.id ? replyText : ""}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="h-9 text-sm"
                          onKeyDown={(e) => { if (e.key === "Enter") handleReply(topic.id); }}
                        />
                        <Button size="sm" onClick={() => handleReply(topic.id)} className="h-9 px-3">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteTopic(topic.id)}
                          className="text-xs text-destructive hover:underline mt-2 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir tópico
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
