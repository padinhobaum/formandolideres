import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Compass } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary via-[hsl(207,100%,22%)] to-accent flex items-center justify-center px-4 py-12">
      {/* Floating decorative blobs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl"
        style={{ animation: "float 8s ease-in-out infinite" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-primary-foreground/10 blur-3xl"
        style={{ animation: "float 10s ease-in-out infinite reverse" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground/5 blur-2xl"
        style={{ animation: "float 12s ease-in-out infinite" }}
        aria-hidden="true"
      />

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-xl rounded-3xl border border-primary-foreground/20 bg-primary-foreground/10 p-8 md:p-12 text-center shadow-2xl backdrop-blur-xl"
        style={{ animation: "fadeInScale 0.7s ease-out both" }}
      >
        {/* Logo */}
        <div
          className="flex justify-center mb-8"
          style={{ animation: "fadeInScale 0.8s ease-out 0.1s both" }}
        >
          <img
            src="/lovable-uploads/footer-logo.png"
            alt="Formando Líderes"
            className="h-14 md:h-16 w-auto brightness-0 invert"
          />
        </div>

        {/* 404 Number */}
        <div
          className="relative mb-6"
          style={{ animation: "fadeInScale 0.9s ease-out 0.2s both" }}
        >
          <h1 className="font-heading text-[8rem] md:text-[10rem] leading-none font-bold bg-gradient-to-br from-primary-foreground to-accent bg-clip-text text-transparent tracking-tight">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Compass
              className="h-24 w-24 md:h-32 md:w-32 text-primary-foreground/10"
              style={{ animation: "float 6s ease-in-out infinite" }}
            />
          </div>
        </div>

        {/* Text */}
        <div
          className="space-y-3 mb-8"
          style={{ animation: "fadeInScale 1s ease-out 0.3s both" }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-primary-foreground">
            Página não encontrada
          </h2>
          <p className="text-primary-foreground/80 text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Parece que você se perdeu no caminho. A página que procura não existe ou foi movida para outro lugar.
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
          style={{ animation: "fadeInScale 1.1s ease-out 0.4s both" }}
        >
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full font-semibold shadow-lg transition-transform hover:scale-105"
          >
            <Link to="/home">
              <Home className="h-4 w-4" />
              Voltar para a Home
            </Link>
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-full border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold transition-transform hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Página anterior
          </Button>
        </div>

        {/* Footer hint */}
        <p
          className="mt-8 text-xs text-primary-foreground/60"
          style={{ animation: "fadeInScale 1.2s ease-out 0.5s both" }}
        >
          Se acredita que isso é um erro, entre em contato com a equipe.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
