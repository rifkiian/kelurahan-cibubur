import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, FileText, Clock, CheckCircle, Bell, Search } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentActivity } from "@/components/admin/RecentActivity";
import { ServiceRequests } from "@/components/admin/ServiceRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";

type StatsOverview = {
  pendudukTotal: number;
  pengaduan: {
    total: number;
    byStatus: { BARU: number; DIPROSES: number; SELESAI: number };
    selesaiBulanIni: number;
    last7Days: { date: string; count: number }[];
  };
};

const AdminDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { token } = useAuth();
  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const overviewQuery = useQuery({
    queryKey: ["stats", "overview"],
    queryFn: async () => {
      const res = await fetch("/api/stats/overview", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      return (await res.json()) as StatsOverview;
    },
    enabled: Boolean(token),
  });

  const overview = overviewQuery.data;
  const pendudukTotal = overview?.pendudukTotal ?? 0;
  const pengaduanBaru = overview?.pengaduan.byStatus.BARU ?? 0;
  const pengaduanDiproses = overview?.pengaduan.byStatus.DIPROSES ?? 0;
  const pengaduanSelesaiBulanIni = overview?.pengaduan.selesaiBulanIni ?? 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarCollapsed ? "ml-20" : "ml-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground text-sm">Selamat datang kembali, Admin</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari..." 
                  className="pl-10 w-64 bg-background"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard 
              title="Total Penduduk"
              value={overviewQuery.isLoading ? "..." : pendudukTotal}
              change={overviewQuery.isError ? "Gagal memuat" : undefined}
              changeType={overviewQuery.isError ? "negative" : "neutral"}
              icon={Users}
              iconColor="bg-primary/10 text-primary"
            />
            <StatsCard 
              title="Pengajuan Baru"
              value={overviewQuery.isLoading ? "..." : pengaduanBaru}
              change={overviewQuery.isError ? "Gagal memuat" : "Menunggu"}
              changeType={overviewQuery.isError ? "negative" : "neutral"}
              icon={FileText}
              iconColor="bg-secondary/20 text-secondary"
            />
            <StatsCard 
              title="Dalam Proses"
              value={overviewQuery.isLoading ? "..." : pengaduanDiproses}
              change={overviewQuery.isError ? "Gagal memuat" : "Diproses"}
              changeType={overviewQuery.isError ? "negative" : "neutral"}
              icon={Clock}
              iconColor="bg-accent/20 text-accent-foreground"
            />
            <StatsCard 
              title="Selesai Bulan Ini"
              value={overviewQuery.isLoading ? "..." : pengaduanSelesaiBulanIni}
              change={overviewQuery.isError ? "Gagal memuat" : "Status: Selesai"}
              changeType={overviewQuery.isError ? "negative" : "positive"}
              icon={CheckCircle}
              iconColor="bg-primary/10 text-primary"
            />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Requests Table */}
            <div className="lg:col-span-2">
              <ServiceRequests />
            </div>
            
            {/* Recent Activity */}
            <div>
              <RecentActivity />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
