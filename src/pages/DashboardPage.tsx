import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Megaphone, Download, Users, Pin } from "lucide-react";

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

export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [noticesRes, materialsRes, studentsRes] = await Promise.all([
      supabase.from("notices").select("*").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5),
      supabase.from("materials").select("id, title, category, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("students").select("id", { count: "exact", head: true })]
      );
      if (noticesRes.data) setNotices(noticesRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
      if (studentsRes.count !== null) setStudentCount(studentsRes.count);
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
          <button onClick={() => navigate("/mural")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Avisos</span>
            </div>
            <p className="text-2xl font-heading font-bold">{notices.length}</p>
          </button>
          <button onClick={() => navigate("/materiais")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2 font-sans">
              <Download className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Materiais</span>
            </div>
            <p className="text-2xl font-heading font-bold">{materials.length}</p>
          </button>
          <button onClick={() => navigate("/alunos")} className="border bg-card p-4 text-left hover:bg-secondary transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-primary w-[20px] h-[20px]" strokeWidth={1.5} />
              <span className="font-body text-muted-foreground text-lg">Alunos</span>
            </div>
            <p className="text-2xl font-heading font-bold">{studentCount}</p>
          </button>
        </div>

        {/* Pinned / latest notices */}
        <section className="mb-8">
          <h3 className="text-lg font-heading font-bold mb-3">Últimos Avisos</h3>
          {notices.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p> :

          <div className="space-y-2">
              {notices.map((n) =>
            <button
              key={n.id}
              onClick={() => navigate("/mural")}
              className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors">
              
                  <div className="flex items-center gap-2">
                    {n.is_pinned && <Pin className="w-3 h-3 text-primary" strokeWidth={1.5} />}
                    <span className="font-heading font-medium text-sm">{n.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{formatDate(n.created_at)}</span>
                  </div>
                </button>
            )}
            </div>
          }
        </section>

        {/* Latest materials */}
        <section>
          <h3 className="text-lg font-heading font-bold mb-3">Materiais Recentes</h3>
          {materials.length === 0 ?
          <p className="text-sm text-muted-foreground">Nenhum material disponível.</p> :

          <div className="space-y-2">
              {materials.map((m) =>
            <button
              key={m.id}
              onClick={() => navigate("/materiais")}
              className="w-full border bg-card p-4 text-left hover:bg-secondary transition-colors">
              
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