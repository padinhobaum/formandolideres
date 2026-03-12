import { useRef } from "react";
import { Bold, Italic } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className = "", minHeight = "100px" }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

/** Render rich text with bold/italic */
export function RichText({ content, className = "" }: { content: string; className?: string }) {
  // Parse **bold** and *italic*
  const parts = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
