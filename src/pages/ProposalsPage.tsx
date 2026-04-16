import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEditalConfig } from "@/hooks/useEditalConfig";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, ThumbsUp, MessageSquare, ArrowUp, Clock, Flame, Send,
  Users, ChevronLeft, History, Lock, Pencil, Trash2, UserPlus,
} from "lucide-react";

const CATEGORIES = [
  "Infraestrutura", "Eventos", "Ensino", "Convivência", "Tecnologia", "Esportes", "Cultura", "Outro",
];

const IMPACT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };
const EFFORT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-gray-500" },
  submitted: { label: "Enviada", color: "bg-blue-500" },
  in_review: { label: "Em análise", color: "bg-yellow-500" },
  approved: { label: "Aprovada", color: "bg-green-500" },
  rejected: { label: "Rejeitada", color: "bg-red-500" },
  in_execution: { label: "Em execução", color: "bg-purple-500" },
  completed: { label: "Concluída", color: "bg-emerald-600" },
};

const PHASE_LABELS: Record<string, string> = {
  submission: "Submissão",
  discussion: "Discussão",
  voting: "Votação",
  selection: "Seleção",
  direction: "Encaminhamento",
};

export default function ProposalsPage() {
  const { config, loading: configLoading } = useEditalConfig();
  const navigate = useNavigate();

  if (configLoading) return <AppLayout><div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div></AppLayout>;

  if (!config?.is_active) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lock className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-heading font-bold mb-2">Edital Inativo</h2>
          <p className="text-muted-foreground">O Edital de Propostas não está aberto no momento.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <ProposalsFeed config={config} />
    </AppLayout>
  );
}

