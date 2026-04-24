import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GraduationCap, PlayCircle, Tag, Video, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Category { id: string; name: string; description: string | null; color: string; icon: string; sort_order: number; }
interface Playlist { id: string; title: string; description: string | null; cover_url: string | null; category_id: string | null; is_published: boolean; sort_order: number; }
interface Lesson { id: string; playlist_id: string | null; title: string; description: string | null; video_url: string; thumbnail_url: string | null; duration_seconds: number | null; difficulty: string; xp_reward: number; extra_material_url: string | null; sort_order: number; }

export default function AdminVideoLessons() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [lessonsByPl, setLessonsByPl] = useState<Record<string, Lesson[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  // Forms
  const [newCat, setNewCat] = useState({ name: "", color: "#1a5632", icon: "graduation-cap" });
  const [newPlaylist, setNewPlaylist] = useState({ title: "", description: "", cover_url: "", category_id: "" });
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [newLessonOpen, setNewLessonOpen] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState({ title: "", description: "", video_url: "", duration_seconds: "", difficulty: "simples", xp_reward: "10", extra_material_url: "" });

  const fetchAll = async () => {
    const [c, p, l] = await Promise.all([
      supabase.from("video_categories").select("*").order("sort_order"),
      supabase.from("video_playlists").select("*").order("sort_order"),
      supabase.from("video_lessons").select("*").order("sort_order"),
    ]);
    setCategories((c.data || []) as Category[]);
    setPlaylists((p.data || []) as Playlist[]);
    const map: Record<string, Lesson[]> = {};
    ((l.data || []) as Lesson[]).forEach((ls) => {
      if (!ls.playlist_id) return;
      if (!map[ls.playlist_id]) map[ls.playlist_id] = [];
      map[ls.playlist_id].push(ls);
    });
    setLessonsByPl(map);
  };

  useEffect(() => { fetchAll(); }, []);

  // Categories
  const addCategory = async () => {
    if (!newCat.name.trim()) return;
    const max = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from("video_categories").insert({ ...newCat, sort_order: max } as any);
    if (error) { toast.error("Erro ao criar categoria"); return; }
    toast.success("Categoria criada");
    setNewCat({ name: "", color: "#1a5632", icon: "graduation-cap" });
    fetchAll();
  };
  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir categoria? Playlists ficarão sem categoria.")) return;
    const { error } = await supabase.from("video_categories").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Categoria excluída");
    fetchAll();
  };

  // Playlists
  const addPlaylist = async () => {
    if (!newPlaylist.title.trim() || !user) return;
    const max = playlists.length > 0 ? Math.max(...playlists.map((p) => p.sort_order)) + 1 : 0;
    const { error } = await supabase.from("video_playlists").insert({
      title: newPlaylist.title.trim(),
      description: newPlaylist.description || null,
      cover_url: newPlaylist.cover_url || null,
      category_id: newPlaylist.category_id || null,
      sort_order: max,
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao criar curso"); return; }
    toast.success("Curso criado");
    setNewPlaylist({ title: "", description: "", cover_url: "", category_id: "" });
    fetchAll();
  };

  const savePlaylist = async () => {
    if (!editingPlaylist) return;
    const { error } = await supabase.from("video_playlists").update({
      title: editingPlaylist.title,
      description: editingPlaylist.description,
      cover_url: editingPlaylist.cover_url,
      category_id: editingPlaylist.category_id,
      is_published: editingPlaylist.is_published,
    } as any).eq("id", editingPlaylist.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Curso atualizado");
    setEditingPlaylist(null);
    fetchAll();
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm("Excluir curso e todas as suas aulas?")) return;
    const { error } = await supabase.from("video_playlists").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Curso excluído");
    fetchAll();
  };

  // Lessons
  const openNewLesson = (playlistId: string) => {
    setEditingLesson(null);
    setLessonForm({ title: "", description: "", video_url: "", duration_seconds: "", difficulty: "simples", xp_reward: "10", extra_material_url: "" });
    setNewLessonOpen(playlistId);
  };

  const openEditLesson = (l: Lesson) => {
    setNewLessonOpen(l.playlist_id);
    setEditingLesson(l);
    setLessonForm({
      title: l.title,
      description: l.description || "",
      video_url: l.video_url,
      duration_seconds: l.duration_seconds?.toString() || "",
      difficulty: l.difficulty,
      xp_reward: l.xp_reward.toString(),
      extra_material_url: l.extra_material_url || "",
    });
  };

  const saveLesson = async () => {
    if (!lessonForm.title.trim() || !lessonForm.video_url.trim() || !newLessonOpen || !user) return;
    const data = {
      playlist_id: newLessonOpen,
      title: lessonForm.title.trim(),
      description: lessonForm.description || null,
      video_url: lessonForm.video_url.trim(),
      duration_seconds: lessonForm.duration_seconds ? parseInt(lessonForm.duration_seconds) : null,
      difficulty: lessonForm.difficulty,
      xp_reward: parseInt(lessonForm.xp_reward) || 10,
      extra_material_url: lessonForm.extra_material_url || null,
    };
    if (editingLesson) {
      const { error } = await supabase.from("video_lessons").update(data as any).eq("id", editingLesson.id);
      if (error) { toast.error("Erro"); return; }
      toast.success("Aula atualizada");
    } else {
      const existing = lessonsByPl[newLessonOpen] || [];
      const max = existing.length > 0 ? Math.max(...existing.map((l) => l.sort_order)) + 1 : 0;
      const { error } = await supabase.from("video_lessons").insert({ ...data, sort_order: max, created_by: user.id } as any);
      if (error) { toast.error("Erro"); return; }
      toast.success("Aula criada");
    }
    setNewLessonOpen(null);
    setEditingLesson(null);
    fetchAll();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Excluir aula?")) return;
    const { error } = await supabase.from("video_lessons").delete().eq("id", id);
    if (error) { toast.error("Erro"); return; }
    toast.success("Aula excluída");
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="border rounded-2xl p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm">Categorias</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((c) => (
            <div key={c.id} className="inline-flex items-center gap-2 border rounded-full pl-3 pr-1 py-1 text-xs bg-secondary">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-medium">{c.name}</span>
              <button onClick={() => deleteCategory(c.id)} className="hover:text-destructive p-0.5">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma categoria.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Nome" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className="flex-1 min-w-[140px] h-9 text-sm" />
          <input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} className="w-9 h-9 rounded border cursor-pointer" />
          <Button size="sm" onClick={addCategory} className="gap-1"><Plus className="w-3.5 h-3.5" /> Adicionar</Button>
        </div>
      </div>

      {/* New playlist form */}
      <div className="border rounded-2xl p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-sm">Novo Curso</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs">Título</Label><Input value={newPlaylist.title} onChange={(e) => setNewPlaylist({ ...newPlaylist, title: e.target.value })} className="mt-1 h-9 text-sm" /></div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <select value={newPlaylist.category_id} onChange={(e) => setNewPlaylist({ ...newPlaylist, category_id: e.target.value })} className="mt-1 w-full border bg-background rounded h-9 px-2 text-sm">
              <option value="">Sem categoria</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><Label className="text-xs">Descrição</Label><Textarea rows={2} value={newPlaylist.description} onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })} className="mt-1 text-sm" /></div>
          <div className="sm:col-span-2"><Label className="text-xs">URL da capa (opcional)</Label><Input value={newPlaylist.cover_url} onChange={(e) => setNewPlaylist({ ...newPlaylist, cover_url: e.target.value })} className="mt-1 h-9 text-sm" placeholder="https://..." /></div>
        </div>
        <div className="mt-3"><Button size="sm" onClick={addPlaylist} className="gap-1"><Plus className="w-3.5 h-3.5" /> Criar Curso</Button></div>
      </div>

      {/* Playlists */}
      <div className="space-y-3">
        {playlists.map((p) => {
          const cat = categories.find((c) => c.id === p.category_id);
          const lessons = lessonsByPl[p.id] || [];
          const open = expanded === p.id;
          return (
            <div key={p.id} className="border rounded-2xl bg-card overflow-hidden">
              <div className="flex items-center gap-3 p-4">
                <button onClick={() => setExpanded(open ? null : p.id)} className="flex-1 flex items-center gap-3 text-left">
                  {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {p.cover_url ? <img src={p.cover_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><GraduationCap className="w-5 h-5 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{lessons.length} {lessons.length === 1 ? "aula" : "aulas"}{cat ? ` · ${cat.name}` : ""}{!p.is_published ? " · Despublicado" : ""}</p>
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingPlaylist(p)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePlaylist(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {open && (
                <div className="border-t p-4 space-y-2 bg-secondary/30">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-2 p-2 bg-card rounded-lg border">
                      <span className="w-6 h-6 rounded bg-secondary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <PlayCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{l.title}</p>
                        <p className="text-[10px] text-muted-foreground">+{l.xp_reward} XP · {l.difficulty}</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => openEditLesson(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLesson(l.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                  {lessons.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhuma aula. Adicione a primeira ↓</p>}
                  <Button size="sm" variant="outline" onClick={() => openNewLesson(p.id)} className="gap-1 w-full"><Plus className="w-3.5 h-3.5" /> Adicionar aula</Button>
                </div>
              )}
            </div>
          );
        })}
        {playlists.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum curso criado.</p>}
      </div>

      {/* Edit playlist dialog */}
      <Dialog open={!!editingPlaylist} onOpenChange={(o) => !o && setEditingPlaylist(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar curso</DialogTitle></DialogHeader>
          {editingPlaylist && (
            <div className="space-y-3">
              <div><Label className="text-xs">Título</Label><Input value={editingPlaylist.title} onChange={(e) => setEditingPlaylist({ ...editingPlaylist, title: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Descrição</Label><Textarea rows={3} value={editingPlaylist.description || ""} onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">URL da capa</Label><Input value={editingPlaylist.cover_url || ""} onChange={(e) => setEditingPlaylist({ ...editingPlaylist, cover_url: e.target.value })} className="mt-1" placeholder="https://..." /></div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <select value={editingPlaylist.category_id || ""} onChange={(e) => setEditingPlaylist({ ...editingPlaylist, category_id: e.target.value || null })} className="mt-1 w-full border bg-background rounded h-9 px-2 text-sm">
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editingPlaylist.is_published} onChange={(e) => setEditingPlaylist({ ...editingPlaylist, is_published: e.target.checked })} />
                Publicado
              </label>
              <Button onClick={savePlaylist} className="gap-1.5 w-full"><Save className="w-4 h-4" /> Salvar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New/Edit lesson dialog */}
      <Dialog open={!!newLessonOpen} onOpenChange={(o) => { if (!o) { setNewLessonOpen(null); setEditingLesson(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingLesson ? "Editar aula" : "Nova aula"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Título *</Label><Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Descrição</Label><Textarea rows={3} value={lessonForm.description} onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs flex items-center gap-1"><Video className="w-3 h-3" /> URL do YouTube *</Label><Input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="mt-1" placeholder="https://youtube.com/watch?v=..." /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Duração (s)</Label><Input type="number" value={lessonForm.duration_seconds} onChange={(e) => setLessonForm({ ...lessonForm, duration_seconds: e.target.value })} className="mt-1" placeholder="600" /></div>
              <div><Label className="text-xs">XP</Label><Input type="number" value={lessonForm.xp_reward} onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: e.target.value })} className="mt-1" /></div>
              <div>
                <Label className="text-xs">Dificuldade</Label>
                <select value={lessonForm.difficulty} onChange={(e) => setLessonForm({ ...lessonForm, difficulty: e.target.value })} className="mt-1 w-full border bg-background rounded h-9 px-2 text-sm">
                  <option value="simples">Iniciante (10 XP)</option>
                  <option value="intermediario">Intermediário (20 XP)</option>
                  <option value="avancado">Avançado (30 XP)</option>
                </select>
              </div>
            </div>
            <div><Label className="text-xs">Material extra (URL)</Label><Input value={lessonForm.extra_material_url} onChange={(e) => setLessonForm({ ...lessonForm, extra_material_url: e.target.value })} className="mt-1" placeholder="https://..." /></div>
            <Button onClick={saveLesson} className="gap-1.5 w-full"><Save className="w-4 h-4" /> {editingLesson ? "Salvar" : "Criar aula"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
