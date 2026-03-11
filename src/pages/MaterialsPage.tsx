import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Download, FileText } from "lucide-react";

interface Material {
  id: string;
  title: string;
  category: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
      if (data) setMaterials(data);
    };
    fetch();
  }, []);

  const categories = [...new Set(materials.map((m) => m.category))].sort();
  const filtered = materials.filter((m) => !categoryFilter || m.category === categoryFilter);

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <h2 className="font-heading font-bold mb-6 text-accent text-4xl">Biblioteca de Materiais</h2>

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
        <p className="text-sm text-muted-foreground">Nenhum material disponível.</p> :

        <div className="space-y-2">
            {filtered.map((m) =>
          <div key={m.id} className="border bg-card p-4 flex items-center gap-4">
                <FileText className="text-muted-foreground flex-shrink-0 w-[30px] h-[30px]" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="font-body font-medium truncate text-lg text-primary">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.category} · {formatDate(m.created_at)}
                    {m.file_size ? ` · ${formatSize(m.file_size)}` : ""}
                  </p>
                </div>
                <a
              href={m.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline flex-shrink-0">
              
                  <Download className="w-4 h-4" strokeWidth={1.5} />
                  <span className="hidden sm:inline">Baixar</span>
                </a>
              </div>
          )}
          </div>
        }
      </div>
    </AppLayout>);

}