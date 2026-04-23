import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, Map, Pencil } from "lucide-react";
import { sendPushNotification } from "@/lib/sendPushNotification";

interface Track {
  id: string; title: string; description: string | null; cover_url: string | null;
  is_sequential: boolean; is_published: boolean; sort_order: number;
}
interface Module { id: string; track_id: string; title: string; sort_order: number; }
interface Lesson {
  id: string; module_id: string; title: string; description: string | null;
  video_url: string; difficulty: string; xp_reward: number;
  duration_seconds: number | null; extra_material_url: string | null; sort_order: number;
}

export default function AdminTracks() {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});

  // Form trilha
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSequential, setNewSequential] = useState(true);

  const fetchTracks = async () => {
    const { data } = await supabase.from("tracks").select("*").order("sort_order");
    if (data) setTracks(data as any);
  };
  useEffect(() => { fetchTracks(); }, []);

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !user) return;
    const maxOrder = tracks.length > 0 ? Math.max(...tracks.map((t) => t.sort_order)) + 1 : 0;
    const { data, error } = await supabase.from("tracks").insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      is_sequential: newSequential,
      created_by: user.id,
      sort_order: maxOrder,
    } as any).select("id").single();
    if (error) { toast.error("Erro ao criar trilha."); return; }
    toast.success("Trilha criada!");
    if (data) {
      sendPushNotification({
        title: "🗺️ Nova trilha de aprendizagem",
        body: newTitle.trim(),
        url: "/trilhas",
        contentType: "video",
        referenceId: (data as any).id,
      });
    }
    setNewTitle(""); setNewDesc(""); setNewSequential(true);
    fetchTracks();
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Excluir esta trilha e todas as aulas? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Trilha excluída.");
    fetchTracks();
  };

  const togglePublished = async (t: Track) => {
    await supabase.from("tracks").update({ is_published: !t.is_published } as any).eq("id", t.id);
    fetchTracks();
  };

  const expand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    const { data: mods } = await supabase.from("modules").select("*").eq("track_id", id).order("sort_order");
    setModules((prev) => ({ ...prev, [id]: (mods as any) || [] }));
    const moduleIds = (mods || []).map((m: any) => m.id);
    if (moduleIds.length > 0) {
      const { data: lsns } = await supabase.from("lessons").select("*").in("module_id", moduleIds).order("sort_order");
      const byMod: Record<string, Lesson[]> = {};
      (lsns || []).forEach((l: any) => {
        if (!byMod[l.module_id]) byMod[l.module_id] = [];
        byMod[l.module_id].push(l as Lesson);
      });
      setLessons((prev) => ({ ...prev, ...byMod }));
    }
  };

  const refreshTrackContents = async (trackId: string) => {
    setExpanded(null);
    setTimeout(() => expand(trackId), 50);
  };

  return (
    <div>
      {/* Form criar trilha */}
      <Card className="mb-6 border-dashed border-primary/20 bg-card/80">
        <CardContent className="pt-5">
          <form onSubmit={handleCreateTrack} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Map className="w-4 h-4 text-primary" />
              <span className="text-sm font-heading font-bold">Nova Trilha</span>
            </div>
            <div>
              <Label className="text-sm">Título</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Descrição (opcional)</Label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="mt-1 w-full border border-input bg-background p-2 text-sm rounded-lg min-h-[60px]" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={newSequential} onChange={(e) => setNewSequential(e.target.checked)} />
              Sequencial (aulas desbloqueiam progressivamente)
            </label>
            <Button type="submit" size="sm" className="gap-1.5"><Plus className="w-4 h-4" /> Criar trilha</Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de trilhas */}
      <div className="space-y-2">
        {tracks.map((t) => (
          <Card key={t.id}>
            <div className="p-4 flex items-center justify-between gap-2">
              <button onClick={() => expand(t.id)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                {expanded === t.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span className="text-sm font-heading font-semibold truncate">{t.title}</span>
                {!t.is_published && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">rascunho</span>}
                {t.is_sequential && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">sequencial</span>}
              </button>
              <button onClick={() => togglePublished(t)} className="text-xs text-muted-foreground hover:text-foreground px-2">
                {t.is_published ? "Despublicar" : "Publicar"}
              </button>
              <button onClick={() => handleDeleteTrack(t.id)} className="text-destructive p-1.5 hover:bg-destructive/10 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {expanded === t.id && (
              <div className="border-t p-4 bg-secondary/20 space-y-3">
                <ModuleEditor
                  trackId={t.id}
                  modules={modules[t.id] || []}
                  lessonsByMod={lessons}
                  onChange={() => refreshTrackContents(t.id)}
                />
              </div>
            )}
          </Card>
        ))}
        {tracks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-6">Nenhuma trilha criada ainda.</p>
        )}
      </div>
    </div>
  );
}

