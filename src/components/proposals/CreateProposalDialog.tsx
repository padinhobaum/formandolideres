import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, ImagePlus, X, Lightbulb } from "lucide-react";
import { cropImageToResolution } from "@/lib/imageUtils";

const CATEGORIES = [
  "Infraestrutura", "Eventos", "Ensino", "Convivência", "Tecnologia", "Esportes", "Cultura", "Outro",
];

interface CreateProposalDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}

export default function CreateProposalDialog({ open, onOpenChange, onCreated }: CreateProposalDialogProps) {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infraestrutura");
  const [impact, setImpact] = useState("medio");
  const [effort, setEffort] = useState("medio");
  const [audience, setAudience] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB)");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    // Crop/resize to 1920x1080 with smart center-crop (cover behavior)
    const processed = await cropImageToResolution(imageFile, 1920, 1080, 0.9);
    const ext = processed.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("proposal_images").upload(path, processed);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("proposal_images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha título e descrição.");
      return;
    }
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

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
      image_url: imageUrl,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error("Erro ao criar proposta.");
      return;
    }
    toast.success(asDraft ? "Rascunho salvo!" : "Proposta enviada! 🚀");
    resetForm();
    onCreated();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Infraestrutura");
    setImpact("medio");
    setEffort("medio");
    setAudience("");
    removeImage();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-heading">Nova Proposta</DialogTitle>
              <DialogDescription>Compartilhe sua ideia para melhorar a escola.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Título *</Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Reforma da quadra esportiva"
              className="mt-1.5 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Descrição *</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva sua proposta em detalhes..."
              className="mt-1.5 min-h-[100px] rounded-xl"
            />
          </div>

          {/* Image upload */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Imagem (opcional)</Label>
            {imagePreview ? (
              <div className="relative mt-1.5 rounded-xl overflow-hidden">
                <img src={imagePreview} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 bg-foreground/70 text-background rounded-full flex items-center justify-center hover:bg-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="mt-1.5 flex items-center justify-center gap-2 h-24 border-2 border-dashed border-muted-foreground/20 rounded-xl cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Adicionar imagem</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impacto esperado</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Esforço estimado</Label>
              <Select value={effort} onValueChange={setEffort}>
                <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Público beneficiado</Label>
              <Input
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="Ex: Todos os alunos"
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting} className="rounded-xl">
            Salvar rascunho
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={submitting} className="gap-1.5 rounded-xl">
            <Send className="w-4 h-4" /> Enviar proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
