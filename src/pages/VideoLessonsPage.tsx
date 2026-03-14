import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Play, MessageCircle, Send, Trash2, ChevronDown, ChevronUp, ListVideo, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VideoLesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  category: string;
  created_at: string;
}

interface VideoComment {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  avatar_url?: string | null;
}

interface Playlist {
  id: string;
  title: string;
  videos: VideoLesson[];
}

function getEmbedUrl(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function VideoLessonsPage() {
  const { user, profile, isAdmin } = useAuth();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, VideoComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.from("video_lessons").select("*").order("created_at", { ascending: false });
      if (data) setVideos(data as VideoLesson[]);
    };

    const fetchPlaylists = async () => {
      const { data: playlistsData } = await supabase.from("playlists").select("*").order("sort_order");
      if (!playlistsData) return;
      const { data: pvData } = await supabase.from("playlist_videos").select("*, video_lessons(*)").order("sort_order");
      const result: Playlist[] = (playlistsData as any[]).map((p: any) => ({
        ...p,
        videos: (pvData as any[] || []).filter((pv: any) => pv.playlist_id === p.id).map((pv: any) => pv.video_lessons).filter(Boolean)
      }));
      setPlaylists(result.filter((p) => p.videos.length > 0));
    };

    fetchVideos();
    fetchPlaylists();
  }, []);

  const categories = [...new Set(videos.map((v) => v.category))].sort();
  const filtered = videos.filter((v) => !categoryFilter || v.category === categoryFilter);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const toggleComments = async (videoId: string) => {
    if (expandedVideo === videoId) { setExpandedVideo(null); return; }
    setExpandedVideo(videoId);
    setReplyingTo(null);
    if (!comments[videoId]) {
      const { data } = await supabase.from("video_comments").select("*").eq("video_id", videoId).order("created_at", { ascending: true });
      if (data) {
        // Fetch avatar URLs for comment authors
        const userIds = [...new Set(data.map((c: any) => c.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, avatar_url").in("user_id", userIds);
        const avatarMap: Record<string, string | null> = {};
        profiles?.forEach((p: any) => { avatarMap[p.user_id] = p.avatar_url; });
        setComments((prev) => ({ ...prev, [videoId]: (data as VideoComment[]).map(c => ({ ...c, avatar_url: avatarMap[c.user_id] || null })) }));
      }
    }
  };

  const handleComment = async (videoId: string) => {
    if (!newComment.trim() || !user) return;
    const { data, error } = await supabase.from("video_comments").insert({
      video_id: videoId,
      user_id: user.id,
      user_name: profile?.full_name || user.email || "",
      content: newComment.trim(),
      parent_comment_id: replyingTo?.id || null
    } as any).select().single();
    if (error) { toast.error("Erro ao comentar."); return; }
    setComments((prev) => ({ ...prev, [videoId]: [...(prev[videoId] || []), data as VideoComment] }));
    setNewComment("");
    setReplyingTo(null);
  };

  const handleDeleteComment = async (commentId: string, videoId: string) => {
    const { error } = await supabase.from("video_comments").delete().eq("id", commentId);
    if (error) { toast.error("Erro ao excluir comentário."); return; }
    setComments((prev) => ({ ...prev, [videoId]: (prev[videoId] || []).filter((c) => c.id !== commentId) }));
  };

  const getThreadedComments = (videoId: string) => {
    const all = comments[videoId] || [];
    const topLevel = all.filter((c) => !c.parent_comment_id);
    const childrenMap: Record<string, VideoComment[]> = {};
    all.filter((c) => c.parent_comment_id).forEach((c) => {
      if (!childrenMap[c.parent_comment_id!]) childrenMap[c.parent_comment_id!] = [];
      childrenMap[c.parent_comment_id!].push(c);
    });
    return { topLevel, childrenMap };
  };

  const renderComment = (c: VideoComment, videoId: string, isChild = false) => (
    <div key={c.id} className={`flex gap-2 items-start ${isChild ? "pl-6 border-l-2 border-muted ml-2" : ""}`}>
      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-secondary-foreground">
          {c.user_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-primary-foreground text-base font-bold">{c.user_name}</p>
        {c.parent_comment_id && (
          <p className="text-primary-foreground/60 italic text-xs">
            respondendo a {(comments[videoId] || []).find((r) => r.id === c.parent_comment_id)?.user_name || "..."}
          </p>
        )}
        <p className="text-primary-foreground text-base">{c.content}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-primary-foreground">{formatDate(c.created_at)}</p>
          <button
            onClick={() => setReplyingTo({ id: c.id, name: c.user_name })}
            className="flex items-center gap-1 text-[10px] text-primary-foreground/70 hover:text-primary-foreground"
          >
            <Reply className="w-3 h-3" /> Responder
          </button>
        </div>
      </div>
      {user && (c.user_id === user.id || isAdmin) &&
        <button onClick={() => handleDeleteComment(c.id, videoId)} className="text-destructive p-0.5">
          <Trash2 className="w-3 h-3" strokeWidth={1.5} />
        </button>
      }
    </div>
  );

  const renderVideoCard = (v: VideoLesson) => {
    const embedUrl = getEmbedUrl(v.video_url);
    const isExpanded = expandedVideo === v.id;
    const { topLevel, childrenMap } = getThreadedComments(v.id);

    return (
      <div key={v.id} className="border overflow-hidden bg-accent rounded-2xl">
        {embedUrl ?
          <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={v.title} />
          </div> :
          <a href={v.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-muted p-8 text-primary hover:underline">
            <Play className="w-5 h-5" strokeWidth={1.5} /> Assistir vídeo
          </a>
        }
        <div className="p-4">
          <h3 className="font-heading font-bold text-primary-foreground text-xl">{v.title}</h3>
          {v.description && <p className="mt-1 text-primary-foreground text-base">{v.description}</p>}
          <p className="text-xs mt-2 text-primary-foreground">{v.category} · {formatDate(v.created_at)}</p>
          <button onClick={() => toggleComments(v.id)} className="flex items-center gap-1 mt-3 text-xs hover:underline text-primary-foreground">
            <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> Comentários
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {isExpanded &&
            <div className="mt-3 border-t pt-3 space-y-3">
              {topLevel.length === 0 && <p className="text-xs text-primary-foreground">Nenhum comentário ainda.</p>}
              {topLevel.map((c) => (
                <div key={c.id}>
                  {renderComment(c, v.id)}
                  {(childrenMap[c.id] || []).map((child) => renderComment(child, v.id, true))}
                </div>
              ))}
              {replyingTo && (
                <div className="flex items-center gap-1 text-xs text-primary-foreground/70 bg-primary-foreground/10 rounded px-2 py-1">
                  <Reply className="w-3 h-3" />
                  Respondendo a {replyingTo.name}
                  <button onClick={() => setReplyingTo(null)} className="ml-auto text-primary-foreground hover:text-destructive">✕</button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleComment(v.id)}
                  placeholder={replyingTo ? `Respondendo a ${replyingTo.name}...` : "Escreva um comentário..."}
                  className="flex-1 border bg-background px-3 py-1.5 text-xs rounded"
                />
                <Button size="sm" variant="ghost" onClick={() => handleComment(v.id)} className="px-2">
                  <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          }
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="w-full">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Videoaulas</h2>

        {playlists.length > 0 &&
          <section className="mb-8">
            {playlists.map((pl) =>
              <div key={pl.id} className="mb-4 border bg-card rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
                  <ListVideo className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="font-heading font-bold text-lg">{pl.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{pl.videos.length} vídeos</span>
                  {expandedPlaylist === pl.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {expandedPlaylist === pl.id &&
                  <div className="border-t p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pl.videos.map((v) => {
                      const thumb = getYouTubeThumbnail(v.video_url);
                      return (
                        <div key={v.id} className="border bg-muted/30 rounded-xl overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => { setCategoryFilter(""); setExpandedVideo(v.id); document.getElementById(`video-${v.id}`)?.scrollIntoView({ behavior: "smooth" }); }}>
                          <div className="aspect-video bg-muted relative">
                            {thumb ? <img src={thumb} alt={v.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play className="w-6 h-6 text-muted-foreground" /></div>}
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium line-clamp-1">{v.title}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
              </div>
            )}
          </section>
        }

        <div className="mb-6">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border bg-card px-3 py-2 text-sm font-body rounded">
            <option value="">Todas as categorias</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhuma videoaula disponível.</p> :
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((v) =>
              <div key={v.id} id={`video-${v.id}`}>{renderVideoCard(v)}</div>
            )}
          </div>
        }
      </div>
    </AppLayout>
  );
}
