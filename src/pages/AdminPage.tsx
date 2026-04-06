import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  Trash2, Plus, ExternalLink, Image as ImageIcon, Pencil, Eye, ChevronDown, ChevronUp, Pin, Video, Radio,
  Megaphone, LayoutDashboard, Users, Link2, Tag, ListVideo, KeyRound, MonitorPlay, ImageIcon as BannerIcon,
  FileText, Search, ToggleLeft, ToggleRight, Info, CalendarDays,
} from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sendPushNotification } from "@/lib/sendPushNotification";

type Tab = "notices" | "banners" | "lives" | "materials" | "videos" | "playlists" | "forum-categories" | "links" | "users" | "password" | "events";

interface CtaButton {
  text: string;
  url: string;
  newTab: boolean;
}

const tabGroups = [
  {
    label: "Conteúdo",
    tabs: [
      { key: "notices" as Tab, label: "Avisos", icon: Megaphone, desc: "Publicar e gerenciar avisos" },
      { key: "banners" as Tab, label: "Banners", icon: BannerIcon, desc: "Banners da página inicial" },
      { key: "lives" as Tab, label: "Ao Vivo", icon: Radio, desc: "Transmissões ao vivo" },
      { key: "events" as Tab, label: "Eventos", icon: CalendarDays, desc: "Calendário de eventos" },
    ],
  },
  {
    label: "Aprendizado",
    tabs: [
      { key: "materials" as Tab, label: "Materiais", icon: FileText, desc: "Materiais de apoio" },
      { key: "videos" as Tab, label: "Videoaulas", icon: Video, desc: "Videoaulas e conteúdos" },
      { key: "playlists" as Tab, label: "Playlists", icon: ListVideo, desc: "Organizar videoaulas" },
    ],
  },
  {
    label: "Configuração",
    tabs: [
      { key: "forum-categories" as Tab, label: "Categorias", icon: Tag, desc: "Categorias do fórum" },
      { key: "links" as Tab, label: "Links", icon: Link2, desc: "Links do menu lateral" },
      { key: "users" as Tab, label: "Usuários", icon: Users, desc: "Cadastrar e gerenciar" },
      { key: "password" as Tab, label: "Senha", icon: KeyRound, desc: "Alterar sua senha" },
    ],
  },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("notices");
  const activeTabInfo = tabGroups.flatMap((g) => g.tabs).find((t) => t.key === tab);

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground">Painel Administrativo</h1>
              <p className="text-sm text-muted-foreground">Gerencie todo o conteúdo e configurações da plataforma</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar nav */}
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="lg:sticky lg:top-8 space-y-4">
              {tabGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5 px-2">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.tabs.map((t) => {
                      const active = tab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setTab(t.key)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                            active
                              ? "bg-primary text-primary-foreground font-medium shadow-sm"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <t.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Mobile horizontal tabs */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 mt-4">
              {tabGroups.flatMap((g) => g.tabs).map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-all ${
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Section header */}
            {activeTabInfo && (
              <div className="flex items-center gap-2 mb-5">
                <activeTabInfo.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <h2 className="font-heading font-bold text-lg">{activeTabInfo.label}</h2>
                <span className="text-xs text-muted-foreground">— {activeTabInfo.desc}</span>
              </div>
            )}

            {tab === "notices" && <AdminNotices />}
            {tab === "banners" && <AdminBanners />}
            {tab === "lives" && <AdminLives />}
            {tab === "materials" && <AdminMaterials />}
            {tab === "videos" && <AdminVideos />}
            {tab === "playlists" && <AdminPlaylists />}
            {tab === "links" && <AdminLinks />}
            {tab === "forum-categories" && <AdminForumCategories />}
            {tab === "users" && <AdminUsers />}
            {tab === "password" && <AdminChangePassword />}
            {tab === "events" && <AdminEvents />}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

/* ═══════════════════════ Shared Components ═══════════════════════ */

function FormCard({ title, children, onSubmit, submitLabel, loading, icon: Icon }: {
  title: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  loading?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <Card className="mb-6 border-dashed border-primary/20 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" strokeWidth={1.5} />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            {loading ? "Processando..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ItemCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`transition-all duration-150 hover:shadow-md hover:border-primary/10 ${className}`}>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ═══════════════════════ Notices ═══════════════════════ */
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
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data) setNotices(data);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, class_name, avatar_url");
    if (data) setAllUsers(data);
  };

  useEffect(() => {
    fetchNotices();
    fetchAllUsers();
    supabase.from("events").select("id, title, event_date").order("event_date").then(({ data }) => {
      if (data) setEvents(data);
    });
  }, []);

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
      event_id: selectedEventId || null,
    } as any);

    setUploading(false);
    if (error) { toast.error("Erro ao criar aviso."); return; }
    toast.success(sendType === "specific" ? `Aviso enviado para ${selectedUserIds.length} usuário(s).` : "Aviso global criado.");
    setTitle(""); setContent(""); setPinned(false); setImageFile(null); setCtaButtons([]); setSendType("global"); setSelectedUserIds([]); setSelectedEventId("");
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
      <FormCard title="Novo Aviso" onSubmit={handleCreate} submitLabel={uploading ? "Publicando..." : "Publicar"} loading={uploading} icon={Megaphone}>
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
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo: 10MB."); e.target.value = ""; return; }
            setImageFile(file || null);
          }} className="mt-1 block w-full text-sm font-body" />
          <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG, WEBP, GIF · Máx: 10MB</p>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer group">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
          <Pin className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.5} />
          Fixar aviso no topo
        </label>

        {/* Send type */}
        <div className="space-y-2">
          <Label className="text-sm">Destinatários</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="sendType" checked={sendType === "global"} onChange={() => setSendType("global")} />
              Todos os usuários
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="sendType" checked={sendType === "specific"} onChange={() => setSendType("specific")} />
              Selecionar usuários
            </label>
          </div>
          {sendType === "specific" && (
            <div className="border bg-background rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
              {allUsers.map((u: any) => (
                <label key={u.user_id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1.5 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.user_id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.user_id]);
                      else setSelectedUserIds(selectedUserIds.filter((id) => id !== u.user_id));
                    }}
                  />
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px] font-bold bg-secondary text-secondary-foreground">
                      {u.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{u.full_name}</span>
                  {u.class_name && <span className="text-muted-foreground text-xs">({u.class_name})</span>}
                </label>
              ))}
              {allUsers.length === 0 && <p className="text-xs text-muted-foreground">Nenhum usuário encontrado.</p>}
            </div>
          )}
        </div>

        {/* Event link */}
        <div>
          <Label className="text-sm flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" strokeWidth={1.5} /> Vincular a Evento (opcional)
          </Label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10"
          >
            <option value="">Nenhum evento</option>
            {events.map((ev: any) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.event_date + "T12:00:00").toLocaleDateString("pt-BR")}
              </option>
            ))}
          </select>
        </div>

        {/* CTA buttons */}
        <div className="space-y-2">
          <Label className="text-sm">Botões de Ação</Label>
          {ctaButtons.map((cta, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 border bg-background p-2.5 rounded-lg">
              <Input placeholder="Texto" value={cta.text} onChange={(e) => updateCta(i, "text", e.target.value)} className="flex-1 min-w-[100px] h-8 text-xs" />
              <Input placeholder="https://..." value={cta.url} onChange={(e) => updateCta(i, "url", e.target.value)} className="flex-1 min-w-[130px] h-8 text-xs" />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={cta.newTab} onChange={(e) => updateCta(i, "newTab", e.target.checked)} />
                Nova aba
              </label>
              <button type="button" onClick={() => removeCta(i)} className="text-destructive hover:text-destructive/80 p-1 transition-colors">
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
      </FormCard>

      <div className="space-y-2">
        {notices.map((n) => (
          <ItemCard key={n.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                {n.image_url && <img src={n.image_url} alt="" className="w-12 h-12 object-cover rounded-lg flex-shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-heading font-semibold">{n.title}</p>
                    {n.is_pinned && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1"><Pin className="w-2.5 h-2.5" />Fixado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(n.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={async () => {
                        await supabase.from("notices").update({ is_pinned: !n.is_pinned } as any).eq("id", n.id);
                        toast.success(n.is_pinned ? "Desafixado." : "Fixado!");
                        fetchNotices();
                      }}
                      className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Pin className={`w-4 h-4 ${n.is_pinned ? "text-primary fill-primary" : ""}`} strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{n.is_pinned ? "Desafixar" : "Fixar"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => fetchReads(n.id)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Ver quem leu</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => handleDelete(n.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </div>
            </div>
            {viewingReads === n.id && (
              <div className="mt-3 border-t pt-3">
                <p className="text-xs font-semibold mb-1.5 text-muted-foreground">Lido por {noticeReads.length} pessoa(s):</p>
                {noticeReads.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Ninguém leu este aviso ainda.</p>
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
          </ItemCard>
        ))}
        {notices.length === 0 && <EmptyState message="Nenhum aviso criado ainda." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Banners ═══════════════════════ */
function AdminBanners() {
  const { user } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [highlightColor, setHighlightColor] = useState("#006ab5");
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchBanners = async () => {
    const { data } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
    if (data) setBanners(data);
  };
  useEffect(() => { fetchBanners(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !mediaFile) return;
    setUploading(true);

    const path = `${Date.now()}_${mediaFile.name}`;
    const { error: upErr } = await supabase.storage.from("banners").upload(path, mediaFile);
    if (upErr) { toast.error("Erro no upload da mídia."); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("banners").getPublicUrl(path);

    const mediaType = mediaFile.type.startsWith("video/") ? "video" : "image";

    const { error } = await supabase.from("banners").insert({
      title: title.trim(),
      button_text: buttonText.trim() || null,
      button_url: buttonUrl.trim() || null,
      media_url: urlData.publicUrl,
      media_type: mediaType,
      starts_at: startsAt ? new Date(startsAt).toISOString() : new Date().toISOString(),
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      created_by: user!.id,
      highlight_color: highlightColor,
      category: category.trim() || null,
    } as any);

    setUploading(false);
    if (error) { toast.error("Erro ao criar banner."); return; }
    toast.success("Banner criado!");
    setTitle(""); setButtonText(""); setButtonUrl(""); setMediaFile(null); setStartsAt(""); setEndsAt(""); setHighlightColor("#006ab5"); setCategory("");
    fetchBanners();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Banner excluído.");
    fetchBanners();
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div>
      <FormCard title="Novo Banner" onSubmit={handleCreate} submitLabel={uploading ? "Enviando..." : "Publicar Banner"} loading={uploading} icon={BannerIcon}>
        <div>
          <Label className="text-sm">Título do Banner</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Texto do botão (opcional)</Label><Input value={buttonText} onChange={(e) => setButtonText(e.target.value)} className="mt-1" placeholder="Saiba mais" /></div>
          <div><Label className="text-sm">Link do botão (opcional)</Label><Input value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} className="mt-1" placeholder="https://..." /></div>
        </div>
        <div>
          <Label className="text-sm flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Imagem ou Vídeo</Label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 20 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo: 20MB."); e.target.value = ""; return; }
            setMediaFile(file || null);
          }} className="mt-1 block w-full text-sm font-body" required />
          <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG, WEBP, GIF, MP4, WEBM · Máx: 20MB</p>
          {mediaFile && mediaFile.type.startsWith("video/") && (
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo selecionado — será reproduzido em loop, sem som.</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Categoria (opcional)</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" placeholder="Ex: Evento, Novidade" />
          </div>
          <div>
            <Label className="text-sm">Cor de destaque</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5" />
              <Input value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="flex-1 font-mono text-xs" maxLength={7} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Data de início</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" /></div>
          <div><Label className="text-sm">Data de fim (opcional)</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" /></div>
        </div>
      </FormCard>

      <div className="space-y-2">
        {banners.map((b) => (
          <ItemCard key={b.id}>
            <div className="flex items-center gap-3">
              {b.media_type === "video" ? (
                <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-muted-foreground" />
                </div>
              ) : (
                <img src={b.media_url} alt="" className="w-16 h-10 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-heading font-semibold truncate">{b.title}</p>
                  {b.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{b.category}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDate(b.starts_at)}{b.ends_at ? ` → ${formatDate(b.ends_at)}` : " → Sem prazo"}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-4 h-4 rounded-full border flex-shrink-0" style={{ backgroundColor: b.highlight_color || "#006ab5" }} />
                <button onClick={() => handleDelete(b.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </ItemCard>
        ))}
        {banners.length === 0 && <EmptyState message="Nenhum banner criado." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Links ═══════════════════════ */
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
      <FormCard title="Novo Link do Menu" onSubmit={handleCreate} submitLabel={uploading ? "Salvando..." : "Adicionar"} loading={uploading} icon={Link2}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" placeholder="https://..." required /></div>
        </div>
        <div>
          <Label className="text-sm">Ícone (opcional)</Label>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && file.size > 2 * 1024 * 1024) { toast.error("Ícone muito grande. Máximo: 2MB."); e.target.value = ""; return; }
            setIconFile(file || null);
          }} className="mt-1 block w-full text-sm font-body" />
          <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG, WEBP, SVG · Máx: 2MB</p>
        </div>
      </FormCard>
      <div className="space-y-2">
        {links.map((l, idx) => (
          <ItemCard key={l.id}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveLink(l.id, "up")} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs transition-colors p-0.5">▲</button>
                <button onClick={() => moveLink(l.id, "down")} disabled={idx === links.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20 text-xs transition-colors p-0.5">▼</button>
              </div>
              {l.icon_url ? <img src={l.icon_url} alt="" className="w-5 h-5 object-contain flex-shrink-0" /> : <ExternalLink className="w-5 h-5 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-semibold truncate">{l.label}</p>
                <p className="text-xs text-muted-foreground truncate">{l.url}</p>
              </div>
              <button onClick={() => handleDelete(l.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </ItemCard>
        ))}
        {links.length === 0 && <EmptyState message="Nenhum link adicionado." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Materials ═══════════════════════ */
function AdminMaterials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Geral");
  const [driveUrl, setDriveUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("materials").select("*").order("created_at", { ascending: false });
    if (data) setMaterials(data);
  };
  useEffect(() => { fetchMaterials(); }, []);

  const isValidDriveLink = (url: string) => /^https:\/\/(drive\.google\.com|docs\.google\.com)\/.+/.test(url.trim());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !driveUrl.trim()) return;
    if (!isValidDriveLink(driveUrl)) { toast.error("Insira um link válido do Google Drive."); return; }
    setUploading(true);
    const { error } = await supabase.from("materials").insert({
      title: title.trim(), category: category.trim(), file_name: "Google Drive",
      file_url: driveUrl.trim(), file_size: null, uploaded_by: user!.id,
    });
    setUploading(false);
    if (error) { toast.error("Erro ao registrar material."); return; }
    toast.success("Material publicado.");
    setTitle(""); setCategory("Geral"); setDriveUrl("");
    fetchMaterials();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Material excluído.");
    fetchMaterials();
  };

  return (
    <div>
      <FormCard title="Novo Material (Google Drive)" onSubmit={handleCreate} submitLabel={uploading ? "Publicando..." : "Publicar"} loading={uploading} icon={FileText}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" /></div>
        </div>
        <div>
          <Label className="text-sm">Link do Google Drive</Label>
          <Input value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} className="mt-1" placeholder="https://drive.google.com/file/d/..." required />
          {driveUrl && !isValidDriveLink(driveUrl) && (
            <p className="text-xs text-destructive mt-1">Link inválido. Use um link do Google Drive.</p>
          )}
        </div>
      </FormCard>
      <div className="space-y-2">
        {materials.map((m) => (
          <ItemCard key={m.id}>
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-heading font-semibold">{m.title}</p>
                <p className="text-xs text-muted-foreground">{m.category}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />Abrir</a>
                <button onClick={() => handleDelete(m.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </ItemCard>
        ))}
        {materials.length === 0 && <EmptyState message="Nenhum material publicado." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Videos ═══════════════════════ */
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
      <FormCard title="Nova Videoaula" onSubmit={handleCreate} submitLabel="Publicar" icon={Video}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Categoria</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" /></div>
        </div>
        <div>
          <Label className="text-sm">URL do vídeo (YouTube ou Vimeo)</Label>
          <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="mt-1" placeholder="https://youtube.com/watch?v=..." required />
          <p className="text-xs text-muted-foreground mt-1">Cole o link do YouTube ou Vimeo</p>
        </div>
        <div>
          <Label className="text-sm">Descrição (opcional)</Label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 w-full border border-input bg-background p-2 text-sm font-body rounded-lg min-h-[60px] resize-y" />
        </div>
      </FormCard>
      <div className="space-y-2">
        {videos.map((v) => (
          <ItemCard key={v.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-heading font-semibold">{v.title}</p>
                <p className="text-xs text-muted-foreground">{v.category} · {new Date(v.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <button onClick={() => handleDelete(v.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </ItemCard>
        ))}
        {videos.length === 0 && <EmptyState message="Nenhuma videoaula adicionada." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Playlists ═══════════════════════ */
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
      <FormCard title="Nova Playlist" onSubmit={handleCreate} submitLabel="Criar" icon={ListVideo}>
        <div><Label className="text-sm">Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required /></div>
      </FormCard>
      <div className="space-y-2">
        {playlists.map((p: any) => (
          <Card key={p.id} className="overflow-hidden transition-all duration-150 hover:shadow-md">
            <div className="p-4 flex items-center justify-between">
              <button onClick={() => toggleExpand(p.id)} className="flex items-center gap-2 text-sm font-heading font-semibold hover:text-primary transition-colors">
                {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {p.title}
              </button>
              <button onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            {expandedId === p.id && (
              <div className="border-t p-4 space-y-2 bg-secondary/20">
                {(playlistVideos[p.id] || []).map((pv: any) => (
                  <div key={pv.id} className="flex items-center justify-between text-sm bg-card p-2.5 rounded-lg border">
                    <span className="truncate">{pv.video_lessons?.title || "Vídeo"}</span>
                    <button onClick={() => removeVideoFromPlaylist(pv.id, p.id)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <select value={selectedVideoId} onChange={(e) => setSelectedVideoId(e.target.value)} className="flex-1 border border-input bg-background px-2.5 py-1.5 text-sm rounded-lg">
                    <option value="">Selecionar vídeo...</option>
                    {videos.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                  <Button size="sm" onClick={() => addVideoToPlaylist(p.id)} className="gap-1"><Plus className="w-3 h-3" /></Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {playlists.length === 0 && <EmptyState message="Nenhuma playlist criada." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Users ═══════════════════════ */
function AdminUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [role, setRole] = useState<"admin" | "leader">("leader");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredUsers = searchQuery.trim()
    ? users.filter((u) =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.class_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  return (
    <div>
      <FormCard title="Cadastrar Usuário" onSubmit={handleCreate} submitLabel={creating ? "Criando..." : "Cadastrar"} loading={creating} icon={Users}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-sm">Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required minLength={6} /></div>
          <div><Label className="text-sm">Sala do Líder</Label><Input value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1" required placeholder="Ex: 3º Ano A" /></div>
          <div>
            <Label className="text-sm">Papel</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "leader")} className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm font-body rounded-lg h-10">
              <option value="leader">Líder de Classe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="text-sm flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Foto de perfil (opcional)</Label>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm font-body" />
        </div>
      </FormCard>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou sala..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {filteredUsers.map((u) => (
          <ItemCard key={u.id}>
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={u.avatar_url || undefined} />
                <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                  {u.full_name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-heading font-semibold">{u.full_name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {u.class_name && <span className="text-xs text-muted-foreground">{u.class_name}</span>}
                  {(u.roles as string[])?.map((r: string) => (
                    <Badge key={r} variant={r === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                      {r === "admin" ? "Admin" : "Líder"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </ItemCard>
        ))}
        {filteredUsers.length === 0 && <EmptyState message={searchQuery ? "Nenhum resultado encontrado." : "Nenhum usuário cadastrado."} />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Forum Categories ═══════════════════════ */
function AdminForumCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  const fetchCategories = async () => {
    const { data } = await supabase.from("forum_categories").select("*").order("sort_order");
    if (data) setCategories(data);
  };
  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from("forum_categories").insert({ name: name.trim(), description: description.trim() || null, sort_order: maxOrder, color } as any);
    if (error) { toast.error("Erro ao criar categoria."); return; }
    toast.success("Categoria criada.");
    setName(""); setDescription(""); setColor("#3b82f6");
    fetchCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase.from("forum_categories").update({ name: editName.trim(), description: editDescription.trim() || null, color: editColor } as any).eq("id", id);
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

  const startEdit = (cat: any) => { setEditingId(cat.id); setEditName(cat.name); setEditDescription(cat.description || ""); setEditColor(cat.color || "#3b82f6"); };

  return (
    <div>
      <FormCard title="Nova Categoria do Fórum" onSubmit={handleCreate} submitLabel="Criar Categoria" icon={Tag}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><Label className="text-sm">Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" required /></div>
          <div><Label className="text-sm">Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
          <div>
            <Label className="text-sm">Cor</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 h-10 text-sm font-mono" />
            </div>
          </div>
        </div>
      </FormCard>
      <div className="space-y-2">
        {categories.map((cat) => (
          <ItemCard key={cat.id}>
            {editingId === cat.id ? (
              <div className="space-y-3">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nome" className="h-9 text-sm" />
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Descrição" className="h-9 text-sm" />
                <div className="flex items-center gap-2">
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-8 h-8 rounded-lg border cursor-pointer" />
                  <Input value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-28 h-8 text-sm font-mono" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(cat.id)}>Salvar</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 shadow-sm" style={{ backgroundColor: cat.color || "#3b82f6" }} />
                  <div>
                    <p className="text-sm font-heading font-semibold">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => startEdit(cat)} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Pencil className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleDelete(cat.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </ItemCard>
        ))}
        {categories.length === 0 && <EmptyState message="Nenhuma categoria criada." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Change Password ═══════════════════════ */
function AdminChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("A nova senha deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { toast.error("A nova senha e a confirmação não coincidem."); return; }
    setLoading(true);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email) { toast.error("Erro ao obter dados do usuário."); setLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUser.email,
      password: currentPassword,
    });
    if (signInError) { toast.error("Senha atual incorreta."); setLoading(false); return; }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) { toast.error("Erro ao alterar a senha: " + error.message); return; }

    toast.success("Senha alterada com sucesso!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  return (
    <div className="max-w-md">
      <FormCard title="Alterar Senha" onSubmit={handleChangePassword} submitLabel={loading ? "Alterando..." : "Alterar Senha"} loading={loading} icon={KeyRound}>
        <div>
          <Label className="text-sm">Senha atual</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label className="text-sm">Nova senha</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" required minLength={6} />
        </div>
        <div>
          <Label className="text-sm">Confirmar nova senha</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required minLength={6} />
        </div>
      </FormCard>
    </div>
  );
}

/* ═══════════════════════ Lives ═══════════════════════ */
function AdminLives() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "twitch">("youtube");
  const [saving, setSaving] = useState(false);

  const fetchStreams = async () => {
    const { data } = await supabase.from("live_streams").select("*").order("created_at", { ascending: false });
    if (data) setStreams(data);
  };
  useEffect(() => { fetchStreams(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !streamUrl.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("live_streams").insert({
      title: title.trim(), description: description.trim() || null,
      stream_url: streamUrl.trim(), platform, is_active: false, created_by: user!.id,
    } as any);
    setSaving(false);
    if (error) { toast.error("Erro ao criar live."); return; }
    toast.success("Live criada! Ative quando estiver pronta.");
    setTitle(""); setDescription(""); setStreamUrl(""); setPlatform("youtube");
    fetchStreams();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    if (!currentActive) {
      await supabase.from("live_streams").update({ is_active: false } as any).neq("id", id);
    }
    const { error } = await supabase.from("live_streams").update({ is_active: !currentActive } as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success(!currentActive ? "Live ativada!" : "Live desativada.");
    fetchStreams();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("live_streams").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Live excluída.");
    fetchStreams();
  };

  return (
    <div>
      <FormCard title="Nova Transmissão" onSubmit={handleCreate} submitLabel={saving ? "Salvando..." : "Criar Live"} loading={saving} icon={Radio}>
        <div>
          <Label className="text-sm">Título da Live</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required placeholder="Ex: Aula ao vivo - Liderança" />
        </div>
        <div>
          <Label className="text-sm">Descrição (opcional)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Descrição breve" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Plataforma</Label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as "youtube" | "twitch")} className="mt-1 w-full h-10 rounded-lg border border-input bg-background px-3 text-sm">
              <option value="youtube">YouTube</option>
              <option value="twitch">Twitch</option>
            </select>
          </div>
          <div>
            <Label className="text-sm">Link da Transmissão</Label>
            <Input value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} className="mt-1" required placeholder={platform === "youtube" ? "https://youtube.com/watch?v=..." : "https://twitch.tv/canal"} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Info className="w-3 h-3" />Cole o link completo da live do YouTube ou canal da Twitch.</p>
      </FormCard>

      <div className="space-y-2">
        {streams.map((s) => (
          <ItemCard key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${s.is_active ? "bg-destructive animate-pulse" : "bg-muted-foreground/20"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-heading font-semibold truncate">{s.title}</p>
                  <Badge variant={s.is_active ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 h-4">
                    {s.is_active ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{s.platform === "youtube" ? "YouTube" : "Twitch"}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant={s.is_active ? "destructive" : "default"}
                      onClick={() => toggleActive(s.id, s.is_active)}
                      className="text-xs h-8 gap-1"
                    >
                      {s.is_active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {s.is_active ? "Desativar" : "Ativar"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{s.is_active ? "Desativar a transmissão" : "Ativar e notificar todos"}</TooltipContent>
                </Tooltip>
                <button onClick={() => handleDelete(s.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </ItemCard>
        ))}
        {streams.length === 0 && <EmptyState message="Nenhuma live criada." />}
      </div>
    </div>
  );
}

/* ═══════════════════════ Events ═══════════════════════ */
function AdminEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");

  const fetchEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: true });
    if (data) setEvents(data);
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) return;
    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate,
      event_time: eventTime || null,
      created_by: user!.id,
    } as any);
    if (error) { toast.error("Erro ao criar evento."); return; }
    toast.success("Evento criado!");
    setTitle(""); setDescription(""); setEventDate(""); setEventTime("");
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Evento excluído.");
    fetchEvents();
  };

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div>
      <FormCard title="Novo Evento" onSubmit={handleCreate} submitLabel="Criar Evento" icon={CalendarDays}>
        <div>
          <Label className="text-sm">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
        </div>
        <div>
          <Label className="text-sm">Descrição (opcional)</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Data</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="mt-1" required />
          </div>
          <div>
            <Label className="text-sm">Horário (opcional)</Label>
            <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="mt-1" />
          </div>
        </div>
      </FormCard>

      <div className="space-y-2">
        {events.map((ev) => (
          <ItemCard key={ev.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-sm font-heading font-bold text-primary leading-none">
                    {new Date(ev.event_date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit" })}
                  </span>
                  <span className="text-[9px] font-bold text-primary/70 uppercase">
                    {new Date(ev.event_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-heading font-semibold">{ev.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(ev.event_date)}
                    {ev.event_time && ` · ${ev.event_time.slice(0, 5)}`}
                  </p>
                  {ev.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ev.description}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(ev.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </ItemCard>
        ))}
        {events.length === 0 && <EmptyState message="Nenhum evento criado ainda." />}
      </div>
    </div>
  );
}
