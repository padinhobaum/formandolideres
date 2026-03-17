import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles } from "lucide-react";

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  newLevel: number;
}

export default function LevelUpModal({ open, onClose, newLevel }: LevelUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm text-center space-y-4">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center animate-scale-in">
              <Trophy className="w-10 h-10 text-accent" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-accent animate-fade-in" />
            <Star className="absolute -bottom-1 -left-2 w-5 h-5 text-accent animate-fade-in" />
          </div>
        </div>
        <div className="space-y-2 animate-fade-in">
          <h2 className="font-heading font-bold text-2xl text-accent">Parabéns!</h2>
          <p className="text-muted-foreground font-body">Você subiu de nível!</p>
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-heading font-bold text-3xl rounded-full px-6 py-2">
            <Star className="w-6 h-6 fill-current" />
            Nível {newLevel}
          </div>
          <p className="text-sm text-muted-foreground">Continue participando para evoluir ainda mais!</p>
        </div>
        <Button onClick={onClose} className="w-full">Continuar</Button>
      </DialogContent>
    </Dialog>
  );
}
