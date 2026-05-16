import { useEffect, useState } from "react";
import { Download, X, Zap, Bell, Smartphone, Share, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const DISMISS_KEY = "pwa-install-banner-dismissed-at";
const DISMISS_DAYS = 7;

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-ignore - iOS Safari
    window.navigator.standalone === true
  );
}

function detectPlatform(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function PWAInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [platform] = useState(detectPlatform());

  useEffect(() => {
    if (isStandalone()) return;

    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    setVisible(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => setVisible(false);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setVisible(false);
        setDeferred(null);
      } catch {
        setShowInstructions(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-accent/10 dark:from-primary/10 dark:via-background dark:to-accent/15 p-4 shadow-sm animate-fade-in">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />

        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="relative flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 ring-2 ring-accent/40">
            <Download className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-heading text-sm font-semibold text-foreground">
                Instale o app Formando Líderes
              </p>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground border border-accent/30">
                Novo
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-body leading-relaxed">
              Acesso rápido, notificações e experiência como app nativo.
            </p>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/90 font-body">
              <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 text-accent" />Rápido</span>
              <span className="inline-flex items-center gap-1"><Bell className="w-3 h-3 text-accent" />Notificações</span>
              <span className="inline-flex items-center gap-1"><Smartphone className="w-3 h-3 text-accent" />Offline</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 transition-all hover:shadow-md hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar App
              </Button>
              <button
                onClick={dismiss}
                className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Como instalar o app</DialogTitle>
            <DialogDescription>
              Siga as instruções abaixo para o seu dispositivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {platform === "ios" && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-body">
                <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                  <Share className="w-4 h-4 text-primary" /> iPhone / iPad (Safari)
                </div>
                <p className="text-muted-foreground">
                  Toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.
                </p>
              </div>
            )}
            {platform === "android" && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-body">
                <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                  <MoreVertical className="w-4 h-4 text-primary" /> Android (Chrome)
                </div>
                <p className="text-muted-foreground">
                  Toque no <b>menu do navegador</b> e selecione <b>Instalar aplicativo</b>.
                </p>
              </div>
            )}
            {platform === "desktop" && (
              <>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-body">
                  <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                    <Download className="w-4 h-4 text-primary" /> Desktop (Chrome / Edge)
                  </div>
                  <p className="text-muted-foreground">
                    Clique no ícone de <b>instalar</b> na barra de endereço, ou no menu do navegador, em <b>Instalar Formando Líderes</b>.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-body">
                  <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                    <Share className="w-4 h-4 text-primary" /> iPhone / iPad
                  </div>
                  <p className="text-muted-foreground">
                    No Safari, toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm font-body">
                  <div className="flex items-center gap-2 mb-1 font-semibold text-foreground">
                    <MoreVertical className="w-4 h-4 text-primary" /> Android
                  </div>
                  <p className="text-muted-foreground">
                    No Chrome, toque no <b>menu</b> e em <b>Instalar aplicativo</b>.
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
