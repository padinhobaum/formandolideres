import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Play, MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function VideoLessonsPage() {
  const { user, profile } = useAuth();
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expandedVideo, setExpandedVideo] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, VideoComment[]>>({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase.
      from("video_lessons").
      select("*").
      order("created_at", { ascending: false });
      if (data) setVideos(data as VideoLesson[]);
    };
    fetchVideos();
  }, []);

  const categories = [...new Set(videos.map((v) => v.category))].sort();
  const filtered = videos.filter((v) => !categoryFilter || v.category === categoryFilter);

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const toggleComments = async (videoId: string) => {
    if (expandedVideo === videoId) {
      setExpandedVideo(null);
      return;
    }
    setExpandedVideo(videoId);
    if (!comments[videoId]) {
      const { data } = await supabase.
      from("video_comments").
      select("*").
      eq("video_id", videoId).
      order("created_at", { ascending: true });
      if (data) setComments((prev) => ({ ...prev, [videoId]: data as VideoComment[] }));
    }
  };

  const handleComment = async (videoId: string) => {
    if (!newComment.trim() || !user) return;
    const { data, error } = await supabase.from("video_comments").insert({
      video_id: videoId,
      user_id: user.id,
      user_name: profile?.full_name || user.email || "",
      content: newComment.trim()
    }).select().single();
    if (error) {toast.error("Erro ao comentar.");return;}
    setComments((prev) => ({
      ...prev,
      [videoId]: [...(prev[videoId] || []), data as VideoComment]
    }));
    setNewComment("");
  };

  const handleDeleteComment = async (commentId: string, videoId: string) => {
    const { error } = await supabase.from("video_comments").delete().eq("id", commentId);
    if (error) {toast.error("Erro ao excluir comentário.");return;}
    setComments((prev) => ({
      ...prev,
      [videoId]: (prev[videoId] || []).filter((c) => c.id !== commentId)
    }));
  };

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Videoaulas</h2>

        <div className="mb-6">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border bg-card px-3 py-2 text-sm font-body rounded">
            
            <option value="">Todas as categorias</option>
            {categories.map((c) =>
            <option key={c} value={c}>{c}</option>
            )}
          </select>
        </div>

        {filtered.length === 0 ?
        <p className="text-sm text-muted-foreground">Nenhuma videoaula disponível.</p> :

        <div className="space-y-4">
            {filtered.map((v) => {
            const embedUrl = getEmbedUrl(v.video_url);
            const isExpanded = expandedVideo === v.id;
            const videoComments = comments[v.id] || [];

            return (
              <div key={v.id} className="border overflow-hidden bg-accent rounded-2xl">
                  {/* Video embed */}
                  {embedUrl ?
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                      <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={v.title} />
                  
                    </div> :

                <a
                  href={v.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-muted p-8 text-primary hover:underline">
                  
                      <Play className="w-5 h-5" strokeWidth={1.5} />
                      Assistir vídeo
                    </a>
                }

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-primary-foreground text-xl">{v.title}</h3>
                    {v.description &&
                  <p className="mt-1 text-primary-foreground text-base">{v.description}</p>
                  }
                    <p className="text-xs mt-2 text-primary-foreground">
                      {v.category} · {formatDate(v.created_at)}
                    </p>

                    {/* Comments toggle */}
                    <button
                    onClick={() => toggleComments(v.id)}
                    className="flex items-center gap-1 mt-3 text-xs hover:underline text-primary-foreground">
                    
                      <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Comentários
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {/* Comments section */}
                    {isExpanded &&
                  <div className="mt-3 border-t pt-3 space-y-3">
                        {videoComments.length === 0 &&
                    <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
                    }
                        {videoComments.map((c) =>
                    <div key={c.id} className="flex gap-2 items-start">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-secondary-foreground">
                                {c.user_name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-primary-foreground text-base font-bold">{c.user_name}</p>
                              <p className="text-primary-foreground text-base">{c.content}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(c.created_at)}</p>
                            </div>
                            {user && c.user_id === user.id &&
                      <button onClick={() => handleDeleteComment(c.id, v.id)} className="text-destructive p-0.5">
                                <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                      }
                          </div>
                    )}

                        {/* New comment input */}
                        <div className="flex gap-2">
                          <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleComment(v.id)}
                        placeholder="Escreva um comentário..."
                        className="flex-1 border bg-background px-3 py-1.5 text-xs rounded" />
                      
                          <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComment(v.id)}
                        className="px-2">
                        
                            <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                  }
                  </div>
                </div>);

          })}
          </div>
        }
      </div>
    </AppLayout>);

}