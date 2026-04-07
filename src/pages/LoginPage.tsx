import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, resetPassword, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [showPassword, setShowPassword] = useState(false);

  if (session) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
    } else {
      navigate("/dashboard");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar e-mail de recuperação.");
    } else {
      toast.success("E-mail de recuperação enviado. Verifique sua caixa de entrada.");
      setMode("login");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-[hsl(207,100%,22%)] to-accent relative overflow-hidden flex-col items-center justify-center p-12">
        {/* Decorative circles */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-primary-foreground/5" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[60%] aspect-square rounded-full bg-primary-foreground/5" />
        <div className="absolute top-[40%] left-[10%] w-20 h-20 rounded-full bg-accent/30 animate-pulse" />

        <div className="relative z-10 text-center max-w-md">
          <img
            src="/lovable-uploads/footer-logo.png"
            alt="Formando Líderes"
            className="h-20 w-auto mx-auto mb-8 brightness-0 invert"
          />
          <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-4">
            Portal do Líder
          </h1>
          <p className="text-primary-foreground/80 text-lg font-body leading-relaxed">
            Acesse o portal para gerenciar sua turma, acompanhar avisos e participar do fórum de líderes.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {["Fórum", "Videoaulas", "Avisos", "LíderAI"].map((f) => (
              <span
                key={f}
                className="px-4 py-1.5 rounded-full bg-primary-foreground/10 text-primary-foreground/90 text-sm font-body border border-primary-foreground/10"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              alt="Formando Líderes"
              className="h-14 w-auto"
              src="/lovable-uploads/d52473b9-ea3a-4883-9166-d1045f638583.png"
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {mode === "login" ? "Bem-vindo de volta!" : "Recuperar senha"}
            </h2>
            <p className="text-muted-foreground mt-1 font-body">
              {mode === "login"
                ? "Acesse o Portal do Líder"
                : "Enviaremos um link para redefinir sua senha"}
            </p>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-body font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-body font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-sm text-primary hover:underline font-body"
                >
                  Esqueceu a senha?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-body"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email" className="text-sm font-body font-medium">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 gap-2 text-base font-body"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-primary hover:underline font-body mt-2"
              >
                ← Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
