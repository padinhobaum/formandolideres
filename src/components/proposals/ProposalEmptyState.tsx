import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";

interface ProposalEmptyStateProps {
  onCreateClick?: () => void;
  canCreate: boolean;
}

export default function ProposalEmptyState({ onCreateClick, canCreate }: ProposalEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Lightbulb className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-heading font-bold text-xl mb-2">Nenhuma proposta ainda</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-5 leading-relaxed">
        Que tal enviar a primeira? Compartilhe suas ideias para melhorar a escola!
      </p>
      {canCreate && onCreateClick && (
        <Button onClick={onCreateClick} className="gap-1.5 rounded-xl shadow-md">
          <Plus className="w-4 h-4" /> Criar proposta
        </Button>
      )}
    </div>
  );
}
