import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichText } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { Megaphone, Camera, GraduationCap, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Radio, ClipboardList, CalendarDays, Share2, PlayCircle, ChevronRight as ChevronRightIcon } from "lucide-react";
import { useUserXp } from "@/hooks/useUserXp";
import UserLevelBadge from "@/components/UserLevelBadge";
import LevelUpModal from "@/components/LevelUpModal";
import EventCalendar from "@/components/EventCalendar";
import ClassClimateCard from "@/components/ClassClimateCard";
import NoticeCard, { type NoticeCardData } from "@/components/NoticeCard";

import NoticeRelayButton from "@/components/NoticeRelayButton";

interface Banner {
  id: string;
  title: string;
  button_text: string | null;
  button_url: string | null;
  media_url: string;
  media_type: string;
  starts_at: string;
  ends_at: string | null;
  highlight_color?: string | null;
  category?: string | null;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string;
  author_avatar_url?: string | null;
  is_pinned: boolean;
  created_at: string;
  image_url: string | null;
  event_id: string | null;
  cta_buttons: any[];
  requires_relay: boolean;
}

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  description: string | null;
}

interface ForumTopic {
  id: string;
  title: string;
  author_name: string;
  author_avatar_url: string | null;
  updated_at: string;
  category_id: string | null;
}

interface PlaylistHighlight {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function DashboardPage() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [forumTopics, setForumTopics] = useState<ForumTopic[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [playlistsHighlight, setPlaylistsHighlight] = useState<PlaylistHighlight[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasActiveLive, setHasActiveLive] = useState(false);
  const [activeLiveTitle, setActiveLiveTitle] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [selectedNoticeEvent, setSelectedNoticeEvent] = useState<EventInfo | null>(null);
  const [hasReleasedResults, setHasReleasedResults] = useState(false);
  const { totalXp, level, progress, nextLevelXp, currentLevelXp, awardXp } = useUserXp();
  const xpData = { totalXp, level, progress, nextLevelXp, currentLevelXp };
  const [showLevelUp, setShowLevelUp] = useState(false);
  const prevLevelRef = useRef(level);
  // Detect level-up
  useEffect(() => {
    if (prevLevelRef.current > 0 && level > prevLevelRef.current && !isAdmin) {
      setShowLevelUp(true);
    }
    prevLevelRef.current = level;
  }, [level, isAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const now = new Date().toISOString();
      const [noticesRes, forumRes, presenceRes, tracksRes, bannersRes, liveRes] = await Promise.all([
      supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
      supabase.from("forum_topics").select("id, title, author_name, author_avatar_url, updated_at, category_id").order("updated_at", { ascending: false }).limit(5),
      supabase.from("user_presence").select("user_id", { count: "exact", head: true }).eq("is_online", true).gte("last_seen", fiveMinAgo),
      supabase.from("video_playlists").select("id, title, description, cover_url").eq("is_published", true).order("sort_order").limit(3),
      supabase.from("banners").select("*").lte("starts_at", now).order("created_at", { ascending: false }),
      supabase.from("live_streams").select("id, title").eq("is_active", true).limit(1),
      ]);

      // Collect author IDs for avatar lookup
      const authorIds = new Set<string>();
      (noticesRes.data || []).forEach((n: any) => { if (n.author_id) authorIds.add(n.author_id); });

      let avatarMap: Record<string, { avatar_url: string | null; full_name: string }> = {};
      if (authorIds.size > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, avatar_url, full_name").in("user_id", [...authorIds]);
        (profiles || []).forEach((p: any) => { avatarMap[p.user_id] = { avatar_url: p.avatar_url, full_name: p.full_name }; });
      }

      if (noticesRes.data) {
        const filtered = noticesRes.data.filter((n: any) => !n.target_user_ids || user && n.target_user_ids.includes(user.id));
        setNotices(filtered.map((n: any) => ({ ...n, cta_buttons: Array.isArray(n.cta_buttons) ? n.cta_buttons : [], author_avatar_url: avatarMap[n.author_id]?.avatar_url })));
      }
      if (forumRes.data) setForumTopics(forumRes.data as ForumTopic[]);
      if (presenceRes.count !== null) setOnlineCount(presenceRes.count);
      if (tracksRes.data) setPlaylistsHighlight(tracksRes.data as PlaylistHighlight[]);
      if (bannersRes.data) {
        const activeBanners = bannersRes.data.filter((b: any) => !b.ends_at || new Date(b.ends_at) > new Date());
        setBanners(activeBanners as Banner[]);
      }
      if (liveRes.data && liveRes.data.length > 0) {
        setHasActiveLive(true);
        setActiveLiveTitle((liveRes.data[0] as any).title);
      } else {
        setHasActiveLive(false);
      }

      // Check if leader has released results
      if (user) {
        const { data: leaderSurveys } = await supabase
          .from("survey_leaders")
          .select("survey_id, surveys(results_released)")
          .eq("leader_user_id", user.id);
        const hasReleased = (leaderSurveys || []).some((sl: any) => sl.surveys?.results_released);
        setHasReleasedResults(hasReleased);
      }
    };
    fetchData();

    const channel = supabase.
    channel("dashboard-presence").
    on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      supabase.from("user_presence").select("user_id", { count: "exact", head: true }).eq("is_online", true).gte("last_seen", fiveMinAgo).
      then(({ count }) => {if (count !== null) setOnlineCount(count);});
    }).
    subscribe();

