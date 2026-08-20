import { maintenanceConfig } from "@/config/maintenance";

export default function TemporaryRedirectPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <img
        src="/lovable-uploads/footer-logo.png"
        alt="Formando Líderes"
        className="h-24 w-auto mb-8 animate-scale-in"
      />
      <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-4">
        Perfil desativado temporariamente
      </h1>
      <p className="font-body text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
        O perfil do Liceu Jardim foi desativado temporariamente, para reativá-lo contate seu assessor pedagógico.
      </p>
    </div>
  );
}
