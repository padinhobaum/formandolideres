import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Megaphone, Download, Users, Pin, Play, Video } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
  image_url: string | null;
}

interface Material {
  id: string;
  title: string;
  category: string;
  created_at: string;
}

interface VideoLesson {
  id: string;
  title: string;
  video_url: string;
  category: string;
  created_at: string;
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [noticesRes, materialsRes, studentsRes, videosRes] = await Promise.all([
      supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
      supabase.from("materials").select("id, title, category, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("video_lessons").select("id, title, video_url, category, created_at").order("created_at", { ascending: false }).limit(4)]
      );
      if (noticesRes.data) setNotices(noticesRes.data as Notice[]);
      if (materialsRes.data) setMaterials(materialsRes.data);
      if (studentsRes.count !== null) setStudentCount(studentsRes.count);
      if (videosRes.data) setVideoLessons(videosRes.data as VideoLesson[]);
    };
    fetchData();
  }, []);

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h2 className="font-heading font-bold mb-1 text-4xl text-accent">
          Olá, {profile?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground mb-8 text-lg">
          {isAdmin ? "Painel administrativo" : "Painel do líder de classe"}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button onClick={() => navigate("/mural")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Avisos</span>
            </div>
            <p className="font-heading font-bold text-primary text-3xl">{notices.length}</p>
          </button>
          <button onClick={() => navigate("/materiais")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
            <div className="flex items-center gap-2 mb-2 font-sans">
              <Download className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Materiais</span>
            </div>
            <p className="font-heading font-bold text-primary text-3xl">{materials.length}</p>
          </button>
          <button onClick={() => navigate("/alunos")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Alunos</span>
            </div>
            <p className="font-heading font-bold text-primary text-3xl">{studentCount}</p>
          </button>
        </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videoLessons.map((v) => {
              const thumbnail = getYouTubeThumbnail(v.video_url);
              return (
                <button
                  key={v.id}
                  onClick={() => navigate("/videoaulas")}
                  className="border bg-card overflow-hidden text-left hover:bg-secondary transition-colors group rounded-xl">
                  
                    <div className="relative aspect-video bg-muted">
                      {thumbnail ?
                    <img
                      src={thumbnail}
                      alt={v.title}
                      className="w-full h-full object-cover"
                      loading="lazy" /> :


                    <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                    }
                      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent">
                          <Play className="w-5 h-5 text-primary-foreground ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-heading font-medium text-sm line-clamp-1">{v.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {v.category} · {formatDate(v.created_at)}
                      </p>
                    </div>
                  </button>);

            })}
            </div>
          }
        </section>

        {/* Pinned / latest notices */}
        <section className="mb-8 px-[20px] py-[20px] rounded-xl bg-primary pt-[20px]">
          <h3 className="font-heading font-bold mb-3 text-2xl text-primary-foreground">Últimos Avisos</h3>
          {notices.length === 0 ?
          <p className="text-sm text-primary-foreground">Nenhum aviso publicado.</p> :

          <div className="space-y-2">
              {notices.map((n) =>
            <button
              key={n.id}
              onClick={() => navigate("/mural")}
              className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
              
                  <div className="flex items-center gap-3">
                    {n.image_url &&
                <img src={n.image_url} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" loading="lazy" />
                }
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {n.is_pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" strokeWidth={1.5} />}
                      <span className="font-heading font-medium text-sm truncate">{n.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(n.created_at)}</span>
                  </div>
                </button>
            )}
            </div>
          }
        </section>

        {/* Latest materials */}
        <section className="px-[20px] py-[20px] rounded-xl bg-accent">
          <h3 className="font-heading font-bold mb-3 text-2xl text-primary-foreground">Materiais Recentes</h3>
          {materials.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhum material disponível.</p> :

          <div className="space-y-2">
              {materials.map((m) =>
            <button
              key={m.id}
              onClick={() => navigate("/materiais")}
              className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors rounded-xl">
              
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.category} · {formatDate(m.created_at)}</span>
                  </div>
                </button>
            )}
            </div>
          }
        </section>
      </div>
    </AppLayout>);

}