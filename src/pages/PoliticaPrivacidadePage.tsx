import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3">
            <img
              src="/lovable-uploads/footer-logo.png"
              alt="Formando Líderes"
              className="h-10 w-auto"
            />
          </Link>
          <Link to="/login">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p className="italic">Conteúdo em elaboração.</p>
        </div>
      </main>

      <footer className="border-t bg-card py-6">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Formando Líderes – Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
