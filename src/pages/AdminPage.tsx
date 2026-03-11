import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, GripVertical, ExternalLink, Image as ImageIcon } from "lucide-react";

type Tab = "users" | "students" | "notices" | "materials" | "videos" | "links" | "forum-categories";

interface CtaButton {
  text: string;
  url: string;
  newTab: boolean;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("notices");

  const tabs: { key: Tab; label: string }[] = [
    { key: "notices", label: "Avisos" },
    { key: "students", label: "Alunos" },
    { key: "materials", label: "Materiais" },
    { key: "videos", label: "Videoaulas" },
    { key: "forum-categories", label: "Categorias Fórum" },
    { key: "links", label: "Links Menu" },
    { key: "users", label: "Usuários" },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <h2 className="font-heading font-bold mb-6 text-4xl text-accent">Painel Administrativo</h2>

        <div className="flex gap-1 mb-6 border-b overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-body border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "notices" && <AdminNotices />}
        {tab === "students" && <AdminStudents />}
        {tab === "materials" && <AdminMaterials />}
        {tab === "videos" && <AdminVideos />}
        {tab === "links" && <AdminLinks />}
        {tab === "forum-categories" && <AdminForumCategories />}
        {tab === "users" && <AdminUsers />}
      </div>
    </AppLayout>
  );
}

