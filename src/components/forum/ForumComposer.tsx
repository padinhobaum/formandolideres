import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserXp } from "@/hooks/useUserXp";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/RichTextEditor";
import { toast } from "sonner";
import { ImagePlus, BarChart3, MessageCircleQuestion, Megaphone, Trophy, Type, X, Plus, Trash2, Sparkles } from "lucide-react";
import { sendPushNotification } from "@/lib/sendPushNotification";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Compartilhe uma ideia",
  "Conte uma conquista",
  "Peça ajuda aos líderes",
  "Abra uma discussão",
];

const POST_TYPES = [
  { id: "text", label: "Texto", icon: Type, color: "text-slate-600" },
  { id: "image", label: "Imagem", icon: ImagePlus, color: "text-emerald-600" },
  { id: "poll", label: "Enquete", icon: BarChart3, color: "text-amber-600" },
  { id: "question", label: "Pergunta", icon: MessageCircleQuestion, color: "text-blue-600" },
  { id: "challenge", label: "Desafio", icon: Trophy, color: "text-purple-600" },
  { id: "announcement", label: "Anúncio", icon: Megaphone, color: "text-rose-600" },
] as const;

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface ForumComposerProps {
  categories: Category[];
  onCreated: () => void;
}

export default function ForumComposer({ categories, onCreated }: ForumComposerProps) {
  const { user, profile, isAdmin } = useAuth();
  const { awardXp } = useUserXp();

  const [open, setOpen] = useState(false);
  const [postType, setPostType] = useState<(typeof POST_TYPES)[number]["id"]>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [hint] = useState(() => SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]);

  const reset = () => {
    setPostType("text");
    setTitle("");
    setContent("");
    setImage(null);
    setPollOptions(["", ""]);
    setCategoryId("");
  };

  const openWith = (type: (typeof POST_TYPES)[number]["id"]) => {
    setPostType(type);
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    const path = `${user!.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("forum_images").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar imagem.");
      return null;
    }
    return supabase.storage.from("forum_images").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (image) imageUrl = await uploadImage(image);

    const { data: topic, error } = await supabase
      .from("forum_topics")
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        author_name: profile?.full_name || "",
        author_avatar_url: profile?.avatar_url || null,
        is_poll: postType === "poll",
        post_type: postType,
        image_url: imageUrl,
        category_id: categoryId || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Erro ao publicar.");
      setSubmitting(false);
      return;
    }

    if (postType === "poll" && topic) {
      const valid = pollOptions.filter((o) => o.trim());
      if (valid.length >= 2) {
        await supabase.from("poll_options").insert(
          valid.map((label, i) => ({
            topic_id: (topic as any).id,
            label: label.trim(),
            sort_order: i,
          })) as any
        );
      }
    }

    if (topic && !isAdmin) await awardXp("create_topic", (topic as any).id, 20);
    if (topic) {
      await sendPushNotification({
        title: "💬 Nova publicação no fórum",
        body: title.trim(),
        url: `/forum?topic=${(topic as any).id}`,
        contentType: "forum_topic",
        referenceId: (topic as any).id,
      });
    }

    toast.success("Publicado!");
    reset();
    setOpen(false);
    setSubmitting(false);
    onCreated();
  };

  return (
    <>
      <div className="bg-card border border-border rounded-3xl p-4 shadow-sm animate-fade-in">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 group"
        >
          <UserAvatar
            userId={user?.id || ""}
            name={profile?.full_name || ""}
            avatarUrl={profile?.avatar_url || null}
            className="w-11 h-11 flex-shrink-0 ring-2 ring-accent/40"
            fallbackClassName="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold"
          />
          <div className="flex-1 text-left bg-muted/60 group-hover:bg-muted transition-colors rounded-full px-5 py-3 text-sm text-muted-foreground font-medium">
            <span className="hidden sm:inline">No que você está pensando, </span>
            <span className="sm:hidden">Olá, </span>
            <span className="text-foreground font-semibold">
              {(profile?.full_name || "Líder").split(" ")[0]}
            </span>
            ?
          </div>
        </button>
        <p className="text-[11px] text-muted-foreground mt-2 pl-14 flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Sugestão: {hint}
        </p>
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 sm:grid-cols-6 gap-1">
          {POST_TYPES.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => openWith(pt.id)}
              className="flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 rounded-xl hover:bg-muted transition-colors group"
            >
              <pt.icon className={cn("w-4 h-4", pt.color)} />
              <span className="text-[11px] font-semibold text-foreground/80">{pt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              {(() => {
                const def = POST_TYPES.find((t) => t.id === postType)!;
                return (
                  <>
                    <def.icon className={cn("w-5 h-5", def.color)} />
                    <span>Nova publicação · {def.label}</span>
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {POST_TYPES.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => setPostType(pt.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-1 rounded-xl border-2 transition-all",
                    postType === pt.id
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  <pt.icon className={cn("w-4 h-4", pt.color)} />
                  <span className="text-[10px] font-bold">{pt.label}</span>
                </button>
              ))}
            </div>

            <div>
              <Label className="text-sm font-bold">Título</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Um título que chame atenção..."
                className="mt-1 rounded-xl"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-bold">Conteúdo</Label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Conte mais detalhes..." />
            </div>

            {categories.length > 0 && (
              <div>
                <Label className="text-sm font-bold">Categoria</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="mt-1 w-full border bg-background px-3 py-2 text-sm rounded-xl h-10"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-sm font-bold flex items-center gap-1">
                <ImagePlus className="w-4 h-4" /> Imagem (opcional)
              </Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="mt-1 rounded-xl"
              />
              {image && (
                <div className="mt-2 relative inline-block">
                  <img src={URL.createObjectURL(image)} alt="" className="max-h-40 rounded-xl" />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {postType === "poll" && (
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                <Label className="text-sm font-bold">Opções da enquete</Label>
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Opção ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...pollOptions];
                        updated[i] = e.target.value;
                        setPollOptions(updated);
                      }}
                      className="h-9 text-sm rounded-lg"
                    />
                    {i >= 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions([...pollOptions, ""])}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar opção
                  </button>
                )}
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full rounded-full font-bold">
              {submitting ? "Publicando..." : "Publicar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
