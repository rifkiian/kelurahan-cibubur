import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Newspaper, 
  Settings, 
  LogOut,
  Building2,
  ChevronLeft,
  Bell,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Data Penduduk", href: "/admin/penduduk" },
  { icon: FileText, label: "Layanan", href: "/admin/layanan" },
  { icon: Newspaper, label: "Berita", href: "/admin/berita" },
  { icon: BarChart3, label: "Statistik", href: "/admin/statistik" },
  { icon: Bell, label: "Notifikasi", href: "/admin/notifikasi" },
  { icon: Settings, label: "Pengaturan", href: "/admin/pengaturan" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm truncate">Kelurahan Cibubur</div>
              <div className="text-xs text-sidebar-foreground/60">Admin Panel</div>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-sm font-bold">AD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="font-medium text-sm truncate">Admin Kelurahan</div>
              <div className="text-xs text-sidebar-foreground/60 truncate">admin@cibubur.go.id</div>
            </div>
          )}
        </div>
        <Link to="/">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full mt-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "px-0"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Keluar</span>}
          </Button>
        </Link>
      </div>
    </aside>
  );
}
