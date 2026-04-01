import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Radio, Tv, AlertCircle, Loader2, Users, Eye } from "lucide-react";

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  stream_url: string;
  platform: string;
  is_active: boolean;
}

interface LiveViewer {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
}

function extractEmbedUrl(url: string, platform: string): string | null {
  if (platform === "youtube") {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
    if (url.includes("youtube.com/embed/")) return url;
  }
  if (platform === "twitch") {
    const ch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (ch) return `https://player.twitch.tv/?channel=${ch[1]}&parent=${window.location.hostname}`;
  }
  return null;
}

function extractChatUrl(url: string, platform: string): string | null {
  if (platform === "youtube") {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/);
    if (m) return `https://www.youtube.com/live_chat?v=${m[1]}&embed_domain=${window.location.hostname}`;
  }
  if (platform === "twitch") {
    const ch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (ch) return `https://www.twitch.tv/embed/${ch[1]}/chat?parent=${window.location.hostname}&darkpopout`;
  }
  return null;
}

const MAX_VISIBLE_VIEWERS = 10;

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";
}

export default function LivePage() {
  const { user, profile } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewers, setViewers] = useState<LiveViewer[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    supabase
      .from("live_streams")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setStreams(data as LiveStream[]);
        setLoading(false);
      });
  }, []);

  const active = streams[0] || null;

  // Realtime presence for viewers
  useEffect(() => {
    if (!active || !user || !profile) return;

    const channel = supabase.channel(`live-viewers-${active.id}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string; full_name: string; avatar_url: string | null }>();
        const list: LiveViewer[] = [];
        const seen = new Set<string>();
        for (const key of Object.keys(state)) {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const p = presences[0];
            if (!seen.has(p.user_id)) {
              seen.add(p.user_id);
              list.push({ user_id: p.user_id, full_name: p.full_name, avatar_url: p.avatar_url });
            }
          }
        }
        setViewers(list);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [active?.id, user?.id, profile?.full_name]);

  const embedUrl = active ? extractEmbedUrl(active.stream_url, active.platform) : null;
  const chatUrl = active ? extractChatUrl(active.stream_url, active.platform) : null;

  const visibleViewers = viewers.slice(0, MAX_VISIBLE_VIEWERS);
  const extraCount = Math.max(0, viewers.length - MAX_VISIBLE_VIEWERS);

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto">
        {/* Header with animation */}
        <div className="flex items-center gap-3 mb-6 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="w-7 h-7 text-destructive" />
              {active && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-destructive rounded-full animate-ping" />}
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl">Ao Vivo</h1>
          </div>
          {active && (
            <div className="ml-auto flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                {viewers.length}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-destructive/20">
                <span className="w-2 h-2 bg-white rounded-full" />
                AO VIVO
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 w-12 h-12 rounded-full bg-primary/10 animate-ping" />
            </div>
            <p className="text-muted-foreground text-sm">Carregando transmissão...</p>
          </div>
        ) : !active ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center">
              <Tv className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h2 className="font-heading font-semibold text-xl text-muted-foreground">Nenhuma transmissão ativa</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              No momento não há nenhuma live acontecendo. Quando uma transmissão for iniciada, você será notificado!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Title with animation */}
            <div className="animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
              <h2 className="font-heading font-bold text-xl md:text-2xl">{active.title}</h2>
              {active.description && (
                <p className="text-muted-foreground text-sm mt-1">{active.description}</p>
              )}
            </div>

            {/* Player + Chat */}
            <div className="flex flex-col lg:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
              {/* Video Player */}
              <div className="flex-1 min-w-0 group">
                {embedUrl ? (
                  <div className="relative w-full rounded-2xl overflow-hidden border-2 border-primary/10 shadow-xl bg-black transition-shadow duration-300 hover:shadow-2xl hover:border-primary/20" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-2xl border-2 border-dashed border-destructive/30 bg-muted/50 flex flex-col items-center justify-center py-20 gap-3">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <p className="text-sm text-muted-foreground">Não foi possível carregar a transmissão.</p>
                    <a href={active.stream_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline font-medium">
                      Abrir no {active.platform === "youtube" ? "YouTube" : "Twitch"}
                    </a>
                  </div>
                )}
              </div>

              {/* Chat */}
              {chatUrl && (
                <div className="lg:w-[360px] w-full flex-shrink-0">
                <div className="rounded-2xl overflow-hidden border-2 border-accent/10 shadow-xl bg-card h-[400px] lg:h-full lg:min-h-[480px] flex flex-col transition-shadow duration-300 hover:shadow-2xl hover:border-accent/20">
                    <div className="bg-accent/10 px-4 py-2 border-b flex items-center gap-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                      <span className="text-xs font-heading font-semibold text-accent">Chat ao Vivo</span>
                    </div>
                    <iframe
                      src={chatUrl}
                      className="w-full flex-1 border-0 block"
                      style={{ margin: 0, padding: 0 }}
                      title="Live Chat"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Viewers section */}
            <div className="border-2 border-primary/5 bg-card rounded-2xl p-5 shadow-sm animate-fade-in transition-all duration-300 hover:shadow-md hover:border-primary/10" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-sm">Assistindo agora</h3>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">{viewers.length}</span>
              </div>

              {viewers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém assistindo no momento.</p>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {visibleViewers.map((v, i) => {
                    const isMe = v.user_id === user?.id;
                    return (
                      <Tooltip key={v.user_id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`relative transition-all duration-200 hover:scale-110 hover:-translate-y-1 cursor-default ${isMe ? "ring-2 ring-primary ring-offset-2 ring-offset-card rounded-full" : ""}`}
                            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                          >
                            <Avatar className="w-10 h-10 border-2 border-card shadow-md">
                              <AvatarImage src={v.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                                {getInitials(v.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            {isMe && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-card rounded-full" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs font-medium">
                          {v.full_name}{isMe ? " (você)" : ""}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {extraCount > 0 && (
                    <div className="w-10 h-10 rounded-full bg-muted border-2 border-card shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-110">
                      <span className="text-[10px] font-bold text-muted-foreground">+{extraCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
