import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoImg from "@/assets/logo-formando-lideres.png";

export default function LoginPage() {
  const { signIn, resetPassword, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "reset">("login");

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-sidebar-border">
      <div className="w-full max-w-sm">
        <div className="border bg-card p-8 shadow-sm px-[32px] rounded-xl">
          <div className="flex justify-center mb-6">
            <img alt="Formando Líderes" className="h-14 w-auto" src="/lovable-uploads/d52473b9-ea3a-4883-9166-d1045f638583.png" />
          </div>
          <p className="mb-8 text-center text-xl text-muted-foreground">
            {mode === "login" ? "Acesse o Portal do Líder" : "Recuperar senha"}
          </p>

          {mode === "login" ?
          <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-body">E-mail</Label>
                <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="seu@email.com" />
              
              </div>
              <div>
                <Label htmlFor="password" className="text-sm font-body">Senha</Label>
                <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••" />
              
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
              





            
            </form> :

          <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="reset-email" className="text-sm font-body">E-mail</Label>
                <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                placeholder="seu@email.com" />
              
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
              <button
              type="button"
              onClick={() => setMode("login")}
              className="w-full text-sm text-primary hover:underline mt-2">
              
                Voltar ao login
              </button>
            </form>
          }
        </div>
      </div>
    </div>);

}