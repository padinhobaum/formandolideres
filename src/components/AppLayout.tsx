import { ReactNode, useEffect, useState } from "react";
import logoImg from "@/assets/logo-formando-lideres.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, MessageSquare, Download, Megaphone, Shield, LogOut, Video, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePresence } from "@/hooks/usePresence";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
  icon_url: string | null;
  sort_order: number;
}

const navItems: NavItem[] = [
{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
{ label: "Fórum", path: "/forum", icon: MessageSquare },
{ label: "Materiais", path: "/materiais", icon: Download },
{ label: "Videoaulas", path: "/videoaulas", icon: Video },
{ label: "Mural", path: "/mural", icon: Megaphone },
{ label: "Admin", path: "/admin", icon: Shield, adminOnly: true }];


}

export default function AppLayout({ children }: {children: ReactNode;}) {
  const { profile, isAdmin, signOut } = useAuth();
  usePresence();
  const navigate = useNavigate();
  const location = useLocation();
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);

  useEffect(() => {
    supabase.from("custom_links").select("*").order("sort_order").then(({ data }) => {
      if (data) setCustomLinks(data as CustomLink[]);
    });
  }, []);

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isExternal = (url: string) => url.startsWith("http");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-sidebar text-sidebar-foreground min-h-screen">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <img alt="Formando Líderes" className="h-10 w-auto brightness-0 invert" src="/lovable-uploads/bfd69f6a-f0cc-4d2a-80c7-be444a67f5d9.png" />
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {visibleItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-body rounded transition-colors ${
                active ?
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium" :
                "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`
                }>
                
                <item.icon className="w-[20px] h-[20px]" strokeWidth={1.5} />
                <span className="text-lg">{item.label}</span>
              </button>);

          })}

          {/* Custom links */}
          {customLinks.length > 0 &&
          <>
              <div className="border-t border-sidebar-border my-2" />
              {customLinks.map((link) =>
            <a
              key={link.id}
              href={link.url}
              target={isExternal(link.url) ? "_blank" : "_self"}
              rel={isExternal(link.url) ? "noopener noreferrer" : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-body transition-colors text-sidebar-foreground/70 hover:text-sidebar-foreground bg-secondary-foreground rounded-xl">
              
                  {link.icon_url ?
              <img src={link.icon_url} alt="" className="w-[20px] h-[20px] object-contain brightness-0 invert" /> :

              <ExternalLink className="w-[20px] h-[20px]" strokeWidth={1.5} />
              }
                  <span className="truncate text-base">{link.label}</span>
                </a>
            )}
            </>
          }
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-9 h-9">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs font-body font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
                {(profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {isAdmin ? "Administrador" : "Líder de Classe"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent/50 rounded transition-colors mt-1">
            
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <img src={logoImg} alt="Formando Líderes" className="h-8 w-auto" />
          <div className="flex items-center gap-2">
            <Avatar className="w-9 h-9">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs font-body font-semibold bg-foreground text-background">
                {(profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button onClick={handleSignOut}>
              <LogOut className="w-4 h-4 text-destructive" strokeWidth={1.5} />
            </button>
          </div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around py-2 z-30">
        {visibleItems.slice(0, 4).map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
              active ? "text-primary font-medium" : "text-muted-foreground"}`
              }>
              
              <item.icon className="w-5 h-5" strokeWidth={1.5} />
              <span>{item.label}</span>
            </button>);

        })}
        {isAdmin &&
        <button
          onClick={() => navigate("/admin")}
          className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
          location.pathname === "/admin" ? "text-primary font-medium" : "text-muted-foreground"}`
          }>
          
            <Shield className="w-5 h-5" strokeWidth={1.5} />
            <span>Admin</span>
          </button>
        }
      </nav>
    </div>);

}