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
import { Megaphone, Pin, Play, Video, Circle, Camera, GraduationCap, ExternalLink, Sparkles, ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { useUserXp } from "@/hooks/useUserXp";
import UserLevelBadge from "@/components/UserLevelBadge";
import LevelUpModal from "@/components/LevelUpModal";

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
  cta_buttons: any[];
}

interface ForumTopic {
  id: string;
  title: string;
  author_name: string;
  author_avatar_url: string | null;
  updated_at: string;
  category_id: string | null;
}

interface VideoLesson {
  id: string;
  title: string;
  video_url: string;
  category: string;
  created_at: string;
  created_by: string;
  author_avatar_url?: string | null;
  author_name?: string;
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
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasActiveLive, setHasActiveLive] = useState(false);
  const [activeLiveTitle, setActiveLiveTitle] = useState("");
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
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
      const [noticesRes, forumRes, presenceRes, videosRes, bannersRes] = await Promise.all([
      supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
      supabase.from("forum_topics").select("id, title, author_name, author_avatar_url, updated_at, category_id").order("updated_at", { ascending: false }).limit(5),
      supabase.from("user_presence").select("user_id", { count: "exact", head: true }).eq("is_online", true).gte("last_seen", fiveMinAgo),
      supabase.from("video_lessons").select("id, title, video_url, category, created_at, created_by").order("created_at", { ascending: false }).limit(4),
      supabase.from("banners").select("*").lte("starts_at", now).order("created_at", { ascending: false }),
      ]);

      // Collect author IDs for avatar lookup
      const authorIds = new Set<string>();
      (noticesRes.data || []).forEach((n: any) => { if (n.author_id) authorIds.add(n.author_id); });
      (videosRes.data || []).forEach((v: any) => { if (v.created_by) authorIds.add(v.created_by); });

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
      if (videosRes.data) setVideoLessons((videosRes.data as any[]).map((v: any) => ({ ...v, author_avatar_url: avatarMap[v.created_by]?.avatar_url, author_name: avatarMap[v.created_by]?.full_name })) as VideoLesson[]);
      if (bannersRes.data) {
        const activeBanners = bannersRes.data.filter((b: any) => !b.ends_at || new Date(b.ends_at) > new Date());
        setBanners(activeBanners as Banner[]);
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
    if (user) {
      await supabase.from("notice_reads").upsert({ notice_id: notice.id, user_id: user.id } as any, { onConflict: "notice_id,user_id" });
      // Award XP for reading a notice
      await awardXp("read_notice", notice.id, 5);
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
          <div>
            <h2 className="font-heading font-bold text-4xl text-accent">
              Olá, {profile?.full_name?.split(" ")[0]}
            </h2>
            <p className="text-muted-foreground text-lg">
              {isAdmin ? "Painel administrativo" : "Painel do líder de classe"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Nível {level} · <span className="text-accent font-medium">{totalXp} XP</span> / {nextLevelXp} XP
            </p>
          </div>
          <div className="flex-1" />
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

        {/* Quick stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Sala do Líder - full width on mobile */}
          <div className="border bg-card p-4 text-left rounded-xl col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Sala do Líder</span>
            </div>
            <p className="font-heading font-bold text-primary text-2xl">{profile?.class_name || "Não definida"}</p>
          </div>
          {/* Avisos + Online side by side on mobile */}
          <div className="grid grid-cols-2 lg:contents gap-4">
            <button onClick={() => navigate("/mural")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Megaphone className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
                <span className="font-body text-muted-foreground text-lg">Avisos</span>
              </div>
              <p className="font-heading font-bold text-primary text-3xl">{notices.length}</p>
            </button>
            <button onClick={() => navigate("/forum")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Circle className="text-accent fill-accent w-[10px] h-[10px]" />
                <span className="font-body text-muted-foreground text-lg">Online</span>
              </div>
              <p className="font-heading font-bold text-accent text-3xl">{onlineCount}</p>
            </button>
          </div>
        </div>

        {/* Últimos Avisos */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-[20px] py-[10px] bg-primary rounded-xl">
            <h3 className="font-heading font-bold text-2xl text-primary-foreground">Últimos Avisos</h3>
            <button onClick={() => navigate("/mural")} className="text-xs hover:underline font-body text-primary-foreground">
              Ver todos
            </button>
          </div>
          {notices.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-[20px] py-[20px] bg-primary rounded-2xl">
              {notices.map((n) =>
            <div key={n.id} className="border bg-card overflow-hidden text-left hover:bg-secondary transition-colors group rounded-xl flex flex-col">
                  <div className="relative aspect-video bg-muted">
                    {n.image_url ?
                <img src={n.image_url} alt={n.title} className="w-full h-full object-cover" loading="lazy" /> :
                <div className="w-full h-full flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                      </div>}
                    {n.is_pinned &&
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-primary/90 rounded-full px-2 py-1">
                        <Pin className="w-3 h-3 text-primary-foreground" strokeWidth={2} />
                        <span className="text-[10px] font-bold text-primary-foreground">Aviso Fixado</span>
                      </div>}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h4 className="font-heading line-clamp-2 font-bold text-primary text-base">{n.title}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar className="w-5 h-5 flex-shrink-0">
                        <AvatarImage src={n.author_avatar_url || undefined} />
                        <AvatarFallback className="text-[8px] font-bold bg-secondary text-secondary-foreground">
                          {getInitials(n.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-xs text-muted-foreground">{n.author_name} · {formatDate(n.created_at)}</p>
                    </div>
                    <div className="mt-auto pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleOpenNotice(n)}>
                        Ler aviso completo
                      </Button>
                    </div>
                  </div>
                </div>)}
            </div>}
        </section>

        {/* Videoaulas Recentes */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-[20px] py-[10px] bg-accent rounded-xl">
            <h3 className="font-heading font-bold text-2xl text-primary-foreground">Videoaulas Recentes</h3>
            <button onClick={() => navigate("/videoaulas")} className="text-xs hover:underline font-body text-primary-foreground">
              Ver todas
            </button>
          </div>
          {videoLessons.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhuma videoaula disponível.</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 px-[20px] py-[20px] rounded-2xl bg-accent">
              {videoLessons.slice(0, 3).map((v) => {
              const thumbnail = getYouTubeThumbnail(v.video_url);
              return (
                <button key={v.id} onClick={() => navigate("/videoaulas")} className="border bg-card overflow-hidden text-left hover:bg-secondary transition-colors group rounded-xl">
                    <div className="relative aspect-video bg-muted">
                      {thumbnail ?
                    <img src={thumbnail} alt={v.title} className="w-full h-full object-cover" loading="lazy" /> :
                    <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                        </div>}
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-heading line-clamp-1 text-accent text-base font-bold">{v.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar className="w-5 h-5 flex-shrink-0">
                          <AvatarImage src={v.author_avatar_url || undefined} />
                          <AvatarFallback className="text-[8px] font-bold bg-secondary text-secondary-foreground">
                            {getInitials(v.author_name || v.category)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-muted-foreground">{v.author_name || v.category} · {formatDate(v.created_at)}</p>
                      </div>
                    </div>
                  </button>);
            })}
            </div>}
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
              </>
            }
          </DialogContent>
        </Dialog>

        {/* Tópicos Recentes do Fórum */}
        <section className="px-[20px] py-[20px] rounded-xl bg-accent">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-2xl text-primary-foreground">Tópicos Recentes</h3>
            <button onClick={() => navigate("/forum")} className="text-xs hover:underline font-body text-primary-foreground">
              Ver todos
            </button>
          </div>
          {forumTopics.length === 0 ?
          <p className="text-sm text-primary-foreground">Nenhum tópico disponível.</p> :
          <div className="space-y-2">
              {forumTopics.map((t) =>
            <button
              key={t.id}
              onClick={() => navigate(`/forum?topic=${t.id}`)}
              className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarImage src={t.author_avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                    {t.author_name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-body font-semibold line-clamp-1 text-accent text-base">{t.title}</span>
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