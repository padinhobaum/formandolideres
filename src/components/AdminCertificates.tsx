import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Award, Plus, Trash2, FileDown, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Signature {
  name: string;
  role: string;
}

interface Certificate {
  id: string;
  user_id: string;
  title: string;
  body_text: string;
  signatures: Signature[];
  issued_date: string;
  verification_code: string;
  created_at: string;
}

export default function AdminCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [title, setTitle] = useState("Certificado de Participação");
  const [bodyText, setBodyText] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [signatures, setSignatures] = useState<Signature[]>([
    { name: "Arthur Scudeiro", role: "Fundador Formando Líderes" },
  ]);
  const [creating, setCreating] = useState(false);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);

  const fetchCertificates = async () => {
    const { data } = await supabase.from("certificates").select("*").order("created_at", { ascending: false });
    if (data) setCertificates(data as any);
  };

  useEffect(() => {
    fetchCertificates();
    supabase.from("profiles").select("user_id, full_name, avatar_url").then(({ data }) => {
      if (data) setUsers(data);
    });
  }, []);

  const getUserName = (userId: string) => users.find((u) => u.user_id === userId)?.full_name || "Usuário";
  const getUserAvatar = (userId: string) => users.find((u) => u.user_id === userId)?.avatar_url;

  const addSignature = () => setSignatures([...signatures, { name: "", role: "" }]);
  const removeSignature = (i: number) => setSignatures(signatures.filter((_, idx) => idx !== i));
  const updateSignature = (i: number, field: keyof Signature, value: string) => {
    const updated = [...signatures];
    updated[i][field] = value;
    setSignatures(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !bodyText.trim() || !title.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setCreating(true);
    const validSigs = signatures.filter((s) => s.name.trim());
    const { error } = await supabase.from("certificates").insert({
      user_id: selectedUserId,
      title: title.trim(),
      body_text: bodyText.trim(),
      signatures: validSigs,
      created_by: user!.id,
    } as any);
    setCreating(false);
    if (error) { toast.error("Erro ao criar certificado."); return; }
    toast.success("Certificado criado com sucesso!");
    setBodyText("");
    setSelectedUserId("");
    fetchCertificates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("certificates").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Certificado excluído.");
    fetchCertificates();
  };

  const generatePdf = (cert: Certificate) => {
    const userName = getUserName(cert.user_id);
    const verifyUrl = `${window.location.origin}/verificar/${cert.verification_code}`;
    const issuedDate = new Date(cert.issued_date + "T12:00:00");
    const months = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    const dateStr = `Santo André, ${issuedDate.getDate()} de ${months[issuedDate.getMonth()]} de ${issuedDate.getFullYear()}`;

    const sigsHtml = (cert.signatures as Signature[]).map((s) => `
      <div style="text-align:center;min-width:180px;">
        <div style="border-top:2px solid #003d7a;width:200px;margin:0 auto 6px;"></div>
        <p style="font-size:14px;font-weight:700;color:#003d7a;margin:0;">${s.name}</p>
        <p style="font-size:11px;color:#64748b;margin:2px 0 0;">${s.role}</p>
      </div>
    `).join("");

    const html = `<html>
<head>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Ubuntu',sans-serif; }
    @page { size:A4 landscape; margin:0; }
    @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
  <div style="width:297mm;height:210mm;position:relative;background:#fff;border:12px solid #003d7a;padding:40px 50px;display:flex;flex-direction:column;justify-content:space-between;">
    <!-- Decorative corners -->
    <div style="position:absolute;top:20px;left:20px;width:60px;height:60px;border-top:4px solid #d4a843;border-left:4px solid #d4a843;"></div>
    <div style="position:absolute;top:20px;right:20px;width:60px;height:60px;border-top:4px solid #d4a843;border-right:4px solid #d4a843;"></div>
    <div style="position:absolute;bottom:20px;left:20px;width:60px;height:60px;border-bottom:4px solid #d4a843;border-left:4px solid #d4a843;"></div>
    <div style="position:absolute;bottom:20px;right:20px;width:60px;height:60px;border-bottom:4px solid #d4a843;border-right:4px solid #d4a843;"></div>

    <!-- Header -->
    <div style="text-align:center;">
      <img src="${window.location.origin}/lovable-uploads/footer-logo.png" alt="Formando Líderes" style="height:56px;margin-bottom:12px;" crossorigin="anonymous" />
      <h1 style="font-size:36px;font-weight:700;color:#003d7a;letter-spacing:3px;text-transform:uppercase;">${cert.title}</h1>
      <div style="width:80px;height:3px;background:#d4a843;margin:12px auto;"></div>
    </div>

    <!-- Body -->
    <div style="text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;padding:20px 40px;">
      <p style="font-size:16px;color:#64748b;margin-bottom:8px;">Conferido a</p>
      <p style="font-size:32px;font-weight:700;color:#003d7a;margin-bottom:16px;border-bottom:2px solid #d4a843;display:inline-block;padding-bottom:4px;margin-left:auto;margin-right:auto;">${userName}</p>
      <p style="font-size:15px;color:#334155;line-height:1.8;max-width:600px;margin:0 auto;">${cert.body_text}</p>
    </div>

    <!-- Date + Signatures -->
    <div>
      <p style="text-align:center;font-size:13px;color:#64748b;margin-bottom:24px;">${dateStr}</p>
      <div style="display:flex;justify-content:center;gap:60px;flex-wrap:wrap;">
        ${sigsHtml}
      </div>
    </div>

    <!-- QR Code + Verification -->
    <div style="position:absolute;bottom:30px;right:40px;text-align:center;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}" alt="QR Code" style="width:70px;height:70px;" crossorigin="anonymous" />
      <p style="font-size:8px;color:#94a3b8;margin-top:2px;">${cert.verification_code}</p>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Permita pop-ups para gerar o PDF."); return; }
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 800);
    toast.success("Use 'Salvar como PDF' na janela de impressão.");
  };

  return (
    <div>
      <Card className="mb-6 border-dashed border-primary/20 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-heading font-bold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" strokeWidth={1.5} />
            Novo Certificado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label className="text-sm">Título do Certificado</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm">Destinatário</Label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="mt-1 w-full border bg-background px-3 py-2 text-sm font-body rounded h-10"
                required
              >
                <option value="">Selecione um usuário</option>
                {users.map((u) => (
                  <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm">Texto do Certificado</Label>
              <Textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="Ex: pela participação no Programa Formando Líderes..."
                className="mt-1"
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Assinaturas</Label>
              {signatures.map((sig, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Nome" value={sig.name} onChange={(e) => updateSignature(i, "name", e.target.value)} className="flex-1 h-8 text-xs" />
                  <Input placeholder="Cargo" value={sig.role} onChange={(e) => updateSignature(i, "role", e.target.value)} className="flex-1 h-8 text-xs" />
                  {signatures.length > 1 && (
                    <button type="button" onClick={() => removeSignature(i)} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSignature} className="text-xs text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Adicionar assinatura
              </button>
            </div>
            <Button type="submit" size="sm" disabled={creating} className="gap-1.5">
              <Plus className="w-4 h-4" />
              {creating ? "Criando..." : "Criar Certificado"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {certificates.map((cert) => (
          <Card key={cert.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarImage src={getUserAvatar(cert.user_id) || undefined} />
                    <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">
                      {getUserName(cert.user_id).split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-heading font-semibold">{cert.title}</p>
                    <p className="text-xs text-muted-foreground">{getUserName(cert.user_id)} · {new Date(cert.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="outline" className="text-[10px] px-1.5">{cert.verification_code}</Badge>
                  <button onClick={() => setPreviewCert(cert)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => generatePdf(cert)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cert.id)} className="text-destructive hover:text-destructive/80 p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {certificates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum certificado criado ainda.</p>
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewCert} onOpenChange={(open) => !open && setPreviewCert(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Preview do Certificado</DialogTitle>
          </DialogHeader>
          {previewCert && (
            <div className="border rounded-xl p-6 bg-gradient-to-br from-primary/5 to-accent/5 text-center space-y-3">
              <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-10 mx-auto" />
              <h3 className="font-heading font-bold text-xl text-primary">{previewCert.title}</h3>
              <div className="w-12 h-0.5 bg-accent mx-auto" />
              <p className="text-xs text-muted-foreground">Conferido a</p>
              <p className="font-heading font-bold text-lg text-primary">{getUserName(previewCert.user_id)}</p>
              <p className="text-sm text-foreground">{previewCert.body_text}</p>
              <div className="flex justify-center gap-8 pt-4">
                {(previewCert.signatures as Signature[]).map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-32 border-t-2 border-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-primary">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.role}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground pt-2">Código: {previewCert.verification_code}</p>
              <Button size="sm" onClick={() => generatePdf(previewCert)} className="gap-1.5 mt-2">
                <FileDown className="w-4 h-4" /> Gerar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
