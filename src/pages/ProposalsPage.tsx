import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEditalConfig } from "@/hooks/useEditalConfig";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, ArrowUp, Clock, Flame, Lock, RefreshCw } from "lucide-react";

import ProposalCard from "@/components/proposals/ProposalCard";
import ProposalDetail from "@/components/proposals/ProposalDetail";
import CreateProposalDialog from "@/components/proposals/CreateProposalDialog";
import ProposalSkeletons from "@/components/proposals/ProposalSkeletons";
import ProposalEmptyState from "@/components/proposals/ProposalEmptyState";

const PHASE_LABELS: Record<string, string> = {
  submission: "Submissão",
  discussion: "Discussão",
  voting: "Votação",
  selection: "Seleção",
  direction: "Encaminhamento",
};

const PHASE_COLORS: Record<string, string> = {
  submission: "bg-primary/10 text-primary border-primary/20",
  discussion: "bg-amber-100 text-amber-700 border-amber-200",
  voting: "bg-accent/10 text-accent border-accent/20",
  selection: "bg-violet-100 text-violet-700 border-violet-200",
  direction: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function ProposalsPage() {
  const { config, loading: configLoading, error: configError, refetch } = useEditalConfig();

  if (configLoading) {
    return (
      <AppLayout>
        <div className="w-full max-w-3xl mx-auto pt-4">
          <ProposalSkeletons />
        </div>
      </AppLayout>
    );
  }

  if (configError) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-destructive/50" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Erro ao carregar o edital</h2>
          <p className="text-muted-foreground text-sm mb-4">Tente novamente mais tarde.</p>
          <Button variant="outline" onClick={refetch} className="gap-1.5 rounded-xl">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!config?.is_active) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">Edital Inativo</h2>
          <p className="text-muted-foreground text-sm">O Edital de Propostas não está aberto no momento.</p>
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
  const { user } = useAuth();
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

  useEffect(() => {
    fetchProposals();
    fetchMyVotes();
  }, [sortBy]);

  useEffect(() => {
    const channel = supabase
      .channel(`proposals-feed-${Date.now()}`)
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
    return (
      <ProposalDetail
        proposalId={selectedProposal}
        onBack={() => setSelectedProposal(null)}
        config={config}
        onVote={handleVote}
        hasVoted={myVotes.has(selectedProposal)}
      />
    );
  }

  const canCreate = config.current_phase === "submission" || config.current_phase === "discussion";
  const phaseColor = PHASE_COLORS[config.current_phase] || "";

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <img src="/lovable-uploads/edital-logo.png" alt="Edital de Propostas" className="h-14 sm:h-16 object-contain" />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs rounded-full px-3 py-1 border ${phaseColor}`}>
              {PHASE_LABELS[config.current_phase]}
            </Badge>
            <span className="text-xs text-muted-foreground bg-secondary rounded-full px-3 py-1">
              🗳️ {totalVotesUsed}/{config.max_votes_per_user} votos usados
            </span>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreate(true)} className="gap-1.5 rounded-xl shadow-md">
              <Plus className="w-4 h-4" /> Nova Proposta
            </Button>
          )}
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-1.5 mb-5 bg-secondary/50 rounded-xl p-1">
        {([
          { key: "votes" as const, icon: ArrowUp, label: "Mais votadas" },
          { key: "recent" as const, icon: Clock, label: "Recentes" },
          { key: "trending" as const, icon: Flame, label: "Em destaque" },
        ]).map(s => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg transition-all ${
              sortBy === s.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {/* Proposals list */}
      {loading ? (
        <ProposalSkeletons />
      ) : proposals.length === 0 ? (
        <ProposalEmptyState onCreateClick={() => setShowCreate(true)} canCreate={canCreate} />
      ) : (
        <div className="space-y-4">
          {proposals.map((p, i) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              hasVoted={myVotes.has(p.id)}
              onVote={() => handleVote(p.id)}
              onClick={() => setSelectedProposal(p.id)}
              canVote={config.current_phase === "voting" || config.current_phase === "discussion"}
              rank={sortBy === "votes" ? i : undefined}
            />
          ))}
        </div>
      )}

      <CreateProposalDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => { fetchProposals(); setShowCreate(false); }}
      />
    </div>
  );
}
