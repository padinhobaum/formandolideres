import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Megaphone, Download, Users, Pin, Play } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  author_name: string;
  is_pinned: boolean;
  created_at: string;
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
  category: string;
  video_url: string;
  description: string | null;
  created_at: string;
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|.*&v=))([^?&]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [videos, setVideos] = useState<VideoLesson[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [noticesRes, materialsRes, studentsRes, videosRes] = await Promise.all([
        supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
        supabase.from("materials").select("id, title, category, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("video_lessons").select("id, title, category, video_url, description, created_at").order("created_at", { ascending: false }).limit(4),
      ]);
      if (noticesRes.data) setNotices(noticesRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
      if (studentsRes.count !== null) setStudentCount(studentsRes.count);
      if (videosRes.data) setVideos(videosRes.data);
    };
    fetchData();
  }, []);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h2 className="text-2xl font-heading font-bold mb-1">
          Olá, {profile?.full_name?.split(" ")[0]}
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          {isAdmin ? "Painel administrativo" : "Painel do líder de classe"}
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button onClick={() => navigate("/mural")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-body text-muted-foreground">Avisos</span>
            </div>
            <p className="text-2xl font-heading font-bold">{notices.length}</p>
          </button>
          <button onClick={() => navigate("/materiais")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-body text-muted-foreground">Materiais</span>
            </div>
            <p className="text-2xl font-heading font-bold">{materials.length}</p>
          </button>
          <button onClick={() => navigate("/alunos")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-sm font-body text-muted-foreground">Alunos</span>
            </div>
            <p className="text-2xl font-heading font-bold">{studentCount}</p>
          </button>
        </div>

        {/* Video lessons preview */}
        {videos.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-heading font-bold">Videoaulas Recentes</h3>
              <button onClick={() => navigate("/videoaulas")} className="text-xs text-primary hover:underline font-body">Ver todas →</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((v) => {
                const thumb = getYoutubeThumbnail(v.video_url);
                return (
                  <button
                    key={v.id}
                    onClick={() => navigate("/videoaulas")}
                    className="border bg-card text-left hover:bg-secondary transition-colors overflow-hidden"
                  >
                    {thumb ? (
                      <div className="relative aspect-video bg-muted">
                        <img src={thumb} alt={v.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                          <Play className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative aspect-video bg-muted flex items-center justify-center">
                        <Play className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-heading font-medium text-sm truncate">{v.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{v.category} · {formatDate(v.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Pinned / latest notices */}
        <section className="mb-8">
          <h3 className="text-lg font-heading font-bold mb-3">Últimos Avisos</h3>
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p>
          ) : (
            <div className="space-y-2">
              {notices.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate("/mural")}
                  className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <Pin className="w-3 h-3 text-primary" strokeWidth={1.5} />}
                    <span className="font-heading font-medium text-sm">{n.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Latest materials */}
        <section>
          <h3 className="text-lg font-heading font-bold mb-3">Materiais Recentes</h3>
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum material disponível.</p>
          ) : (
            <div className="space-y-2">
              {materials.map((m) => (
                <button
                  key={m.id}
                  onClick={() => navigate("/materiais")}
                  className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm">{m.title}</span>
                    <span className="text-xs text-muted-foreground">{m.category} · {formatDate(m.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}