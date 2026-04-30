import { useRef, useState } from "react";
import { Bold, Italic, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  /** Storage bucket to upload inline images to. Defaults to "notices". */
  imageBucket?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  minHeight = "100px",
  imageBucket = "notices",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    if (selected) {
      const newValue = before + prefix + selected + suffix + after;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      const newValue = before + prefix + suffix + after;
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }, 0);
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const newValue = before + text + after;
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      const pos = start + text.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `inline/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(imageBucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from(imageBucket).getPublicUrl(path);
      const url = urlData.publicUrl;
      // Insert markdown-like image token, with surrounding newlines for clean layout
      const token = `\n\n![imagem](${url})\n\n`;
      insertAtCursor(token);
      toast.success("Imagem adicionada ao texto.");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + (err?.message || "tente novamente."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden bg-background">
      <div className="flex items-center gap-1 px-2 py-1 border-b bg-muted/30">
        <button
          type="button"
          onClick={() => wrapSelection("**", "**")}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Negrito"
        >
          <Bold className="w-4 h-4" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => wrapSelection("*", "*")}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Itálico"
        >
          <Italic className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1 text-xs"
          title="Inserir imagem entre o texto"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" strokeWidth={2} />}
          <span className="hidden sm:inline">Imagem</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm font-body resize-y bg-background outline-none ${className}`}
        style={{ minHeight }}
      />
    </div>
  );
}

/**
 * Render rich text supporting:
 * - **bold**
 * - *italic*
 * - ![alt](url) inline images (rendered as block images between paragraphs)
 * - line breaks preserved via whitespace-pre-wrap on text segments
 */
export function RichText({ content, className = "" }: { content: string; className?: string }) {
  // Split content into image blocks and text blocks
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const blocks: Array<{ type: "text" | "image"; value: string; alt?: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    blocks.push({ type: "image", value: match[2], alt: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    blocks.push({ type: "text", value: content.slice(lastIndex) });
  }

  const renderInline = (text: string, keyPrefix: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={`${keyPrefix}-${i}`}>{part.slice(1, -1)}</em>;
      }
      return <span key={`${keyPrefix}-${i}`}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.type === "image") {
          return (
            <img
              key={`img-${i}`}
              src={b.value}
              alt={b.alt || ""}
              loading="lazy"
              className="my-4 w-full max-h-[600px] object-contain rounded-xl border border-border bg-muted"
            />
          );
        }
        // Trim only leading/trailing newlines that were added around images, but preserve interior breaks
        const trimmed = b.value.replace(/^\n+|\n+$/g, "");
        if (!trimmed) return null;
        return (
          <div key={`txt-${i}`} className="whitespace-pre-wrap">
            {renderInline(trimmed, `t${i}`)}
          </div>
        );
      })}
    </div>
  );
}