function ProposalsFeed({ config }: { config: any }) {
  const { user, profile, isAdmin } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [totalVotesUsed, setTotalVotesUsed] = useState(0);
  const [sortBy, setSortBy] = useState<"votes" | "recent" | "trending">("votes");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    const orderCol = sortBy === "votes" ? "vote_count" : sortBy === "recent" ? "created_at" : "score";
    const { data } = await supabase
      .from("proposals")
      .select("*")
      .neq("status", "draft")
      .order(orderCol, { ascending: false });
    if (data) setProposals(data);
    setLoading(false);
  };

  const fetchMyVotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("proposal_votes").select("proposal_id").eq("user_id", user.id);
    if (data) {
      setMyVotes(new Set(data.map((v: any) => v.proposal_id)));
      setTotalVotesUsed(data.length);
    }
  };

  useEffect(() => { fetchProposals(); fetchMyVotes(); }, [sortBy]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("proposals-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => fetchProposals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sortBy]);

  const handleVote = async (proposalId: string) => {
    if (!user) return;
    if (config.current_phase !== "voting" && config.current_phase !== "discussion") {
      toast.error("Votação não está aberta nesta fase.");
      return;
    }

    if (myVotes.has(proposalId)) {
      // Remove vote
      await supabase.from("proposal_votes").delete().eq("proposal_id", proposalId).eq("user_id", user.id);
      setMyVotes(prev => { const s = new Set(prev); s.delete(proposalId); return s; });
      setTotalVotesUsed(prev => prev - 1);
      toast.success("Voto removido.");
    } else {
      if (totalVotesUsed >= config.max_votes_per_user) {
        toast.error(`Você já usou todos os seus ${config.max_votes_per_user} votos.`);
        return;
      }
      const { error } = await supabase.from("proposal_votes").insert({ proposal_id: proposalId, user_id: user.id });
      if (error) {
        if (error.code === "23505") toast.error("Você já votou nesta proposta.");
        else toast.error("Erro ao votar.");
        return;
      }
      setMyVotes(prev => new Set(prev).add(proposalId));
      setTotalVotesUsed(prev => prev + 1);
      toast.success("Voto registrado! 👍");
    }
    fetchProposals();
  };

  if (selectedProposal) {
    return <ProposalDetail proposalId={selectedProposal} onBack={() => setSelectedProposal(null)} config={config} onVote={handleVote} hasVoted={myVotes.has(selectedProposal)} />;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <img src="/lovable-uploads/edital-icon.png" alt="" className="w-10 h-10" />
        <div className="flex-1">
          <h1 className="font-heading font-bold text-2xl">Edital de Propostas</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">{PHASE_LABELS[config.current_phase]}</Badge>
            <span className="text-xs text-muted-foreground">
              {totalVotesUsed}/{config.max_votes_per_user} votos usados
            </span>
          </div>
        </div>
        {(config.current_phase === "submission" || config.current_phase === "discussion") && (
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Nova Proposta
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="flex gap-1.5 mb-4">
        {([
          { key: "votes" as const, icon: ArrowUp, label: "Mais votadas" },
          { key: "recent" as const, icon: Clock, label: "Recentes" },
          { key: "trending" as const, icon: Flame, label: "Em destaque" },
        ]).map(s => (
          <Button
            key={s.key}
            variant={sortBy === s.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setSortBy(s.key)}
            className="gap-1 text-xs"
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </Button>
        ))}
      </div>

      {/* Proposals list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Nenhuma proposta ainda</p>
          <p className="text-sm">Seja o primeiro a criar uma proposta!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map(p => (
            <ProposalCard
              key={p.id}
              proposal={p}
              hasVoted={myVotes.has(p.id)}
              onVote={() => handleVote(p.id)}
              onClick={() => setSelectedProposal(p.id)}
              canVote={config.current_phase === "voting" || config.current_phase === "discussion"}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateProposalDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => { fetchProposals(); setShowCreate(false); }}
      />
    </div>
  );
}

function ProposalCard({ proposal: p, hasVoted, onVote, onClick, canVote }: {
  proposal: any; hasVoted: boolean; onVote: () => void; onClick: () => void; canVote: boolean;
}) {
  const statusInfo = STATUS_LABELS[p.status] || STATUS_LABELS.submitted;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Vote button */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0" onClick={e => { e.stopPropagation(); if (canVote) onVote(); }}>
            <button
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                hasVoted
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
              } ${!canVote ? "opacity-50 cursor-default" : "cursor-pointer"}`}
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <span className={`text-sm font-bold ${hasVoted ? "text-primary" : "text-muted-foreground"}`}>
              {p.vote_count}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-heading font-bold text-base">{p.title}</h3>
              <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
              <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={p.author_avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-secondary">{(p.author_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <span>{p.author_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{p.comment_count}</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Impacto: {IMPACT_LABELS[p.expected_impact]}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateProposalDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void;
}) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infraestrutura");
  const [impact, setImpact] = useState("medio");
  const [effort, setEffort] = useState("medio");
  const [audience, setAudience] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim() || !description.trim()) { toast.error("Preencha título e descrição."); return; }
    setSubmitting(true);

    const { error } = await supabase.from("proposals").insert({
      title: title.trim(),
      description: description.trim(),
      category,
      expected_impact: impact,
      estimated_effort: effort,
      target_audience: audience.trim() || null,
      author_id: user!.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      status: asDraft ? "draft" : "submitted",
    } as any);

    setSubmitting(false);
    if (error) { toast.error("Erro ao criar proposta."); return; }
    toast.success(asDraft ? "Rascunho salvo!" : "Proposta enviada! 🚀");
    setTitle(""); setDescription(""); setCategory("Infraestrutura"); setImpact("medio"); setEffort("medio"); setAudience("");
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
          <DialogDescription>Crie uma proposta para melhorar a escola.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Reforma da quadra esportiva" className="mt-1" />
          </div>
          <div>
            <Label>Descrição *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva sua proposta em detalhes..." className="mt-1 min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Impacto esperado</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Esforço estimado</Label>
              <Select value={effort} onValueChange={setEffort}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Público beneficiado</Label>
              <Input value={audience} onChange={e => setAudience(e.target.value)} placeholder="Ex: Todos os alunos" className="mt-1" />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting}>Salvar rascunho</Button>
          <Button onClick={() => handleSubmit(false)} disabled={submitting} className="gap-1.5">
            <Send className="w-4 h-4" /> Enviar proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProposalDetail({ proposalId, onBack, config, onVote, hasVoted }: {
  proposalId: string; onBack: () => void; config: any; onVote: (id: string) => void; hasVoted: boolean;
}) {
  const { user, profile, isAdmin } = useAuth();
  const [proposal, setProposal] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [internalComments, setInternalComments] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newInternal, setNewInternal] = useState("");
  const [newFeedback, setNewFeedback] = useState("");
  const [activeTab, setActiveTab] = useState("comments");
  const [loading, setLoading] = useState(true);

  // Invite collaborator
  const [showInvite, setShowInvite] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [inviteUserId, setInviteUserId] = useState("");

  const isAuthor = proposal?.author_id === user?.id;
  const isCollaborator = collaborators.some(c => c.user_id === user?.id && c.status === "accepted");

  const fetchAll = async () => {
    const [pRes, cRes, icRes, collRes, hRes, fRes] = await Promise.all([
      supabase.from("proposals").select("*").eq("id", proposalId).single(),
      supabase.from("proposal_comments").select("*").eq("proposal_id", proposalId).order("created_at"),
      supabase.from("proposal_internal_comments").select("*").eq("proposal_id", proposalId).order("created_at"),
      supabase.from("proposal_collaborators").select("*").eq("proposal_id", proposalId),
      supabase.from("proposal_history").select("*").eq("proposal_id", proposalId).order("created_at", { ascending: false }),
      supabase.from("proposal_direction_feedback").select("*").eq("proposal_id", proposalId).order("created_at"),
    ]);
    if (pRes.data) setProposal(pRes.data);
    if (cRes.data) setComments(cRes.data);
    if (icRes.data) setInternalComments(icRes.data);
    if (collRes.data) setCollaborators(collRes.data);
    if (hRes.data) setHistory(hRes.data);
    if (fRes.data) setFeedback(fRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [proposalId]);

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("proposal_comments").insert({
      proposal_id: proposalId,
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      content: newComment.trim(),
    } as any);
    setNewComment("");
    fetchAll();
  };

  const addInternalComment = async () => {
    if (!newInternal.trim() || !user) return;
    await supabase.from("proposal_internal_comments").insert({
      proposal_id: proposalId,
      author_id: user.id,
      author_name: profile?.full_name || "",
      author_avatar_url: profile?.avatar_url || null,
      content: newInternal.trim(),
    } as any);
    setNewInternal("");
    fetchAll();
  };

  const addDirectionFeedback = async () => {
    if (!newFeedback.trim() || !user) return;
    await supabase.from("proposal_direction_feedback").insert({
      proposal_id: proposalId,
      author_id: user.id,
      author_name: profile?.full_name || "Admin",
      content: newFeedback.trim(),
    } as any);
    setNewFeedback("");
    fetchAll();
  };

  const inviteCollaborator = async () => {
    if (!inviteUserId || !user) return;
    const invitedUser = allUsers.find(u => u.user_id === inviteUserId);
    await supabase.from("proposal_collaborators").insert({
      proposal_id: proposalId,
      user_id: inviteUserId,
      user_name: invitedUser?.full_name || "",
      user_avatar_url: invitedUser?.avatar_url || null,
      invited_by: user.id,
    } as any);
    toast.success("Convite enviado!");
    setInviteUserId("");
    setShowInvite(false);
    fetchAll();
  };

  const respondInvite = async (collabId: string, status: "accepted" | "rejected") => {
    await supabase.from("proposal_collaborators").update({ status } as any).eq("id", collabId);
    toast.success(status === "accepted" ? "Convite aceito!" : "Convite recusado.");
    fetchAll();
  };

  if (loading) return <div className="flex justify-center py-10"><div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  if (!proposal) return <p className="text-center text-muted-foreground py-10">Proposta não encontrada.</p>;

  const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.submitted;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 mb-4">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="outline">{proposal.category}</Badge>
          <Badge className={`${statusInfo.color} text-white text-[10px]`}>{statusInfo.label}</Badge>
          <Badge variant="secondary" className="text-[10px]">Impacto: {IMPACT_LABELS[proposal.expected_impact]}</Badge>
          <Badge variant="secondary" className="text-[10px]">Esforço: {EFFORT_LABELS[proposal.estimated_effort]}</Badge>
        </div>
        <h1 className="font-heading font-bold text-2xl mb-2">{proposal.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Avatar className="w-6 h-6">
              <AvatarImage src={proposal.author_avatar_url || undefined} />
              <AvatarFallback className="text-[8px] bg-secondary">{(proposal.author_name || "?")[0]}</AvatarFallback>
            </Avatar>
            <span>{proposal.author_name}</span>
          </div>
          {collaborators.filter(c => c.status === "accepted").length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>+{collaborators.filter(c => c.status === "accepted").length} colaboradores</span>
            </div>
          )}
          <span>{new Date(proposal.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <p className="text-foreground whitespace-pre-wrap">{proposal.description}</p>
        {proposal.target_audience && (
          <p className="text-sm text-muted-foreground mt-2">
            <strong>Público:</strong> {proposal.target_audience}
          </p>
        )}
      </div>

      {/* Vote bar */}
      <div className="flex items-center gap-4 p-3 rounded-xl bg-secondary mb-6">
        <Button
          variant={hasVoted ? "default" : "outline"}
          size="sm"
          onClick={() => onVote(proposalId)}
          disabled={config.current_phase !== "voting" && config.current_phase !== "discussion"}
          className="gap-1.5"
        >
          <ThumbsUp className="w-4 h-4" /> {hasVoted ? "Votado" : "Votar"}
        </Button>
        <span className="text-sm font-bold">{proposal.vote_count} votos</span>
        <span className="text-sm text-muted-foreground">{proposal.comment_count} comentários</span>

        {isAuthor && (
          <Button variant="ghost" size="sm" onClick={async () => {
            const users = await supabase.from("profiles").select("user_id, full_name, avatar_url");
            if (users.data) setAllUsers(users.data);
            setShowInvite(true);
          }} className="ml-auto gap-1 text-xs">
            <UserPlus className="w-3.5 h-3.5" /> Convidar
          </Button>
        )}
      </div>

      {/* Pending invite for current user */}
      {collaborators.filter(c => c.user_id === user?.id && c.status === "pending").map(c => (
        <Card key={c.id} className="mb-4 border-primary/30">
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-sm">Você foi convidado para colaborar nesta proposta!</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" onClick={() => respondInvite(c.id, "accepted")}>Aceitar</Button>
              <Button size="sm" variant="ghost" onClick={() => respondInvite(c.id, "rejected")}>Recusar</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="comments" className="flex-1 gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Comentários ({comments.length})
          </TabsTrigger>
          {(isAuthor || isCollaborator) && (
            <TabsTrigger value="internal" className="flex-1 gap-1">
              <Lock className="w-3.5 h-3.5" /> Interno ({internalComments.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex-1 gap-1">
            <History className="w-3.5 h-3.5" /> Histórico
          </TabsTrigger>
          {feedback.length > 0 && (
            <TabsTrigger value="feedback" className="flex-1 gap-1">
              📋 Direção ({feedback.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="comments" className="mt-4 space-y-3">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} />
          ))}
          <div className="flex gap-2 mt-3">
            <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicionar comentário..." onKeyDown={e => e.key === "Enter" && addComment()} />
            <Button onClick={addComment} size="sm"><Send className="w-4 h-4" /></Button>
          </div>
        </TabsContent>

        {(isAuthor || isCollaborator) && (
          <TabsContent value="internal" className="mt-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">💬 Discussão privada entre autor e colaboradores</p>
            {internalComments.map(c => (
              <CommentItem key={c.id} comment={c} />
            ))}
            <div className="flex gap-2 mt-3">
              <Input value={newInternal} onChange={e => setNewInternal(e.target.value)} placeholder="Mensagem interna..." onKeyDown={e => e.key === "Enter" && addInternalComment()} />
              <Button onClick={addInternalComment} size="sm"><Send className="w-4 h-4" /></Button>
            </div>
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sem alterações registradas.</p>
          ) : history.map(h => (
            <div key={h.id} className="p-2 rounded-lg bg-secondary/50 text-sm">
              <span className="font-medium">{h.edited_by_name}</span>
              <span className="text-muted-foreground"> · {new Date(h.created_at).toLocaleString("pt-BR")}</span>
              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(h.changes, null, 2)}</pre>
            </div>
          ))}
        </TabsContent>

        {feedback.length > 0 && (
          <TabsContent value="feedback" className="mt-4 space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">Direção</Badge>
                  <span className="text-sm font-medium">{f.author_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm">{f.content}</p>
              </div>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {/* Admin feedback input */}
      {isAdmin && (
        <div className="mt-4 p-3 rounded-xl bg-secondary/50 border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Feedback da Direção</p>
          <div className="flex gap-2">
            <Input value={newFeedback} onChange={e => setNewFeedback(e.target.value)} placeholder="Justificativa oficial..." />
            <Button onClick={addDirectionFeedback} size="sm">Enviar</Button>
          </div>
        </div>
      )}

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground mb-2">Colaboradores</p>
          <div className="flex flex-wrap gap-2">
            {collaborators.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-2.5 py-1">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={c.user_avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary/10">{(c.user_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{c.user_name}</span>
                <Badge variant="outline" className="text-[8px]">{c.status === "accepted" ? "✓" : c.status === "pending" ? "⏳" : "✗"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convidar Colaborador</DialogTitle>
            <DialogDescription>Selecione um líder para colaborar na proposta.</DialogDescription>
          </DialogHeader>
          <Select value={inviteUserId} onValueChange={setInviteUserId}>
            <SelectTrigger><SelectValue placeholder="Selecionar líder..." /></SelectTrigger>
            <SelectContent>
              {allUsers
                .filter(u => u.user_id !== user?.id && !collaborators.some(c => c.user_id === u.user_id))
                .map(u => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={inviteCollaborator} disabled={!inviteUserId}>Enviar convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentItem({ comment: c }: { comment: any }) {
  return (
    <div className="flex gap-2.5 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={c.author_avatar_url || undefined} />
        <AvatarFallback className="text-[8px] bg-secondary">{(c.author_name || "?")[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{c.author_name}</span>
          <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <p className="text-sm text-foreground">{c.content}</p>
      </div>
    </div>
  );
}
