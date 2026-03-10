import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Users, Download, Megaphone, Shield, LogOut, Video } from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
{ label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
{ label: "Alunos", path: "/alunos", icon: Users },
{ label: "Materiais", path: "/materiais", icon: Download },
{ label: "Mural", path: "/mural", icon: Megaphone },
{ label: "Admin", path: "/admin", icon: Shield, adminOnly: true }];


function UserInitials({ name }: {name: string;}) {
  const initials = name.
  split(" ").
  map((n) => n[0]).
  slice(0, 2).
  join("").
  toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center">
      <span className="text-xs font-body font-semibold text-background">{initials}</span>
    </div>);

}

export default function AppLayout({ children }: {children: ReactNode;}) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r bg-card min-h-screen">
        <div className="p-5 border-b">
          <h1 className="text-lg font-bold tracking-tight font-sans">Portal Escolar</h1>
        </div>

        <nav className="flex-1 p-3">
          {visibleItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 mb-1 text-sm font-body rounded transition-colors ${
                active ?
                "bg-secondary text-primary font-medium" :
                "text-foreground hover:bg-secondary"}`
                }>
                
                <item.icon className="w-4 h-4" strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>);

          })}
        </nav>

        <div className="p-3 border-t">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserInitials name={profile?.full_name || "U"} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdmin ? "Administrador" : "Líder de Classe"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors mt-1">
            
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-base font-heading font-bold">Portal Escolar</h1>
          <div className="flex items-center gap-2">
            <UserInitials name={profile?.full_name || "U"} />
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