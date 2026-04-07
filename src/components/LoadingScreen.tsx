import { useEffect, useState } from "react";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 800);
    const remove = setTimeout(() => setVisible(false), 1200);
    return () => { clearTimeout(timer); clearTimeout(remove); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary via-[hsl(207,100%,22%)] to-accent transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <img
        src="/lovable-uploads/footer-logo.png"
        alt="Formando Líderes"
        className="h-16 md:h-20 w-auto mb-8 animate-[fadeInScale_0.6s_ease-out_both] brightness-0 invert"
      />

      {/* Loading bar */}
      <div className="w-48 h-1 rounded-full bg-primary-foreground/20 overflow-hidden">
        <div className="h-full bg-primary-foreground rounded-full animate-[loadBar_1s_ease-in-out_infinite]" />
      </div>

      <p className="mt-4 text-primary-foreground/70 text-sm font-body animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
