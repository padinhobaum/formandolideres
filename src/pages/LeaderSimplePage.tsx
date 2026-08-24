import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ClassClimateCard from "@/components/ClassClimateCard";
import { ClipboardList, LogOut } from "lucide-react";
import logoFl from "@/assets/logo-fl.png.asset.json";
import bornToLead from "@/assets/born-to-lead.png.asset.json";

export default function LeaderSimplePage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [hasResults, setHasResults] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("survey_leaders")
      .select("survey_id, surveys(results_released)")
      .eq("leader_user_id", user.id)
      .then(({ data }) => {
        setHasResults((data || []).some((sl: any) => sl.surveys?.results_released));
      });
  }, [user]);

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div style={{ paddingTop: "env(safe-area-inset-top)" }} />
        <div className="px-6 py-5 flex justify-center">
          <img src={logoFl.url} alt="Formando Líderes" className="h-14 sm:h-16 w-auto" />
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-10 pb-10 space-y-8">
        <section className="flex flex-row items-center justify-center gap-4 sm:gap-6 sm:justify-start text-left">
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 ring-4 ring-primary/10">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-xl font-body font-semibold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-xl sm:text-3xl leading-tight text-primary">
              {profile?.full_name}
            </h1>
            {profile?.class_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Líder da sala <span className="font-semibold text-foreground">{profile.class_name}</span>
              </p>
            )}
          </div>
        </section>

        <ClassClimateCard />

        {hasResults && (
          <Button
            onClick={() => navigate("/meus-resultados")}
            className="w-full h-12 text-base"
          >
            <ClipboardList className="w-5 h-5 mr-2" />
            Ver meus resultados
          </Button>
        )}

        <div className="flex justify-center">
          <button
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <div className="pt-6 flex justify-center">
          <img src={bornToLead.url} alt="Born to Lead" className="h-8 sm:h-10 w-auto opacity-90" />
        </div>
      </main>

      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
