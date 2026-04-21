import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Check, X, MessageSquare, ChevronLeft, History, Lock, UserPlus, Trash2,
  Send, Users, Calendar, Target, Zap, Sparkles,
} from "lucide-react";
import { STATUS_LABELS, IMPACT_LABELS, CATEGORY_ICONS } from "./ProposalCard";

const EFFORT_LABELS: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

interface ProposalDetailProps {
  proposalId: string;
  onBack: () => void;
  config: any;
  onVote: (id: string, type: number) => void;
  myVoteType: number | null;
}

export default function ProposalDetail({ proposalId, onBack, config, onVote, myVoteType }: ProposalDetailProps) {
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
      proposal_id: proposalId, author_id: user.id,
      author_name: profile?.full_name || "", author_avatar_url: profile?.avatar_url || null,
      content: newComment.trim(),
    } as any);
    setNewComment("");
    fetchAll();
  };

  const addInternalComment = async () => {
    if (!newInternal.trim() || !user) return;
    await supabase.from("proposal_internal_comments").insert({
      proposal_id: proposalId, author_id: user.id,
      author_name: profile?.full_name || "", author_avatar_url: profile?.avatar_url || null,
      content: newInternal.trim(),
    } as any);
    setNewInternal("");
    fetchAll();
  };

  const addDirectionFeedback = async () => {
    if (!newFeedback.trim() || !user) return;
    await supabase.from("proposal_direction_feedback").insert({
      proposal_id: proposalId, author_id: user.id,
      author_name: profile?.full_name || "Admin", content: newFeedback.trim(),
    } as any);
    setNewFeedback("");
    fetchAll();
  };

  const inviteCollaborator = async () => {
    if (!inviteUserId || !user) return;
    const invitedUser = allUsers.find(u => u.user_id === inviteUserId);
    await supabase.from("proposal_collaborators").insert({
      proposal_id: proposalId, user_id: inviteUserId,
      user_name: invitedUser?.full_name || "", user_avatar_url: invitedUser?.avatar_url || null,
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

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 animate-fade-in">
        <div className="h-8 w-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-48 bg-muted rounded-2xl animate-pulse" />
        <div className="h-6 w-3/4 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Proposta não encontrada.</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">Voltar</Button>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.submitted;
  const canVote = config.current_phase === "voting" || config.current_phase === "discussion";
  const score = (proposal.positive_vote_count ?? 0) - (proposal.negative_vote_count ?? 0);

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 mb-4 rounded-xl hover:bg-secondary">
        <ChevronLeft className="w-4 h-4" /> Voltar
      </Button>

      {proposal.image_url && (
        <div className="w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-5 shadow-sm">
          <img src={proposal.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full px-2.5 py-1">
            {CATEGORY_ICONS[proposal.category] || "💡"} {proposal.category}
          </span>
          <span className={cn("text-[10px] font-semibold rounded-full px-2.5 py-1 border", statusInfo.className)}>
            {statusInfo.label}
          </span>
        </div>

        <h1 className="font-heading font-bold text-2xl sm:text-3xl mb-3 leading-tight">{proposal.title}</h1>

        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 ring-2 ring-background">
              <AvatarImage src={proposal.author_avatar_url || undefined} />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                {(proposal.author_name || "?")[0]}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{proposal.author_name}</span>
          </div>
          {collaborators.filter(c => c.status === "accepted").length > 0 && (
            <div className="flex items-center gap-1.5 bg-accent/10 text-accent rounded-full px-2.5 py-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                Co-autores: {collaborators.filter(c => c.status === "accepted").map(c => c.user_name).join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(proposal.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-3 py-1.5">
            <Target className="w-3.5 h-3.5 text-primary" />
            Impacto: {IMPACT_LABELS[proposal.expected_impact]}
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-3 py-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            Esforço: {EFFORT_LABELS[proposal.estimated_effort]}
          </div>
          {proposal.target_audience && (
            <div className="flex items-center gap-1.5 text-xs bg-secondary rounded-full px-3 py-1.5">
              <Users className="w-3.5 h-3.5" />
              {proposal.target_audience}
            </div>
          )}
        </div>

        <p className="text-foreground whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
      </div>

      {/* Vote bar */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary/60 mb-6 backdrop-blur-sm flex-wrap">
        <div className="flex items-center gap-1">
          <Button
            variant={myVoteType === 1 ? "default" : "outline"}
            size="sm"
            onClick={() => onVote(proposalId, 1)}
            disabled={!canVote}
            className={cn("gap-1.5 rounded-l-xl rounded-r-none transition-all", myVoteType === 1 && "shadow-md")}
          >
            <Check className="w-4 h-4" strokeWidth={3} /> {proposal.positive_vote_count ?? 0}
          </Button>
          <span className={cn(
            "px-3 py-2 text-sm font-bold border-y",
            score > 0 ? "text-primary" : score < 0 ? "text-destructive" : "text-muted-foreground"
          )}>
            {score > 0 ? `+${score}` : score}
          </span>
          <Button
            variant={myVoteType === -1 ? "destructive" : "outline"}
            size="sm"
            onClick={() => onVote(proposalId, -1)}
            disabled={!canVote}
            className={cn("gap-1.5 rounded-r-xl rounded-l-none transition-all", myVoteType === -1 && "shadow-md")}
          >
            <X className="w-4 h-4" strokeWidth={3} /> {proposal.negative_vote_count ?? 0}
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">{proposal.comment_count} comentários</span>

        {isAuthor && (
          <Button
            variant="ghost" size="sm"
            onClick={async () => {
              const users = await supabase.from("profiles").select("user_id, full_name, avatar_url");
              if (users.data) setAllUsers(users.data);
              setShowInvite(true);
            }}
            className="ml-auto gap-1 text-xs rounded-xl"
          >
            <UserPlus className="w-3.5 h-3.5" /> Convidar
          </Button>
        )}

        {(isAuthor || isAdmin) && (
          <Button
            variant="ghost" size="sm"
            onClick={async () => {
              if (!confirm("Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.")) return;
              const { error } = await supabase.from("proposals").delete().eq("id", proposalId);
              if (error) { toast.error("Erro ao excluir proposta."); return; }
              toast.success("Proposta excluída.");
              onBack();
            }}
            className={cn("gap-1 text-xs rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive", !isAuthor && "ml-auto")}
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </Button>
        )}
      </div>

      {/* Pending invite */}
      {collaborators.filter(c => c.user_id === user?.id && c.status === "pending").map(c => (
        <div key={c.id} className="mb-4 p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 flex items-center gap-3 animate-fade-in">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm flex-1">Você foi convidado para colaborar nesta proposta!</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => respondInvite(c.id, "accepted")} className="rounded-xl">Aceitar</Button>
            <Button size="sm" variant="ghost" onClick={() => respondInvite(c.id, "rejected")} className="rounded-xl">Recusar</Button>
          </div>
        </div>
      ))}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-xl bg-secondary/60 p-1">
          <TabsTrigger value="comments" className="flex-1 gap-1 rounded-lg text-xs">
            <MessageSquare className="w-3.5 h-3.5" /> Comentários ({comments.length})
          </TabsTrigger>
          {(isAuthor || isCollaborator) && (
            <TabsTrigger value="internal" className="flex-1 gap-1 rounded-lg text-xs">
              <Lock className="w-3.5 h-3.5" /> Interno ({internalComments.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex-1 gap-1 rounded-lg text-xs">
            <History className="w-3.5 h-3.5" /> Histórico
          </TabsTrigger>
          {feedback.length > 0 && (
            <TabsTrigger value="feedback" className="flex-1 gap-1 rounded-lg text-xs">
              📋 Direção ({feedback.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="comments" className="mt-4 space-y-2">
          {comments.map(c => <CommentItem key={c.id} comment={c} />)}
          <div className="flex gap-2 mt-3">
            <Input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Adicionar comentário..." onKeyDown={e => e.key === "Enter" && addComment()} className="rounded-xl" />
            <Button onClick={addComment} size="sm" className="rounded-xl"><Send className="w-4 h-4" /></Button>
          </div>
        </TabsContent>

        {(isAuthor || isCollaborator) && (
          <TabsContent value="internal" className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Discussão privada entre autor e colaboradores
            </p>
            {internalComments.map(c => <CommentItem key={c.id} comment={c} />)}
            <div className="flex gap-2 mt-3">
              <Input value={newInternal} onChange={e => setNewInternal(e.target.value)} placeholder="Mensagem interna..." onKeyDown={e => e.key === "Enter" && addInternalComment()} className="rounded-xl" />
              <Button onClick={addInternalComment} size="sm" className="rounded-xl"><Send className="w-4 h-4" /></Button>
            </div>
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem alterações registradas.</p>
          ) : history.map(h => (
            <div key={h.id} className="p-3 rounded-xl bg-secondary/50 text-sm">
              <span className="font-medium">{h.edited_by_name}</span>
              <span className="text-muted-foreground"> · {new Date(h.created_at).toLocaleString("pt-BR")}</span>
              <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{JSON.stringify(h.changes, null, 2)}</pre>
            </div>
          ))}
        </TabsContent>

        {feedback.length > 0 && (
          <TabsContent value="feedback" className="mt-4 space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="outline" className="text-[10px]">Direção</Badge>
                  <span className="text-sm font-medium">{f.author_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-sm leading-relaxed">{f.content}</p>
              </div>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {isAdmin && (
        <div className="mt-4 p-4 rounded-2xl bg-secondary/50 border">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Feedback da Direção</p>
          <div className="flex gap-2">
            <Input value={newFeedback} onChange={e => setNewFeedback(e.target.value)} placeholder="Justificativa oficial..." className="rounded-xl" />
            <Button onClick={addDirectionFeedback} size="sm" className="rounded-xl">Enviar</Button>
          </div>
        </div>
      )}

      {collaborators.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Colaboradores</p>
          <div className="flex flex-wrap gap-2">
            {collaborators.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5">
                <Avatar className="w-5 h-5">
                  <AvatarImage src={c.user_avatar_url || undefined} />
                  <AvatarFallback className="text-[8px] bg-primary/10">{(c.user_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{c.user_name}</span>
                <span className="text-[10px]">
                  {c.status === "accepted" ? "✓" : c.status === "pending" ? "⏳" : "✗"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Convidar Colaborador</DialogTitle>
            <DialogDescription>Selecione um líder para colaborar na proposta.</DialogDescription>
          </DialogHeader>
          <Select value={inviteUserId} onValueChange={setInviteUserId}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecionar líder..." /></SelectTrigger>
            <SelectContent>
              {allUsers
                .filter(u => u.user_id !== user?.id && !collaborators.some(c => c.user_id === u.user_id))
                .map(u => (
                  <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button onClick={inviteCollaborator} disabled={!inviteUserId} className="rounded-xl">Enviar convite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CommentItem({ comment: c }: { comment: any }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-secondary/30">
      <Avatar className="w-7 h-7 flex-shrink-0">
        <AvatarImage src={c.author_avatar_url || undefined} />
        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
          {(c.author_name || "?")[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium">{c.author_name}</span>
          <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
        </div>
        <p className="text-sm leading-relaxed">{c.content}</p>
      </div>
    </div>
  );
}
