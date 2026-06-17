import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SaveButtonProps {
  topicId: string;
  className?: string;
}

export default function SaveButton({ topicId, className }: SaveButtonProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("topic_saves")
      .select("id")
      .eq("topic_id", topicId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => setSaved(!!data));
  }, [topicId, user?.id]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (saved) {
      setSaved(false);
      await (supabase as any).from("topic_saves").delete().eq("topic_id", topicId).eq("user_id", user.id);
      toast.success("Removido dos salvos");
    } else {
      setSaved(true);
      await (supabase as any).from("topic_saves").insert({ topic_id: topicId, user_id: user.id });
      toast.success("Salvo para ler depois");
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={saved ? "Remover dos salvos" : "Salvar"}
      className={cn(
        "p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-accent",
        saved && "text-accent",
        className
      )}
    >
      <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
    </button>
  );
}
