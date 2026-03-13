import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X, Send, Plus, ArrowLeft, Users, Search } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  participants?: { user_id: string; full_name: string; avatar_url: string | null }[];
  last_message?: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

const getInitials = (name: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

export default function ChatSystem() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [profilesMap, setProfilesMap] = useState<Record<string, UserProfile>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    fetchConversations();
    fetchAllUsers();
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase
      .channel(`chat-${activeConv}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${activeConv}` }, (payload) => {
        const newMsg = payload.new as any;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, sender_name: profilesMap[newMsg.sender_id]?.full_name || "Usuário" }];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv, profilesMap]);

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url");
    if (data) {
      setAllUsers(data.filter((u: any) => u.user_id !== user?.id) as UserProfile[]);
      const map: Record<string, UserProfile> = {};
      data.forEach((u: any) => { map[u.user_id] = u; });
      setProfilesMap(map);
    }
  };

  const fetchConversations = async () => {
    const { data: parts } = await supabase
      .from("chat_participants")
      .select("conversation_id")
      .eq("user_id", user!.id);
    if (!parts || parts.length === 0) { setConversations([]); return; }

    const convIds = parts.map((p: any) => p.conversation_id);
    const { data: convs } = await supabase
      .from("chat_conversations")
      .select("*")
      .in("id", convIds)
      .order("created_at", { ascending: false });

    if (!convs) return;

    // Fetch participants for each conversation
    const { data: allParts } = await supabase
      .from("chat_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);

    const partUserIds = [...new Set((allParts || []).map((p: any) => p.user_id))];
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", partUserIds);

    const profMap: Record<string, UserProfile> = {};
    profs?.forEach((p: any) => { profMap[p.user_id] = p; });

    const enriched = convs.map((c: any) => {
      const cParts = (allParts || []).filter((p: any) => p.conversation_id === c.id);
      const participants = cParts.map((p: any) => profMap[p.user_id]).filter(Boolean);
      const otherParticipants = participants.filter((p) => p.user_id !== user!.id);
      const displayName = c.is_group ? c.name : otherParticipants[0]?.full_name || "Chat";
      return { ...c, name: displayName, participants };
    });

    setConversations(enriched);
  };

  const openConversation = async (convId: string) => {
    setActiveConv(convId);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    if (data) {
      setMessages(data.map((m: any) => ({ ...m, sender_name: profilesMap[m.sender_id]?.full_name || "Usuário" })));
    }
  };

  const sendMessage = async () => {
    if (!msgInput.trim() || !activeConv || !user) return;
    const content = msgInput.trim();
    setMsgInput("");
    await supabase.from("chat_messages").insert({
      conversation_id: activeConv,
      sender_id: user.id,
      content,
    } as any);
  };

  const startPrivateChat = async (targetUserId: string) => {
    if (!user) return;

    // Check if conversation already exists
    const { data: myParts } = await supabase
      .from("chat_participants")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myParts && myParts.length > 0) {
      const convIds = myParts.map((p: any) => p.conversation_id);
      const { data: theirParts } = await supabase
        .from("chat_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", convIds);

      if (theirParts && theirParts.length > 0) {
        // Check if any is a 1:1 (not group)
        const { data: convs } = await supabase
          .from("chat_conversations")
          .select("id")
          .in("id", theirParts.map((p: any) => p.conversation_id))
          .eq("is_group", false);
        if (convs && convs.length > 0) {
          setShowNewChat(false);
          setSearchUser("");
          openConversation(convs[0].id);
          return;
        }
      }
    }

    const { data: conv, error } = await supabase
      .from("chat_conversations")
      .insert({ created_by: user.id, is_group: false } as any)
      .select()
      .single();
    if (error || !conv) { toast.error("Erro ao criar conversa"); return; }

    await supabase.from("chat_participants").insert([
      { conversation_id: (conv as any).id, user_id: user.id },
      { conversation_id: (conv as any).id, user_id: targetUserId },
    ] as any);

    setShowNewChat(false);
    setSearchUser("");
    await fetchConversations();
    openConversation((conv as any).id);
  };

  const createGroup = async () => {
    if (!user || selectedUsers.length < 1 || !groupName.trim()) return;
    const { data: conv, error } = await supabase
      .from("chat_conversations")
      .insert({ created_by: user.id, is_group: true, name: groupName.trim() } as any)
      .select()
      .single();
    if (error || !conv) { toast.error("Erro ao criar grupo"); return; }

    const participants = [user.id, ...selectedUsers].map((uid) => ({
      conversation_id: (conv as any).id,
      user_id: uid,
    }));
    await supabase.from("chat_participants").insert(participants as any);

    setShowNewGroup(false);
    setSelectedUsers([]);
    setGroupName("");
    await fetchConversations();
    openConversation((conv as any).id);
  };

  const filteredUsers = allUsers.filter((u) =>
    u.full_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        <MessageCircle className="w-6 h-6 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary to-accent">
        {activeConv ? (
          <button onClick={() => { setActiveConv(null); setMessages([]); }} className="text-primary-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}
        <h2 className="font-heading font-bold text-lg text-primary-foreground flex-1">
          {activeConv
            ? conversations.find((c) => c.id === activeConv)?.name || "Chat"
            : "Mensagens"}
        </h2>
        <button onClick={() => { setOpen(false); setActiveConv(null); setMessages([]); setShowNewChat(false); setShowNewGroup(false); }} className="text-primary-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      {!activeConv && !showNewChat && !showNewGroup ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 flex gap-2">
            <Button size="sm" onClick={() => setShowNewChat(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Nova conversa
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNewGroup(true)} className="gap-1">
              <Users className="w-4 h-4" /> Novo grupo
            </Button>
          </div>
          {conversations.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm mt-8">Nenhuma conversa ainda.</p>
          ) : (
            <div className="divide-y">
              {conversations.map((c) => {
                const other = c.participants?.find((p) => p.user_id !== user?.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <Avatar className="w-10 h-10">
                      {!c.is_group && other ? (
                        <>
                          <AvatarImage src={other.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(other.full_name)}
                          </AvatarFallback>
                        </>
                      ) : (
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          <Users className="w-4 h-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.is_group ? `${c.participants?.length || 0} participantes` : "Conversa privada"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : showNewChat ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <button onClick={() => { setShowNewChat(false); setSearchUser(""); }} className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar usuário..." value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="pl-9" />
            </div>
            <div className="divide-y">
              {filteredUsers.map((u) => (
                <button key={u.user_id} onClick={() => startPrivateChat(u.user_id)} className="w-full p-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">{getInitials(u.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-body">{u.full_name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : showNewGroup ? (
        <div className="flex-1 overflow-y-auto p-3">
          <button onClick={() => { setShowNewGroup(false); setSelectedUsers([]); setGroupName(""); }} className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <Input placeholder="Nome do grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} className="mb-3" />
          <p className="text-xs text-muted-foreground mb-2">Selecione participantes ({selectedUsers.length}):</p>
          <div className="divide-y mb-3">
            {allUsers.map((u) => (
              <label key={u.user_id} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-secondary/50">
                <input type="checkbox" checked={selectedUsers.includes(u.user_id)} onChange={(e) => {
                  if (e.target.checked) setSelectedUsers([...selectedUsers, u.user_id]);
                  else setSelectedUsers(selectedUsers.filter((id) => id !== u.user_id));
                }} />
                <Avatar className="w-7 h-7">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-[9px]">{getInitials(u.full_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-body">{u.full_name}</span>
              </label>
            ))}
          </div>
          <Button size="sm" onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length < 1}>
            Criar grupo
          </Button>
        </div>
      ) : (
        /* Active conversation */
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
            {messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {!isMe && (
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarImage src={profilesMap[m.sender_id]?.avatar_url || undefined} />
                      <AvatarFallback className="text-[9px] bg-muted">{getInitials(m.sender_name || "U")}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border rounded-bl-sm"}`}>
                    {!isMe && (
                      <p className="text-[10px] font-medium mb-0.5 opacity-70">{m.sender_name}</p>
                    )}
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
              <Input value={msgInput} onChange={(e) => setMsgInput(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1" />
              <Button type="submit" size="icon" disabled={!msgInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
