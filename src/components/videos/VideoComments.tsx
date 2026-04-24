import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Reply, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  parent_id: string | null;
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

export default function VideoComments({ lessonId }: { lessonId: string }) {
  const { user, profile, isAdmin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("video_comments")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: true });
    setComments((data || []) as Comment[]);
  };

  useEffect(() => {
    fetchComments();
  }, [lessonId]);

  const handlePost = async (parentId: string | null = null, text?: string) => {
    if (!user) return;
    const finalText = (text ?? (parentId ? replyContent : content)).trim();
    if (!finalText) return;
    setPosting(true);
    const { error } = await supabase.from("video_comments").insert({
      lesson_id: lessonId,
      parent_id: parentId,
      author_id: user.id,
      author_name: profile?.full_name || "Usuário",
      author_avatar_url: profile?.avatar_url || null,
      content: finalText,
    } as any);
    setPosting(false);
    if (error) {
      toast.error("Erro ao publicar comentário");
      return;
    }
    if (parentId) {
      setReplyContent("");
      setReplyingTo(null);
    } else {
      setContent("");
    }
    fetchComments();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir comentário?")) return;
    const { error } = await supabase.from("video_comments").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    fetchComments();
  };

  const roots = comments.filter((c) => !c.parent_id);
  const repliesByParent: Record<string, Comment[]> = {};
  comments.filter((c) => c.parent_id).forEach((c) => {
    if (!repliesByParent[c.parent_id!]) repliesByParent[c.parent_id!] = [];
    repliesByParent[c.parent_id!].push(c);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-base">Comentários ({comments.length})</h3>
      </div>

      {/* Composer */}
      {user && (
        <div className="flex gap-3 mb-5">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xs bg-secondary text-secondary-foreground font-bold">
              {initials(profile?.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Compartilhe o que achou da aula..."
              rows={2}
              className="resize-none rounded-xl"
            />
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={() => handlePost()}
                disabled={posting || !content.trim()}
                className="rounded-full gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Publicar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {roots.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Seja o primeiro a comentar 💬
        </p>
      ) : (
        <div className="space-y-4">
          {roots.map((c) => (
            <div key={c.id}>
              <CommentBubble
                c={c}
                canDelete={user?.id === c.author_id || isAdmin}
                onDelete={handleDelete}
                onReply={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
              />

              {/* Replies */}
              {repliesByParent[c.id]?.length > 0 && (
                <div className="ml-12 mt-3 space-y-3 border-l-2 border-primary/15 pl-4">
                  {repliesByParent[c.id].map((r) => (
                    <CommentBubble
                      key={r.id}
                      c={r}
                      canDelete={user?.id === r.author_id || isAdmin}
                      onDelete={handleDelete}
                      onReply={null}
                    />
                  ))}
                </div>
              )}

              {/* Reply composer */}
              {replyingTo === c.id && user && (
                <div className="ml-12 mt-3 flex gap-2 border-l-2 border-primary/15 pl-4">
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-bold">
                      {initials(profile?.full_name || "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Respondendo a ${c.author_name}...`}
                      rows={2}
                      className="resize-none rounded-xl text-sm"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="h-7 text-xs">
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePost(c.id)}
                        disabled={posting || !replyContent.trim()}
                        className="h-7 text-xs rounded-full"
                      >
                        Responder
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentBubble({
  c,
  canDelete,
  onDelete,
  onReply,
}: {
  c: Comment;
  canDelete: boolean;
  onDelete: (id: string) => void;
  onReply: (() => void) | null;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={c.author_avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground font-bold">
          {initials(c.author_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="font-bold text-xs text-foreground">{c.author_name}</p>
            <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{c.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 ml-2">
          {onReply && (
            <button onClick={onReply} className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              <Reply className="w-3 h-3" /> Responder
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(c.id)} className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors inline-flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
