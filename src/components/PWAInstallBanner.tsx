import { useEffect, useState } from "react";
import { X, Share, PlusSquare } from "lucide-react";

const DISMISS_KEY = "pwa-install-banner-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-ignore - iOS Safari
    window.navigator.standalone === true
  );
}

function getPlatform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    setPlatform(getPlatform());
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="lg:hidden">
      <div className="relative rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-3 shadow-sm animate-fade-in">
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-2 top-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/icons/icon-192.png"
            alt="Formando Líderes"
            className="shrink-0 w-9 h-9 rounded-lg shadow-sm"
          />

          <div className="flex-1 min-w-0 pr-6">
            <p className="font-heading text-sm font-semibold text-foreground leading-tight">
              Instale o app Formando Líderes
            </p>
            <p className="text-[11px] text-muted-foreground font-body leading-relaxed mt-0.5">
              Acesso rápido e notificações no seu celular.
            </p>
          </div>
        </div>

        {platform === "ios" && (
          <div className="mt-2.5 pt-2.5 border-t border-primary/10 flex items-start gap-2 text-[11px] text-foreground/80 font-body">
            <div className="shrink-0 mt-0.5 flex items-center gap-1 text-primary">
              <Share className="w-3 h-3" />
              <span className="text-[10px]">→</span>
              <PlusSquare className="w-3 h-3" />
            </div>
            <p className="leading-relaxed">
              Toque em <span className="font-semibold text-foreground">Compartilhar</span> na barra do Safari e depois em <span className="font-semibold text-foreground">Adicionar à Tela de Início</span>.
            </p>
          </div>
        )}

        {platform === "android" && (
          <div className="mt-2.5 pt-2.5 border-t border-primary/10 flex items-start gap-2 text-[11px] text-foreground/80 font-body">
            <div className="shrink-0 mt-0.5 text-primary">
              <PlusSquare className="w-3 h-3" />
            </div>
            <p className="leading-relaxed">
              Toque no <span className="font-semibold text-foreground">menu do navegador</span> (⋮) e selecione <span className="font-semibold text-foreground">Instalar app</span> ou <span className="font-semibold text-foreground">Adicionar à tela inicial</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
