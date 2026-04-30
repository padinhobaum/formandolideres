import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  content: string;
  created_at: string;
}

const initials = (name: string) =>
  name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "U";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function NoticeComments({ noticeId }: { noticeId: string }) {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    const { data } = await (supabase as any)
      .from("notice_comments")
      .select("*")
      .eq("notice_id", noticeId)
      .order("created_at", { ascending: true });
    setComments((data || []) as Comment[]);
  };

  useEffect(() => {
    fetchComments();
  }, [noticeId]);

  const handlePost = async () => {
    if (!user) return;
    const text = content.trim();
    if (!text) return;
    setPosting(true);
    const { error } = await (supabase as any).from("notice_comments").insert({
      notice_id: noticeId,
      author_id: user.id,
      author_name: profile?.full_name || "Usuário",
      author_avatar_url: profile?.avatar_url || null,
      content: text,
    });
    setPosting(false);
    if (error) {
      toast.error("Erro ao publicar comentário");
      return;
    }
    setContent("");
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir comentário?")) return;
    const { error } = await (supabase as any).from("notice_comments").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    fetchComments();
  };

  const myAvatar = profile?.avatar_url || undefined;
  const myInitials = initials(profile?.full_name || "U");

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" strokeWidth={1.8} />
        <h2 className="font-heading font-bold text-lg text-foreground">
          Comentários {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
        </h2>
      </div>

      {/* Composer */}
      {user && (
        <div className="flex gap-3 mb-6">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={myAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{myInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 1000))}
              placeholder="Escreva um comentário..."
              rows={2}
              className="rounded-xl resize-none bg-background"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-muted-foreground">{content.length}/1000</span>
              <Button onClick={handlePost} disabled={posting || !content.trim()} size="sm" className="rounded-xl gap-1.5">
                {posting ? "Publicando..." : "Publicar"}
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Seja o primeiro a comentar.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const canDelete = user && (c.author_id === user.id || isAdmin);
            return (
              <li key={c.id} className="flex gap-3 group">
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarImage src={c.author_avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials(c.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-secondary/60 rounded-2xl px-4 py-2.5">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{c.author_name}</p>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-xs text-muted-foreground hover:text-destructive mt-1 ml-2 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