    return () => {supabase.removeChannel(channel);};
  }, []);

  // Track notice read when modal opens
  const handleOpenNotice = async (notice: Notice) => {
    setSelectedNotice(notice);
    setSelectedNoticeEvent(null);
    // Fetch linked event if exists
    if (notice.event_id) {
      const { data: evt } = await supabase.from("events").select("id, title, event_date, event_time, description").eq("id", notice.event_id).maybeSingle();
      if (evt) setSelectedNoticeEvent(evt as EventInfo);
    }
    if (user) {
      await supabase.from("notice_reads").upsert({ notice_id: notice.id, user_id: user.id } as any, { onConflict: "notice_id,user_id" });
      if (!isAdmin) await awardXp("read_notice", notice.id, 5);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {toast.error("Erro no upload.");setUploadingAvatar(false);return;}
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "Usuário",
      avatar_url: urlData.publicUrl
    } as any, { onConflict: "user_id" });
    await refreshProfile();
    setUploadingAvatar(false);
    toast.success("Foto atualizada!");
  };

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  const getInitials = (name: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

  // Banner carousel state
  const [currentBanner, setCurrentBanner] = useState(0);
  const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startBannerTimer = useCallback(() => {
    if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
    if (banners.length > 1) {
      bannerTimerRef.current = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
    }
  }, [banners.length]);

  useEffect(() => {
    startBannerTimer();
    return () => { if (bannerTimerRef.current) clearInterval(bannerTimerRef.current); };
  }, [startBannerTimer]);

  const goToBanner = (index: number) => {
    setCurrentBanner(index);
    startBannerTimer();
  };

  return (
    <AppLayout>
      <div className="w-full">
        {/* Welcome with avatar */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {isAdmin ? (
            // Admin: Avatar simples sem nível
            <div className="relative group">
              <Avatar className="w-16 h-16 border-2 border-accent">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground font-heading">
                  {getInitials(profile?.full_name || "U")}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-background" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
          ) : (
            // Líder: Avatar com anel de nível
            <UserLevelBadge
              avatarUrl={profile?.avatar_url}
              fullName={profile?.full_name || "U"}
              xpData={xpData}
              size={64}
            >
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-background" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </UserLevelBadge>
          )}
          <div>
            <h2 className="font-heading font-bold text-4xl text-accent">
              Olá, {profile?.full_name?.split(" ")[0]}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-muted-foreground text-lg">
                {isAdmin ? "Painel Administrativo" : "Líder da Sala"}
              </p>
              {/* Badge da sala para ambos Admin e Líder */}
              {profile?.class_name && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-body font-semibold bg-secondary text-secondary-foreground border border-primary/20 shadow-sm">
                  {profile.class_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1" />
          {/* streak removed */}
          <Button
            onClick={() => navigate("/lider-ai")}
            className="rounded-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground gap-2 px-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            Pergunte à LíderAI
          </Button>
        </div>

        {/* Active Banners Carousel */}
        {banners.length > 0 && (
          <div className="mb-8 relative group/carousel">
            <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: "180px" }}>
              {banners.map((banner, index) => (
                <div
                  key={banner.id}
                  className="absolute inset-0 transition-opacity duration-700 ease-in-out"
                  style={{ opacity: index === currentBanner ? 1 : 0, pointerEvents: index === currentBanner ? "auto" : "none" }}
                >
                  {banner.media_type === "video" ? (
                    <video
                      src={banner.media_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img src={banner.media_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${banner.highlight_color || 'hsl(207,100%,27%)'}cc, ${banner.highlight_color || 'hsl(207,100%,27%)'}55, transparent)` }} />
                  <div className="relative z-10 flex flex-col justify-end p-5 sm:p-8 h-full min-h-[180px]">
                    {banner.category && (
                      <span
                        className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-2 w-fit"
                        style={{ backgroundColor: banner.highlight_color || 'hsl(207,100%,27%)', color: '#fff' }}
                      >
                        {banner.category}
                      </span>
                    )}
                    <h3 className="font-heading font-bold text-xl sm:text-3xl text-primary-foreground drop-shadow-lg mb-2">
                      {banner.title}
                    </h3>
                    {banner.button_text && banner.button_url && (
                      <a
                        href={banner.button_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-primary-foreground text-primary font-medium text-sm px-5 py-2 rounded-full w-fit hover:opacity-90 transition-opacity shadow-lg"
                      >
                        {banner.button_text}
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() => goToBanner((currentBanner - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-foreground/30 hover:bg-foreground/50 text-primary-foreground flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  aria-label="Banner anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => goToBanner((currentBanner + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-foreground/30 hover:bg-foreground/50 text-primary-foreground flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
                  aria-label="Próximo banner"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToBanner(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? "bg-primary-foreground w-4" : "bg-primary-foreground/50"}`}
                      aria-label={`Banner ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Results released card */}
        {hasReleasedResults && !isAdmin && (
          <button
            onClick={() => navigate("/meus-resultados")}
            className="w-full mb-6 border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-xl p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-primary">📊 Seus resultados já estão disponíveis!</p>
              <p className="text-sm text-muted-foreground">Confira a avaliação dos alunos sobre sua liderança.</p>
            </div>
            <span className="text-xs text-primary font-medium group-hover:underline flex-shrink-0">Ver resultados →</span>
          </button>
        )}

        {hasActiveLive && (
          <button
            onClick={() => navigate("/ao-vivo")}
            className="w-full mb-6 border-2 border-red-500/30 bg-red-500/5 hover:bg-red-500/10 rounded-xl p-4 flex items-center gap-3 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center animate-pulse flex-shrink-0">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-red-600">🔴 TRANSMISSÃO AO VIVO</p>
              <p className="text-sm text-muted-foreground truncate">{activeLiveTitle}</p>
            </div>
            <span className="text-xs text-red-500 font-medium group-hover:underline flex-shrink-0">Assistir →</span>
          </button>
        )}

        {/* Clima da Turma - substitui blocos antigos de Sala/Avisos/Online */}
        {!isAdmin && <ClassClimateCard />}

        {/* Calendário de Eventos */}
        <EventCalendar />

        {/* Últimos Avisos — novo design com NoticeCard */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h3 className="font-heading font-bold text-2xl text-foreground">Últimos Avisos</h3>
            </div>
            <button onClick={() => navigate("/mural")} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
              Ver todos <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
              {notices.map((n, idx) => {
                const isFeatured = idx === 0 && n.is_pinned;
                return (
                  <div
                    key={n.id}
                    className={isFeatured ? "sm:col-span-2 lg:col-span-2" : "lg:col-span-1"}
                  >
                    <NoticeCard
                      variant={isFeatured ? "featured" : "default"}
                      notice={n as unknown as NoticeCardData}
                      onOpen={() => handleOpenNotice(n)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Videoaulas em destaque */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
              <h3 className="font-heading font-bold text-2xl text-foreground">Videoaulas em destaque</h3>
            </div>
            <button onClick={() => navigate("/videoaulas")} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5">
              Ver todas <ChevronRightIcon className="w-3 h-3" />
            </button>
          </div>
          {playlistsHighlight.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum curso disponível ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlistsHighlight.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/videoaulas/${t.id}`)}
                  className="group border bg-card overflow-hidden text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 rounded-2xl"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-primary/15 via-accent/10 to-primary/5 flex items-center justify-center overflow-hidden">
                    {t.cover_url ? (
                      <img src={t.cover_url} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <PlayCircle className="w-12 h-12 text-primary/50" strokeWidth={1.3} />
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-heading line-clamp-1 text-foreground text-base font-bold group-hover:text-primary transition-colors">{t.title}</h4>
                    {t.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{t.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Modal de Aviso Completo */}
        <Dialog open={!!selectedNotice} onOpenChange={(open) => !open && setSelectedNotice(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            {selectedNotice &&
            <>
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl">{selectedNotice.title}</DialogTitle>
                  <p className="text-xs text-muted-foreground">{selectedNotice.author_name} · {formatDate(selectedNotice.created_at)}</p>
                </DialogHeader>
                {selectedNotice.image_url &&
              <img src={selectedNotice.image_url} alt={selectedNotice.title} className="w-full rounded-lg object-cover max-h-64" />
              }
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  <RichText content={selectedNotice.content} />
                </div>
                {selectedNoticeEvent && (
                  <div className="mt-3 border rounded-lg p-3 bg-muted/30 flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground">{selectedNoticeEvent.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(selectedNoticeEvent.event_date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        {selectedNoticeEvent.event_time && ` às ${selectedNoticeEvent.event_time.slice(0, 5)}`}
                      </p>
                      {selectedNoticeEvent.description && <p className="text-xs text-muted-foreground mt-1">{selectedNoticeEvent.description}</p>}
                    </div>
                  </div>
                )}
                {selectedNotice.cta_buttons?.length > 0 &&
              <div className="flex flex-wrap gap-2 mt-2">
                    {selectedNotice.cta_buttons.map((cta: any, i: number) =>
                <a key={i} href={cta.url} target={cta.newTab ? "_blank" : "_self"} rel={cta.newTab ? "noopener noreferrer" : undefined}>
                        <Button size="sm" className="gap-1.5">
                          {cta.text}
                          {cta.newTab && <ExternalLink className="w-3 h-3" strokeWidth={1.5} />}
                        </Button>
                      </a>
                )}
                  </div>
              }
                <NoticeRelayButton noticeId={selectedNotice.id} requiresRelay={selectedNotice.requires_relay} />
                <button
                  onClick={() => {
                    const text = `📢 *${selectedNotice.title}*\n\n${selectedNotice.content.replace(/<[^>]*>/g, '').slice(0, 500)}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                  }}
                  className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium mt-2 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Compartilhar no WhatsApp
                </button>
              </>
            }
          </DialogContent>
        </Dialog>

        {/* Tópicos Recentes do Fórum */}
        <section className="mb-8 border bg-card rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <h3 className="font-heading font-bold text-xl text-foreground">Tópicos Recentes</h3>
              </div>
              <button onClick={() => navigate("/forum")} className="text-xs hover:underline font-body text-primary">
                Ver todos
              </button>
            </div>
            {forumTopics.length === 0 ?
            <p className="text-sm text-muted-foreground">Nenhum tópico disponível.</p> :
            <div className="space-y-2">
                {forumTopics.slice(0, 4).map((t) =>
              <button
                key={t.id}
                onClick={() => navigate(`/forum?topic=${t.id}`)}
                className="w-full border bg-card p-4 text-left hover:shadow-md transition-all rounded-xl">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={t.author_avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                      {t.author_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-body font-semibold line-clamp-1 text-accent text-sm">{t.title}</span>
                    <p className="text-xs text-muted-foreground">{t.author_name} · {formatDate(t.updated_at)}</p>
                  </div>
                </div>
              </button>
              )}
              </div>
            }
        </section>
      </div>
      <LevelUpModal open={showLevelUp} onClose={() => setShowLevelUp(false)} newLevel={level} />
    </AppLayout>);

}