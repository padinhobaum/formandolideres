import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type Tab = "users" | "students" | "notices" | "materials" | "videos";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("notices");

  const tabs: { key: Tab; label: string }[] = [
    { key: "notices", label: "Avisos" },
    { key: "students", label: "Alunos" },
    { key: "materials", label: "Materiais" },
    { key: "users", label: "Usuários" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <h2 className="text-2xl font-heading font-bold mb-6">Painel Administrativo</h2>

        <div className="flex gap-1 mb-6 border-b">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-body border-b-2 transition-colors ${
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

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data) setNotices(data);
  };
  useEffect(() => { fetchNotices(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    const { error } = await supabase.from("notices").insert({
      title: title.trim(),
      content: content.trim(),
      author_id: user!.id,
      author_name: profile?.full_name || "",
      is_pinned: pinned,
    });
    if (error) { toast.error("Erro ao criar aviso."); return; }
    toast.success("Aviso criado.");
    setTitle(""); setContent(""); setPinned(false);
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
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Fixar aviso
        </label>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Publicar</Button>
      </form>

      <div className="space-y-2">
        {notices.map((n) => (
          <div key={n.id} className="border bg-card p-4 flex items-start justify-between">
            <div>
              <p className="text-sm font-heading font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
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
          <div>
            <Label className="text-sm">Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">Turma</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">Nº Chamada</Label>
            <Input type="number" value={callNumber} onChange={(e) => setCallNumber(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-sm">Contato responsável</Label>
            <Input value={guardianContact} onChange={(e) => setGuardianContact(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-sm">Observações</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full border bg-background p-2 text-sm font-body rounded min-h-[60px] resize-y"
          />
        </div>
        <Button type="submit" size="sm"><Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />Cadastrar</Button>
      </form>

      <div className="space-y-2">
        {students.map((s) => (
          <div key={s.id} className="border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">{s.full_name}</p>
              <p className="text-xs text-muted-foreground">{s.class_name} · Nº {s.call_number ?? "—"}</p>
            </div>
            <button onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive/80 p-1">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
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
      title: title.trim(),
      category: category.trim(),
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      uploaded_by: user!.id,
    });

    setUploading(false);
    if (error) { toast.error("Erro ao registrar material."); return; }
    toast.success("Material publicado.");
    setTitle(""); setCategory("Geral"); setFile(null);
    fetchMaterials();
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    // Extract path from URL
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
          <div>
            <Label className="text-sm">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">Categoria</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-sm">Arquivo</Label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-1 block w-full text-sm font-body"
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={uploading}>
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
          {uploading ? "Enviando..." : "Publicar"}
        </Button>
      </form>

      <div className="space-y-2">
        {materials.map((m) => (
          <div key={m.id} className="border bg-card p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium">{m.title}</p>
              <p className="text-xs text-muted-foreground">{m.category} · {m.file_name}</p>
            </div>
            <button onClick={() => handleDelete(m.id, m.file_url)} className="text-destructive hover:text-destructive/80 p-1">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </button>
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
    const { data } = await supabase.from("profiles").select("*, user_roles(role)");
    if (data) setUsers(data);
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) return;
    setCreating(true);

    // Sign up the new user (will auto-create profile via trigger)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
      options: { data: { full_name: fullName.trim() } },
    });

    if (signUpError || !signUpData.user) {
      toast.error("Erro ao criar usuário: " + (signUpError?.message || ""));
      setCreating(false);
      return;
    }

    // Assign role
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: signUpData.user.id,
      role,
    });

    setCreating(false);
    if (roleError) {
      toast.error("Usuário criado, mas erro ao atribuir papel.");
    } else {
      toast.success("Usuário criado com sucesso.");
    }
    setEmail(""); setPassword(""); setFullName("");
    fetchUsers();
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="border bg-card p-5 mb-6 space-y-3">
        <h3 className="font-heading font-bold text-sm mb-2">Cadastrar Usuário</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">Senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required minLength={6} />
          </div>
          <div>
            <Label className="text-sm">Papel</Label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "leader")}
              className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10"
            >
              <option value="leader">Líder de Classe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <Button type="submit" size="sm" disabled={creating}>
          <Plus className="w-4 h-4 mr-1" strokeWidth={1.5} />
          {creating ? "Criando..." : "Cadastrar"}
        </Button>
      </form>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="border bg-card p-4">
            <p className="text-sm font-body font-medium">{u.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {(u.user_roles as any[])?.map((r: any) => r.role === "admin" ? "Administrador" : "Líder").join(", ") || "Sem papel"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
