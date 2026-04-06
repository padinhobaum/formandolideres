import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Home, MessageSquare, Download, Megaphone, Shield, LogOut, Video, ExternalLink, Sparkles, KeyRound, Radio } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePresence } from "@/hooks/usePresence";
import NotificationPopover from "@/components/NotificationPopover";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { usePushSubscription } from "@/hooks/usePushSubscription";

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
  adminOnly?: boolean;
  badge?: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
  icon_url: string | null;
  sort_order: number;
}

const baseNavItems: NavItem[] = [
{ label: "Home", path: "/home", icon: Home },
{ label: "Mural", path: "/mural", icon: Megaphone },
{ label: "Fórum", path: "/forum", icon: MessageSquare },
{ label: "LíderAI", path: "/lider-ai", icon: Sparkles, badge: "Novo" },
{ label: "Videoaulas", path: "/videoaulas", icon: Video },
{ label: "Materiais", path: "/materiais", icon: Download },
{ label: "Admin", path: "/admin", icon: Shield, adminOnly: true }];


export default function AppLayout({ children }: {children: ReactNode;}) {
  const { profile, isAdmin, signOut } = useAuth();
  usePresence();
  usePushSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [hasActiveLive, setHasActiveLive] = useState(false);

  useEffect(() => {
    supabase.from("custom_links").select("*").order("sort_order").then(({ data }) => {
      if (data) setCustomLinks(data as CustomLink[]);
    });
    supabase.from("live_streams").select("id").eq("is_active", true).limit(1).then(({ data }) => {
      setHasActiveLive(!!(data && data.length > 0));
    });

    // Realtime listener for live stream activations
    const channel = supabase
      .channel("live-stream-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_streams" },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow.is_active) {
            setHasActiveLive(true);
            toast("🔴 Transmissão ao vivo!", {
              description: newRow.title,
              action: {
                label: "Assistir",
                onClick: () => navigate("/ao-vivo"),
              },
              duration: 10000,
            });
          } else {
            // Check if any other streams are still active
            supabase.from("live_streams").select("id").eq("is_active", true).limit(1).then(({ data }) => {
              setHasActiveLive(!!(data && data.length > 0));
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  const navItems: NavItem[] = hasActiveLive
    ? [
        ...baseNavItems.slice(0, 1),
        { label: "Ao Vivo", path: "/ao-vivo", icon: Radio, badge: "LIVE" },
        ...baseNavItems.slice(1),
      ]
    : baseNavItems;

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isExternal = (url: string) => url.startsWith("http");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center">
          <img alt="Formando Líderes" className="h-14 w-auto brightness-0 invert" src="/lovable-uploads/bfd69f6a-f0cc-4d2a-80c7-be444a67f5d9.png" />
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
                {item.badge &&
                <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none ${
                  item.badge === "LIVE" ? "bg-red-500 text-white animate-pulse" : "text-primary-foreground bg-accent"
                }`}>
                    {item.badge}
                  </span>
                }
              </button>);

          })}

          {/* Notifications */}
          <NotificationPopover variant="sidebar" />

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
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-body font-semibold bg-sidebar-primary text-sidebar-primary-foreground">
                    {(profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">{profile?.full_name}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {isAdmin ? "Administrador" : "Líder de Classe"}
                  </p>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-56 p-1">
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
                <KeyRound className="w-4 h-4" />
                Alterar senha
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-destructive hover:bg-accent transition-colors">
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <img src="/lovable-uploads/footer-logo.png" alt="Formando Líderes" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <NotificationPopover variant="header" />
            <Popover>
              <PopoverTrigger asChild>
                <button>
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs font-body font-semibold bg-foreground text-background">
                      {(profile?.full_name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-56 p-1">
                <button
                  onClick={() => setChangePasswordOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent transition-colors">
                  <KeyRound className="w-4 h-4" />
                  Alterar senha
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded text-destructive hover:bg-accent transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <div className="p-4 md:p-8 flex-1">{children}</div>

        {/* Footer */}
        <footer className="border-t bg-card text-foreground py-6 md:py-8 md:px-10 px-[20px]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-12">
            <div className="flex flex-col items-center md:items-start gap-1">
              <img
                src="/lovable-uploads/footer-logo.png"
                alt="Formando Líderes"
                className="h-10 md:h-12 w-auto" />
            </div>
            <div className="flex-1" />
            <div className="flex flex-col items-center md:items-end gap-0.5">
              <a
                href="https://www.formandolideres.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                www.formandolideres.org
              </a>
              <p className="text-xs text-muted-foreground text-center md:text-right mt-0.5">
                © {new Date().getFullYear()} Formando Líderes – Todos os direitos reservados.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t flex justify-around py-2 z-30">
        {visibleItems.filter((i) => !i.adminOnly).slice(0, 5).map((item) => {
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
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>);

}