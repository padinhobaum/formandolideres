import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Radio, Tv, AlertCircle, Loader2, Users } from "lucide-react";

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
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="font-heading font-bold text-3xl md:text-4xl">Ao Vivo</h1>
          </div>
          {active && (
            <span className="ml-auto inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full" />
              AO VIVO
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Carregando transmissão...</p>
          </div>
        ) : !active ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <Tv className="w-16 h-16 text-muted-foreground/40" />
            <h2 className="font-heading font-semibold text-xl text-muted-foreground">Nenhuma transmissão ativa</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              No momento não há nenhuma live acontecendo. Quando uma transmissão for iniciada, você será notificado!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h2 className="font-heading font-bold text-xl md:text-2xl">{active.title}</h2>
              {active.description && (
                <p className="text-muted-foreground text-sm mt-1">{active.description}</p>
              )}
            </div>

            {/* Player + Chat */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Video Player */}
              <div className="flex-1 min-w-0">
                {embedUrl ? (
                  <div className="relative w-full rounded-xl overflow-hidden border shadow-lg bg-black" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      src={embedUrl}
                      className="absolute inset-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="w-full rounded-xl border bg-muted flex flex-col items-center justify-center py-20 gap-3">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <p className="text-sm text-muted-foreground">Não foi possível carregar a transmissão.</p>
                    <a href={active.stream_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Abrir no {active.platform === "youtube" ? "YouTube" : "Twitch"}
                    </a>
                  </div>
                )}
              </div>

              {/* Chat */}
              {chatUrl && (
                <div className="lg:w-[360px] w-full flex-shrink-0">
                  <div className="rounded-xl overflow-hidden border shadow-lg bg-card h-[400px] lg:h-full lg:min-h-[480px]">
                    <iframe
                      src={chatUrl}
                      className="w-full h-full"
                      title="Live Chat"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Viewers section */}
            <div className="border bg-card rounded-xl p-4 mt-2">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-heading font-semibold text-sm">Assistindo agora</h3>
                <span className="text-xs text-muted-foreground">({viewers.length})</span>
              </div>

              {viewers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém assistindo no momento.</p>
              ) : (
                <div className="flex items-center gap-1 flex-wrap">
                  {visibleViewers.map((v) => {
                    const isMe = v.user_id === user?.id;
                    return (
                      <Tooltip key={v.user_id}>
                        <TooltipTrigger asChild>
                          <div className={`relative transition-transform hover:scale-110 cursor-default ${isMe ? "ring-2 ring-primary ring-offset-2 ring-offset-card rounded-full" : ""}`}>
                            <Avatar className="w-9 h-9 border-2 border-card shadow-sm">
                              <AvatarImage src={v.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                                {getInitials(v.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          {v.full_name}{isMe ? " (você)" : ""}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {extraCount > 0 && (
                    <div className="w-9 h-9 rounded-full bg-muted border-2 border-card shadow-sm flex items-center justify-center">
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
