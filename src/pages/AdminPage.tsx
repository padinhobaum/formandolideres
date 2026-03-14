import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, Image as ImageIcon, Pencil, Eye, ChevronDown, ChevronUp } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

type Tab = "users" | "students" | "notices" | "materials" | "videos" | "links" | "forum-categories" | "playlists" | "password";

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
    { key: "playlists", label: "Playlists" },
    { key: "forum-categories", label: "Categorias Fórum" },
    { key: "links", label: "Links Menu" },
    { key: "users", label: "Usuários" },
    { key: "password", label: "Alterar Senha" },
  ];

  return (
    <AppLayout>
      <div className="w-full">
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
        {tab === "playlists" && <AdminPlaylists />}
        {tab === "links" && <AdminLinks />}
        {tab === "forum-categories" && <AdminForumCategories />}
        {tab === "users" && <AdminUsers />}
        {tab === "password" && <AdminChangePassword />}
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
  const [viewingReads, setViewingReads] = useState<string | null>(null);
  const [noticeReads, setNoticeReads] = useState<any[]>([]);
  const [sendType, setSendType] = useState<"global" | "specific">("global");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data) setNotices(data);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, class_name");
    if (data) setAllUsers(data);
  };

  useEffect(() => { fetchNotices(); fetchAllUsers(); }, []);

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
      target_user_ids: sendType === "specific" && selectedUserIds.length > 0 ? selectedUserIds : null,
    } as any);

    setUploading(false);
    if (error) { toast.error("Erro ao criar aviso."); return; }
    toast.success(sendType === "specific" ? `Aviso enviado para ${selectedUserIds.length} usuário(s).` : "Aviso global criado.");
    setTitle(""); setContent(""); setPinned(false); setImageFile(null); setCtaButtons([]); setSendType("global"); setSelectedUserIds([]);
    fetchNotices();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Aviso excluído.");
    fetchNotices();
  };

  const fetchReads = async (noticeId: string) => {
    if (viewingReads === noticeId) { setViewingReads(null); return; }
    setViewingReads(noticeId);
    const { data } = await supabase.from("notice_reads").select("*").eq("notice_id", noticeId);
    if (!data || data.length === 0) { setNoticeReads([]); return; }
    const userIds = (data as any[]).map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    const profileMap: Record<string, string> = {};
    profiles?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });
    setNoticeReads((data as any[]).map((r: any) => ({ ...r, full_name: profileMap[r.user_id] || "Usuário" })));
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Novo Aviso</h3>
        <div>
          <Label className="text-sm">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label className="text-sm">Conteúdo</Label>
          <RichTextEditor value={content} onChange={setContent} placeholder="Escreva o conteúdo do aviso..." />
        </div>
        <div>
          <Label className="text-sm flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Imagem (opcional)
          </Label>
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Fixar aviso
        </label>

        {/* Send type selector */}
        <div className="space-y-2">
          <Label className="text-sm">Tipo de envio</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="sendType" checked={sendType === "global"} onChange={() => setSendType("global")} />
              Envio global (todos)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="sendType" checked={sendType === "specific"} onChange={() => setSendType("specific")} />
              Usuários específicos
            </label>
          </div>
          {sendType === "specific" && (
            <div className="border bg-background rounded p-3 max-h-48 overflow-y-auto space-y-1">
              {allUsers.map((u: any) => (
                <label key={u.user_id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.user_id]);
                      else setSelectedUserIds(selectedUserIds.filter((id) => id !== u.user_id));
                    }}
                  />
                  {u.full_name} {u.class_name && <span className="text-muted-foreground text-xs">({u.class_name})</span>}
                </label>
              ))}
              {allUsers.length === 0 && <p className="text-xs text-muted-foreground">Nenhum usuário encontrado.</p>}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Botões de Ação (CTA)</Label>
          {ctaButtons.map((cta, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border bg-background p-2 rounded">
              <Input placeholder="Texto do botão" value={cta.text} onChange={(e) => updateCta(i, "text", e.target.value)} className="flex-1 min-w-[120px] h-8 text-xs" />
              <Input placeholder="https://..." value={cta.url} onChange={(e) => updateCta(i, "url", e.target.value)} className="flex-1 min-w-[150px] h-8 text-xs" />
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
          <div key={n.id} className="border bg-card p-4 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {n.image_url && <img src={n.image_url} alt="" className="w-12 h-12 object-cover rounded flex-shrink-0" />}
                <div>
                  <p className="text-sm font-heading font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => fetchReads(n.id)} className="text-muted-foreground hover:text-foreground p-1" title="Ver quem leu">
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                </button>
                <button onClick={() => handleDelete(n.id)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            {viewingReads === n.id && (
              <div className="mt-3 border-t pt-2">
                <p className="text-xs font-medium mb-1">Lido por ({noticeReads.length}):</p>
                {noticeReads.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Ninguém leu este aviso ainda.</p>
                ) : (
                  <div className="space-y-1">
                    {noticeReads.map((r: any) => (
                      <p key={r.id} className="text-xs text-muted-foreground">
                        {r.full_name} — {new Date(r.read_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
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
    const { error } = await supabase.from("custom_links").insert({ label: label.trim(), url: url.trim(), icon_url: iconUrl, sort_order: maxOrder } as any);
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
    const a = links[idx]; const b = links[swapIdx];
    await Promise.all([
      supabase.from("custom_links").update({ sort_order: b.sort_order } as any).eq("id", a.id),
      supabase.from("custom_links").update({ sort_order: a.sort_order } as any).eq("id", b.id),
    ]);
    fetchLinks();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Novo Link do Menu</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome do botão</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" placeholder="https://..." required /></div>
        </div>
        <div>
          <Label className="text-sm">Ícone (imagem, opcional)</Label>
          <input type="file" accept="image/*" onChange={(e) => setIconFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" />
        </div>
        <Button type="submit" size="sm" disabled={uploading}><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />{uploading ? "Salvando..." : "Adicionar"}</Button>
      </form>
      <div className="space-y-2">
        {links.map((l, idx) => (
          <div key={l.id} className="border bg-card p-4 flex items-center gap-3 rounded-xl">
            <div className="flex flex-col gap-0.5">
              <button onClick={() => moveLink(l.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▲</button>
              <button onClick={() => moveLink(l.id, "down")} disabled={idx === links.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs">▼</button>
            </div>
            {l.icon_url ? <img src={l.icon_url} alt="" className="w-5 h-5 object-contain flex-shrink-0" /> : <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-medium truncate">{l.label}</p>
              <p className="text-xs text-muted-foreground truncate">{l.url}</p>
            </div>
            <button onClick={() => handleDelete(l.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
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
      full_name: fullName.trim(), call_number: callNumber ? parseInt(callNumber) : null,
      class_name: className.trim(), guardian_contact: guardianContact.trim() || null, notes: notes.trim() || null,
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
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
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
          <div key={s.id} className="border bg-card p-4 flex items-center justify-between rounded-xl">
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
      <form onSubmit={handleUpload} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Upload de Material</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" /></div>
        </div>
        <div><Label className="text-sm">Arquivo</Label><input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" required /></div>
        <Button type="submit" size="sm" disabled={uploading}><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />{uploading ? "Enviando..." : "Publicar"}</Button>
      </form>
      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="border bg-card p-4 flex items-center justify-between rounded-xl">
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
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
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
          <div key={v.id} className="border bg-card p-4 flex items-center justify-between rounded-xl">
            <div><p className="text-sm font-body font-medium">{v.title}</p><p className="text-xs text-muted-foreground">{v.category} · {new Date(v.created_at).toLocaleDateString("pt-BR")}</p></div>
            <button onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Playlists ───── */
function AdminPlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<Record<string, any[]>>({});
  const [selectedVideoId, setSelectedVideoId] = useState("");

  const fetchPlaylists = async () => {
    const { data } = await supabase.from("playlists").select("*").order("sort_order");
    if (data) setPlaylists(data as any[]);
  };

  const fetchVideos = async () => {
    const { data } = await supabase.from("video_lessons").select("id, title").order("title");
    if (data) setVideos(data);
  };

  useEffect(() => { fetchPlaylists(); fetchVideos(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const maxOrder = playlists.length > 0 ? Math.max(...playlists.map((p: any) => p.sort_order)) + 1 : 0;
    const { error } = await supabase.from("playlists").insert({ title: title.trim(), created_by: user!.id, sort_order: maxOrder } as any);
    if (error) { toast.error("Erro ao criar playlist."); return; }
    toast.success("Playlist criada.");
    setTitle("");
    fetchPlaylists();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Playlist excluída.");
    fetchPlaylists();
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const { data } = await supabase.from("playlist_videos").select("*, video_lessons(title)").eq("playlist_id", id).order("sort_order");
    setPlaylistVideos((prev) => ({ ...prev, [id]: (data as any[]) || [] }));
  };

  const addVideoToPlaylist = async (playlistId: string) => {
    if (!selectedVideoId) return;
    const existing = playlistVideos[playlistId] || [];
    const maxOrder = existing.length > 0 ? Math.max(...existing.map((v: any) => v.sort_order)) + 1 : 0;
    const { error } = await supabase.from("playlist_videos").insert({ playlist_id: playlistId, video_id: selectedVideoId, sort_order: maxOrder } as any);
    if (error) { toast.error("Erro ao adicionar vídeo."); return; }
    setSelectedVideoId("");
    toggleExpand(playlistId);
  };

  const removeVideoFromPlaylist = async (pvId: string, playlistId: string) => {
    await supabase.from("playlist_videos").delete().eq("id", pvId);
    toggleExpand(playlistId);
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Nova Playlist</h3>
        <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Criar</Button>
      </form>
      <div className="space-y-2">
        {playlists.map((p: any) => (
          <div key={p.id} className="border bg-card rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <button onClick={() => toggleExpand(p.id)} className="flex items-center gap-2 text-sm font-body font-medium">
                {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {p.title}
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
            </div>
            {expandedId === p.id && (
              <div className="border-t p-4 space-y-2">
                {(playlistVideos[p.id] || []).map((pv: any) => (
                  <div key={pv.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                    <span>{pv.video_lessons?.title || "Vídeo"}</span>
                    <button onClick={() => removeVideoFromPlaylist(pv.id, p.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select value={selectedVideoId} onChange={(e) => setSelectedVideoId(e.target.value)} className="flex-1 border bg-background px-2 py-1.5 text-sm rounded">
                    <option value="">Selecionar vídeo...</option>
                    {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                  <Button size="sm" onClick={() => addVideoToPlaylist(p.id)}><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {playlists.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma playlist criada.</p>}
      </div>
    </div>
  );
}

/* ───── Users ───── */
function AdminUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [role, setRole] = useState<"admin" | "leader">("leader");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
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
    if (!email.trim() || !password.trim() || !fullName.trim() || !className.trim()) return;
    setCreating(true);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      const path = `new-user/${Date.now()}_${avatarFile.name}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = urlData.publicUrl;
      }
    }

    const { data, error } = await supabase.functions.invoke("create-user", {
      body: { email: email.trim(), password: password.trim(), full_name: fullName.trim(), role, class_name: className.trim(), avatar_url: avatarUrl },
    });

    setCreating(false);
    if (error || data?.error) {
      toast.error("Erro ao criar usuário: " + (data?.error || error?.message || ""));
      return;
    }
    toast.success("Usuário criado com sucesso.");
    setEmail(""); setPassword(""); setFullName(""); setClassName(""); setAvatarFile(null);
    fetchUsers();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Cadastrar Usuário</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required minLength={6} /></div>
          <div><Label className="text-sm">Sala do Líder</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" required placeholder="Ex: 3º Ano A" /></div>
          <div>
            <Label className="text-sm">Papel</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "leader")} className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10">
              <option value="leader">Líder de Classe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-sm flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Foto de perfil (opcional)</Label>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" />
        </div>
        <Button type="submit" size="sm" disabled={creating}><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />{creating ? "Criando..." : "Cadastrar"}</Button>
      </form>
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="border bg-card p-4 rounded-xl">
            <p className="text-sm font-body font-medium">{u.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {u.class_name && <span>{u.class_name} · </span>}
              {(u.roles as string[])?.map((r: string) => r === "admin" ? "Administrador" : "Líder").join(", ") || "Sem papel"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───── Forum Categories ───── */
function AdminForumCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("forum_categories").select("*").order("sort_order");
    if (data) setCategories(data);
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from("forum_categories").insert({ name: name.trim(), description: description.trim() || null, sort_order: maxOrder } as any);
    if (error) { toast.error("Erro ao criar categoria."); return; }
    toast.success("Categoria criada.");
    setName(""); setDescription("");
    fetchCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("forum_categories").update({ name: editName.trim(), description: editDescription.trim() || null } as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success("Categoria atualizada.");
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("forum_categories").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Categoria excluída.");
    fetchCategories();
  };

  const startEdit = (cat: any) => { setEditingId(cat.id); setEditName(cat.name); setEditDescription(cat.description || ""); };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3 rounded-xl">
        <h3 className="font-heading font-bold text-sm mb-2">Nova Categoria do Fórum</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Criar Categoria</Button>
      </form>
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.id} className="border bg-card p-4 rounded-xl">
            {editingId === cat.id ? (
              <div className="space-y-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" className="h-8 text-sm" />
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Descrição" className="h-8 text-sm" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(cat.id)}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-body font-medium">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(cat)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-4 h-4" strokeWidth={1.5} /></button>
                  <button onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive/80 p-1"><Trash2 className="w-4 h-4" strokeWidth={1.5} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
        {categories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>}
      </div>
    </div>
  );
}
