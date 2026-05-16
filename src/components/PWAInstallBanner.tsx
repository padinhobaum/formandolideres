import { useEffect, useState } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "pwa-install-banner-dismissed-at";
const DISMISS_DAYS = 7;

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-ignore - iOS Safari
    window.navigator.standalone === true
  );
}

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="lg:hidden">
      <div className="relative flex items-center gap-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-3 shadow-sm animate-fade-in">
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

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
    </div>
  );
}
