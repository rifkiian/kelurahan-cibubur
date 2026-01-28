import { useState } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

type Pengaduan = {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string;
  description: string;
  photoUrl: string | null;
  status: "BARU" | "DIPROSES" | "SELESAI";
  createdAt: string;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminNotifikasi = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const pengaduanQuery = useQuery({
    queryKey: ["pengaduan", "admin", "notifications"],
    queryFn: async () => {
      const res = await fetch("/api/pengaduan", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Pengaduan[] };
      return data.items;
    },
    enabled: Boolean(token),
    refetchInterval: 10000,
    staleTime: 5000,
    retry: 1,
  });

  const baruItems = (pengaduanQuery.data || []).filter((p) => p.status === "BARU");

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main
        className={cn(
          "transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-20" : "ml-64",
        )}
      >
        <header className="sticky top-0 z-40 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifikasi</h1>
              <p className="text-muted-foreground text-sm">Pengaduan baru akan muncul di sini</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/pengaduan">Buka Pengaduan</Link>
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold text-foreground">Pengaduan Baru</div>
              <Badge className="bg-primary/10 text-primary">{baruItems.length} pesan</Badge>
            </div>

            <div className="mt-4">
              {!token && <div className="text-sm text-muted-foreground">Silakan login admin.</div>}
              {pengaduanQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
              {pengaduanQuery.isError && <div className="text-sm text-destructive">Gagal memuat notifikasi</div>}

              {pengaduanQuery.data && (
                <div className="space-y-4">
                  {baruItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Belum ada pengaduan baru.</div>
                  ) : (
                    baruItems.slice(0, 20).map((p) => (
                      <Card key={p.id} className="border-0 card-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="font-bold text-foreground line-clamp-1">{p.category}</div>
                              <div className="mt-1 text-sm text-muted-foreground line-clamp-1">
                                {p.name} • {p.phone}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground line-clamp-1">{p.location}</div>
                              <div className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.description}</div>
                              <div className="mt-3 text-xs text-muted-foreground font-mono">{formatDateTime(p.createdAt)}</div>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700 shrink-0">BARU</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifikasi;
