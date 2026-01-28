import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare,
  MessagesSquare,
  Newspaper, 
  Settings, 
  LogOut,
  Building2,
  ChevronLeft,
  Bell,
  CalendarDays,
  Info,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Data Penduduk", href: "/admin/penduduk" },
  { icon: FileText, label: "Layanan", href: "/admin/layanan" },
  { icon: MessageSquare, label: "Pengaduan", href: "/admin/pengaduan" },
  { icon: Newspaper, label: "Berita", href: "/admin/berita" },
  { icon: CalendarDays, label: "Agenda", href: "/admin/statistik" },
  { icon: Info, label: "Tentang", href: "/admin/tentang" },
  { icon: Phone, label: "Kontak", href: "/admin/kontak" },
  { icon: Bell, label: "Notifikasi", href: "/admin/notifikasi" },
  { icon: MessagesSquare, label: "Live Chat", href: "/admin/live-chat" },
  { icon: Settings, label: "Pengaturan", href: "/admin/pengaturan" },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, token } = useAuth();

  const statsHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const statsQuery = useQuery({
    queryKey: ["stats", "overview", "sidebar"],
    queryFn: async () => {
      const res = await fetch("/api/stats/overview", { headers: statsHeaders });
      if (!res.ok) throw new Error("failed_fetch");
      return (await res.json()) as {
        pengaduan?: { byStatus?: { BARU?: number } };
      };
    },
    enabled: Boolean(token),
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 1,
  });

  const pengaduanBaruCount = Number(statsQuery.data?.pengaduan?.byStatus?.BARU || 0);

  const prevBaruRef = useRef<number | null>(null);
  useEffect(() => {
    if (!token) {
      prevBaruRef.current = null;
      return;
    }

    if (statsQuery.isFetching) return;
    if (statsQuery.isError) return;

    const prev = prevBaruRef.current;
    if (prev === null) {
      prevBaruRef.current = pengaduanBaruCount;
      return;
    }

    if (pengaduanBaruCount > prev) {
      const diff = pengaduanBaruCount - prev;
      toast({
        title: "Notifikasi",
        description: `Ada ${diff} pengaduan baru masuk.`,
      });
    }

    prevBaruRef.current = pengaduanBaruCount;
  }, [pengaduanBaruCount, statsQuery.isError, statsQuery.isFetching, token]);

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
          const showNotifBadge = item.href === "/admin/notifikasi" && pengaduanBaruCount > 0;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {showNotifBadge && !collapsed && (
                <span className="ml-auto inline-flex min-w-6 h-6 items-center justify-center rounded-full bg-sidebar-primary-foreground/15 px-2 text-xs font-bold text-sidebar-primary-foreground">
                  {pengaduanBaruCount > 99 ? "99+" : pengaduanBaruCount}
                </span>
              )}
              {showNotifBadge && collapsed && (
                <span className="absolute top-2 right-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-sidebar-primary-foreground/15 px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">
                  {pengaduanBaruCount > 99 ? "99+" : pengaduanBaruCount}
                </span>
              )}
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
        <Button
          variant="ghost"
          className={cn(
            "w-full mt-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "px-0",
          )}
          onClick={() => {
            logout();
            navigate("/", { replace: true });
          }}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-2">Keluar</span>}
        </Button>
      </div>
    </aside>
  );
}
