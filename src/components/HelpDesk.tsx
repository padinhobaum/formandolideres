import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HelpCircle, Plus, MessageSquare, Clock, CheckCircle, XCircle, Search as SearchIcon } from "lucide-react";

const CATEGORIES = [
  { value: "infrastructure", label: "Infraestrutura", emoji: "🏗️" },
  { value: "conflicts", label: "Conflitos", emoji: "⚠️" },
  { value: "performance", label: "Desempenho", emoji: "📊" },
  { value: "meeting", label: "Conversa Presencial", emoji: "🤝" },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: "Aberto", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  analyzing: { label: "Em análise", color: "bg-blue-100 text-blue-800 border-blue-200", icon: SearchIcon },
  deferred: { label: "Deferido", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  denied: { label: "Indeferido", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  admin_response: string | null;
  creator_id: string;
  target_admin_id: string;
  created_at: string;
  updated_at: string;
}

export default function HelpDesk() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [admins, setAdmins] = useState<{ user_id: string; full_name: string }[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("infrastructure");
  const [targetAdminId, setTargetAdminId] = useState("");

  // Admin response state
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("analyzing");

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("help_desk_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTickets(data as Ticket[]);
  };

  const fetchAdmins = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (roles && roles.length > 0) {
      const ids = roles.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", ids);
      if (profiles) {
        setAdmins(profiles as any[]);
        if (profiles.length > 0 && !targetAdminId) setTargetAdminId(profiles[0].user_id);
      }
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAdmins();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !targetAdminId) return;
    setLoading(true);
    const { error } = await supabase.from("help_desk_tickets").insert({
      title: title.trim(),
      description: description.trim(),
      category,
      creator_id: user!.id,
      target_admin_id: targetAdminId,
    } as any);
    setLoading(false);
    if (error) { toast.error("Erro ao criar chamado."); return; }
    toast.success("Chamado enviado com sucesso!");
    setTitle(""); setDescription(""); setCategory("infrastructure");
    setCreateOpen(false);
    fetchTickets();
  };

  const handleAdminRespond = async () => {
    if (!detailTicket) return;
    setLoading(true);
    const { error } = await supabase.from("help_desk_tickets").update({
      status: responseStatus,
      admin_response: responseText.trim() || null,
    } as any).eq("id", detailTicket.id);
    setLoading(false);
    if (error) { toast.error("Erro ao responder."); return; }
    toast.success("Resposta enviada!");
    setDetailTicket(null);
    setResponseText("");
    fetchTickets();
  };

  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  useEffect(() => {
    if (isAdmin && tickets.length > 0) {
      const ids = [...new Set(tickets.map(t => t.creator_id))];
      supabase.from("profiles").select("user_id, full_name").in("user_id", ids).then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => { map[p.user_id] = p.full_name; });
        setCreatorNames(map);
      });
    }
  }, [tickets, isAdmin]);

  const categoryLabel = (c: string) => CATEGORIES.find(x => x.value === c);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <h3 className="font-heading font-bold text-xl text-foreground">Chamados</h3>
        </div>
        {!isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Novo Chamado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Novo Chamado</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label className="text-sm">Título</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} required className="mt-1" placeholder="Resumo do chamado" />
                </div>
                <div>
                  <Label className="text-sm">Categoria</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`border rounded-xl p-3 text-left transition-all text-sm ${
                          category === c.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/30"
                        }`}
                      >
                        <span className="text-lg">{c.emoji}</span>
                        <p className="font-medium mt-1">{c.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Destinatário</Label>
                  <select
                    value={targetAdminId}
                    onChange={e => setTargetAdminId(e.target.value)}
                    className="mt-1 w-full border bg-background px-3 py-2 text-sm rounded h-10"
                    required
                  >
                    {admins.map(a => (
                      <option key={a.user_id} value={a.user_id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} required className="mt-1" placeholder="Descreva detalhadamente..." rows={4} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Enviando..." : "Enviar Chamado"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 border rounded-xl bg-card">
          <MessageSquare className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Nenhum chamado encontrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map(ticket => {
            const st = STATUS_MAP[ticket.status] || STATUS_MAP.open;
            const cat = categoryLabel(ticket.category);
            const StIcon = st.icon;
            return (
              <button
                key={ticket.id}
                onClick={() => { setDetailTicket(ticket); setResponseText(ticket.admin_response || ""); setResponseStatus(ticket.status); }}
                className="w-full border bg-card rounded-xl p-4 text-left hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm">{cat?.emoji}</span>
                      <h4 className="font-heading font-semibold text-sm truncate">{ticket.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
                    {isAdmin && creatorNames[ticket.creator_id] && (
                      <p className="text-xs text-primary mt-1">De: {creatorNames[ticket.creator_id]}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(ticket.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 gap-1 ${st.color}`}>
                    <StIcon className="w-3 h-3" />
                    {st.label}
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail / Response Dialog */}
      <Dialog open={!!detailTicket} onOpenChange={open => !open && setDetailTicket(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {detailTicket && (() => {
            const st = STATUS_MAP[detailTicket.status] || STATUS_MAP.open;
            const cat = categoryLabel(detailTicket.category);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-heading flex items-center gap-2">
                    <span>{cat?.emoji}</span> {detailTicket.title}
                  </DialogTitle>
                </DialogHeader>
                <Badge variant="outline" className={`w-fit ${st.color}`}>{st.label}</Badge>
                <p className="text-sm text-foreground whitespace-pre-wrap">{detailTicket.description}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(detailTicket.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>

                {detailTicket.admin_response && !isAdmin && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Resposta do administrador:</p>
                    <p className="text-sm whitespace-pre-wrap bg-secondary/50 rounded-lg p-3">{detailTicket.admin_response}</p>
                  </div>
                )}

                {isAdmin && (
                  <div className="border-t pt-3 mt-3 space-y-3">
                    <div>
                      <Label className="text-sm">Status</Label>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {(["analyzing", "deferred", "denied"] as const).map(s => {
                          const si = STATUS_MAP[s];
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setResponseStatus(s)}
                              className={`border rounded-lg px-3 py-1.5 text-xs transition-all ${
                                responseStatus === s ? "border-primary ring-1 ring-primary" : "hover:border-primary/30"
                              } ${si.color}`}
                            >
                              {si.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Resposta</Label>
                      <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} className="mt-1" rows={3} placeholder="Sua resposta..." />
                    </div>
                    <Button onClick={handleAdminRespond} disabled={loading} className="w-full">
                      {loading ? "Enviando..." : "Enviar Resposta"}
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