function ModuleEditor({ trackId, modules, lessonsByMod, onChange }: {
  trackId: string;
  modules: Module[];
  lessonsByMod: Record<string, Lesson[]>;
  onChange: () => void;
}) {
  const [newModTitle, setNewModTitle] = useState("");

  const addModule = async () => {
    if (!newModTitle.trim()) return;
    const maxOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.sort_order)) + 1 : 0;
    const { error } = await supabase.from("modules").insert({
      track_id: trackId, title: newModTitle.trim(), sort_order: maxOrder,
    } as any);
    if (error) { toast.error("Erro ao criar módulo."); return; }
    setNewModTitle("");
    onChange();
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Excluir módulo e todas as aulas dele?")) return;
    await supabase.from("modules").delete().eq("id", id);
    onChange();
  };

  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <div key={m.id} className="bg-card border rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-sm font-bold">{m.title}</span>
            <button onClick={() => deleteModule(m.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <LessonEditor moduleId={m.id} lessons={lessonsByMod[m.id] || []} onChange={onChange} />
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={newModTitle} onChange={(e) => setNewModTitle(e.target.value)} placeholder="Novo módulo..." className="flex-1" />
        <Button size="sm" variant="secondary" onClick={addModule} className="gap-1"><Plus className="w-3 h-3" /> Módulo</Button>
      </div>
    </div>
  );
}

function LessonEditor({ moduleId, lessons, onChange }: {
  moduleId: string; lessons: Lesson[]; onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [difficulty, setDifficulty] = useState<"simples" | "intermediario" | "avancado">("simples");
  const [xp, setXp] = useState(10);
  const [extraUrl, setExtraUrl] = useState("");

  const reset = () => {
    setTitle(""); setVideoUrl(""); setDescription(""); setDuration(""); setDifficulty("simples"); setXp(10); setExtraUrl(""); setAdding(false);
  };

  const addLesson = async () => {
    if (!title.trim() || !videoUrl.trim()) { toast.error("Título e URL obrigatórios."); return; }
    const maxOrder = lessons.length > 0 ? Math.max(...lessons.map((l) => l.sort_order)) + 1 : 0;
    const { error } = await supabase.from("lessons").insert({
      module_id: moduleId,
      title: title.trim(),
      video_url: videoUrl.trim(),
      description: description.trim() || null,
      duration_seconds: duration ? parseInt(duration, 10) : null,
      difficulty, xp_reward: xp,
      extra_material_url: extraUrl.trim() || null,
      sort_order: maxOrder,
    } as any);
    if (error) { toast.error("Erro ao adicionar aula."); return; }
    toast.success("Aula adicionada.");
    reset();
    onChange();
  };

  const deleteLesson = async (id: string) => {
    await supabase.from("lessons").delete().eq("id", id);
    onChange();
  };

  // Auto ajusta XP ao mudar dificuldade
  const setDiff = (d: "simples" | "intermediario" | "avancado") => {
    setDifficulty(d);
    setXp(d === "simples" ? 10 : d === "intermediario" ? 20 : 30);
  };

  return (
    <div className="space-y-2 pl-2 border-l-2 border-muted">
      {lessons.map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-2 text-xs bg-secondary/40 rounded px-2 py-1.5">
          <span className="truncate flex-1">{l.title} <span className="text-muted-foreground">· +{l.xp_reward} XP · {l.difficulty}</span></span>
          <button onClick={() => deleteLesson(l.id)} className="text-destructive p-1 hover:bg-destructive/10 rounded">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {!adding ? (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus className="w-3 h-3" /> Adicionar aula
        </button>
      ) : (
        <div className="bg-background rounded p-2 space-y-2 border">
          <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
          <Input placeholder="URL do YouTube" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="h-8 text-xs" />
          <textarea placeholder="Descrição (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-input bg-background p-1.5 text-xs rounded min-h-[40px]" />
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Duração (s)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs" />
            <select value={difficulty} onChange={(e) => setDiff(e.target.value as any)} className="border border-input bg-background px-2 text-xs rounded h-8">
              <option value="simples">Simples</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
            <Input placeholder="XP" type="number" value={xp} onChange={(e) => setXp(parseInt(e.target.value, 10) || 0)} className="h-8 text-xs" />
          </div>
          <Input placeholder="Link material complementar (opcional)" value={extraUrl} onChange={(e) => setExtraUrl(e.target.value)} className="h-8 text-xs" />
          <div className="flex gap-2">
            <Button size="sm" onClick={addLesson} className="h-7 text-xs">Adicionar</Button>
            <Button size="sm" variant="ghost" onClick={reset} className="h-7 text-xs">Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