/* ───── Notices ───── */
function AdminNotices() {
  const { user, profile } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [ctaButtons, setCtaButtons] = useState<CtaButton[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data) setNotices(data);
  };
  useEffect(() => { fetchNotices(); }, []);

  const addCta = () => {
    if (ctaButtons.length >= 3) return;
    setCtaButtons([...ctaButtons, { text: "", url: "", newTab: true }]);
  };

  const updateCta = (i: number, field: keyof CtaButton, value: string | boolean) => {
    const updated = [...ctaButtons];
    (updated[i] as any)[field] = value;
    setCtaButtons(updated);
  };

  const removeCta = (i: number) => setCtaButtons(ctaButtons.filter((_, idx) => idx !== i));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setUploading(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `${Date.now()}_${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("notices").upload(path, imageFile);
      if (upErr) { toast.error("Erro no upload da imagem."); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("notices").getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }

    const validCtas = ctaButtons.filter((c) => c.text.trim() && c.url.trim());

    const { error } = await supabase.from("notices").insert({
      title: title.trim(),
      content: content.trim(),
      author_id: user!.id,
      author_name: profile?.full_name || "",
      is_pinned: pinned,
      image_url: imageUrl,
      cta_buttons: validCtas,
    } as any);

    setUploading(false);
    if (error) { toast.error("Erro ao criar aviso."); return; }
    toast.success("Aviso criado.");
    setTitle(""); setContent(""); setPinned(false); setImageFile(null); setCtaButtons([]);
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Aviso excluído.");
    fetchNotices();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Novo Aviso</h3>
        <div>
          <Label className="text-sm">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label className="text-sm">Conteúdo</Label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 w-full border bg-background p-2 text-sm font-body rounded min-h-[100px] resize-y"
            required
          />
        </div>
        <div>
          <Label className="text-sm flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Imagem (opcional)
          </Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm font-body"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Fixar aviso
        </label>

        {/* CTA Buttons */}
        <div className="space-y-2">
          <Label className="text-sm">Botões de Ação (CTA)</Label>
          {ctaButtons.map((cta, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border bg-background p-2 rounded">
              <Input
                placeholder="Texto do botão"
                value={cta.text}
                onChange={(e) => updateCta(i, "text", e.target.value)}
                className="flex-1 min-w-[120px] h-8 text-xs"
              />
              <Input
                placeholder="https://..."
                value={cta.url}
                onChange={(e) => updateCta(i, "url", e.target.value)}
                className="flex-1 min-w-[150px] h-8 text-xs"
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input type="checkbox" checked={cta.newTab} onChange={(e) => updateCta(i, "newTab", e.target.checked)} />
                Nova aba
              </label>
              <button type="button" onClick={() => removeCta(i)} className="text-destructive p-1">
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
          {ctaButtons.length < 3 && (
            <button type="button" onClick={addCta} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" strokeWidth={1.5} /> Adicionar botão
            </button>
          )}
        </div>

        <Button type="submit" size="sm" disabled={uploading}>
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
          {uploading ? "Publicando..." : "Publicar"}
        </Button>
      </form>

      <div className="space-y-2">
        {notices.map((n) => (
          <div key={n.id} className="border bg-card p-4 flex items-start justify-between">
            <div className="flex items-start gap-3">
              {n.image_url && (
                <img src={n.image_url} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-heading font-medium">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(n.id)} className="text-destructive hover:text-destructive/80 p-1">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Links ───── */
function AdminLinks() {
  const [links, setLinks] = useState<any[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchLinks = async () => {
    const { data } = await supabase.from("custom_links").select("*").order("sort_order");
    if (data) setLinks(data);
  };
  useEffect(() => { fetchLinks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !url.trim()) return;
    setUploading(true);

    let iconUrl: string | null = null;
    if (iconFile) {
      const path = `${Date.now()}_${iconFile.name}`;
      const { error: upErr } = await supabase.storage.from("icons").upload(path, iconFile);
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("icons").getPublicUrl(path);
        iconUrl = urlData.publicUrl;
      }
    }

    const maxOrder = links.length > 0 ? Math.max(...links.map((l) => l.sort_order)) + 1 : 0;

    const { error } = await supabase.from("custom_links").insert({
      label: label.trim(),
      url: url.trim(),
      icon_url: iconUrl,
      sort_order: maxOrder,
    } as any);

    setUploading(false);
    if (error) { toast.error("Erro ao criar link."); return; }
    toast.success("Link adicionado.");
    setLabel(""); setUrl(""); setIconFile(null);
    fetchLinks();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("custom_links").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Link excluído.");
    fetchLinks();
  };

  const moveLink = async (id: string, direction: "up" | "down") => {
    const idx = links.findIndex((l) => l.id === id);
    if ((direction === "up" && idx === 0) || (direction === "down" && idx === links.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const a = links[idx];
    const b = links[swapIdx];
    await Promise.all([
      supabase.from("custom_links").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("custom_links").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    fetchLinks();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Novo Link do Menu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Nome do botão</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" placeholder="https://..." required />
          </div>
        </div>
        <div>
          <Label className="text-sm">Ícone (imagem, opcional)</Label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setIconFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm font-body"
          />
        </div>
        <Button type="submit" size="sm" disabled={uploading}>
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
          {uploading ? "Salvando..." : "Adicionar"}
        </Button>
      </form>

      <div className="space-y-2">
        {links.map((l, idx) => (
          <div key={l.id} className="border bg-card p-4 flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveLink(l.id, "up")}
                disabled={idx === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              >▲</button>
              <button
                onClick={() => moveLink(l.id, "down")}
                disabled={idx === links.length - 1}
                className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
              >▼</button>
            </div>
            {l.icon_url ? (
              <img src={l.icon_url} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
            ) : (
              <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">{l.label}</p>
              <p className="text-xs text-muted-foreground truncate">{l.url}</p>
            </div>
            <button onClick={() => handleDelete(l.id)} className="text-destructive hover:text-destructive/80 p-1">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Students ───── */
function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [callNumber, setCallNumber] = useState("");
  const [className, setClassName] = useState("");
  const [guardianContact, setGuardianContact] = useState("");
  const [notes, setNotes] = useState("");

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("class_name").order("call_number");
    if (data) setStudents(data);
  };
  useEffect(() => { fetchStudents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !className.trim()) return;
    const { error } = await supabase.from("students").insert({
      full_name: fullName.trim(),
      call_number: callNumber ? parseInt(callNumber) : null,
      class_name: className.trim(),
      guardian_contact: guardianContact.trim() || null,
      notes: notes.trim() || null,
    });
    if (error) { toast.error("Erro ao cadastrar aluno."); return; }
    toast.success("Aluno cadastrado.");
    setFullName(""); setCallNumber(""); setClassName(""); setGuardianContact(""); setNotes("");
    fetchStudents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Aluno excluído.");
    fetchStudents();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Cadastrar Aluno</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Turma</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Nº Chamada</Label><Input type="number" value={callNumber} onChange={(e) => setCallNumber(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-sm">Contato responsável</Label><Input value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} className="mt-1" /></div>
        </div>
        <div>
          <Label className="text-sm">Observações</Label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 w-full border bg-background p-2 text-sm font-body rounded min-h-[60px] resize-y" />
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Cadastrar</Button>
      </form>
      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.id} className="border bg-card p-4 flex items-center justify-between">
            <div><p className="text-sm font-body font-medium">{s.full_name}</p><p className="text-xs text-muted-foreground">{s.class_name} · Nº {s.call_number ?? "—"}</p></div>
            <button onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Materials ───── */
function AdminMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Geral");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) setMaterials(data);
  };
  useEffect(() => { fetchMaterials(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    const filePath = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("materials").upload(filePath, file);
    if (uploadError) { toast.error("Erro no upload."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(filePath);
    const { error } = await supabase.from("materials").insert({
      title: title.trim(), category: category.trim(), file_name: file.name,
      file_url: urlData.publicUrl, file_size: file.size, uploaded_by: user!.id,
    });
    setUploading(false);
    if (error) { toast.error("Erro ao registrar material."); return; }
    toast.success("Material publicado.");
    setTitle(""); setCategory("Geral"); setFile(null);
    fetchMaterials();
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    const path = fileUrl.split("/materials/")[1];
    if (path) await supabase.storage.from("materials").remove([path]);
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Material excluído.");
    fetchMaterials();
  };

  return (
    <div>
      <form onSubmit={handleUpload} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Upload de Material</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" /></div>
        </div>
        <div>
          <Label className="text-sm">Arquivo</Label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" required />
        </div>
        <Button type="submit" size="sm" disabled={uploading}><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />{uploading ? "Enviando..." : "Publicar"}</Button>
      </form>
      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="border bg-card p-4 flex items-center justify-between">
            <div><p className="text-sm font-body font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.category} · {m.file_name}</p></div>
            <button onClick={() => handleDelete(m.id, m.file_url)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Videos ───── */
function AdminVideos() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState("Geral");

  const fetchVideos = async () => {
    const { data } = await supabase.from("video_lessons").select("*").order("created_at", { ascending: false });
    if (data) setVideos(data);
  };
  useEffect(() => { fetchVideos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;
    const { error } = await supabase.from("video_lessons").insert({
      title: title.trim(), description: description.trim() || null,
      video_url: videoUrl.trim(), category: category.trim(), created_by: user!.id,
    });
    if (error) { toast.error("Erro ao adicionar videoaula."); return; }
    toast.success("Videoaula adicionada.");
    setTitle(""); setDescription(""); setVideoUrl(""); setCategory("Geral");
    fetchVideos();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("video_lessons").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Videoaula excluída.");
    fetchVideos();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Nova Videoaula</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" /></div>
        </div>
        <div><Label className="text-sm">URL do vídeo (YouTube ou Vimeo)</Label><Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="mt-1" placeholder="https://youtube.com/watch?v=..." required /></div>
        <div><Label className="text-sm">Descrição (opcional)</Label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border bg-background p-2 text-sm font-body rounded min-h-[60px] resize-y" /></div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Publicar</Button>
      </form>
      <div className="space-y-2">
        {videos.map((v) => (
          <div key={v.id} className="border bg-card p-4 flex items-center justify-between">
            <div><p className="text-sm font-body font-medium">{v.title}</p><p className="text-xs text-muted-foreground">{v.category} · {new Date(v.created_at).toLocaleDateString("pt-BR")}</p></div>
            <button onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Users ───── */
function AdminUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "leader">("leader");
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const fetchUsers = async () => {
    const { data: profilesData } = await supabase.from("profiles").select("*");
    if (!profilesData) return;
    const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");
    const rolesMap: Record<string, string[]> = {};
    rolesData?.forEach((r: any) => {
      if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
      rolesMap[r.user_id].push(r.role);
    });
    setUsers(profilesData.map((p: any) => ({ ...p, roles: rolesMap[p.user_id] || [] })));
  };
  useEffect(() => { fetchUsers(); }, []);
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email: email.trim(), password: password.trim(), full_name: fullName.trim(), role },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error("Erro ao criar usuário: " + (data?.error || error?.message || ""));
      return;
    }
    toast.success("Usuário criado com sucesso.");
    setEmail(""); setPassword(""); setFullName("");
    fetchUsers();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Cadastrar Usuário</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required minLength={6} /></div>
          <div>
            <Label className="text-sm">Papel</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "leader")} className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10">
              <option value="leader">Líder de Classe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={creating}><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />{creating ? "Criando..." : "Cadastrar"}</Button>
      </form>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="border bg-card p-4">
            <p className="text-sm font-body font-medium">{u.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {(u.roles as string[])?.map((r: string) => r === "admin" ? "Administrador" : "Líder").join(", ") || "Sem papel"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
