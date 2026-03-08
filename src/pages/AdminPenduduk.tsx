import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SiteMetrics = {
  id: number;
  pendudukTotal: number;
  rtAktif: number;
  rwAktif: number;
};

const AdminPenduduk = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [metricsTouched, setMetricsTouched] = useState(false);
  const [metricsForm, setMetricsForm] = useState<{ pendudukTotal: string; rtAktif: string; rwAktif: string }>({
    pendudukTotal: "0",
    rtAktif: "0",
    rwAktif: "0",
  });

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const metricsQuery = useQuery({
    queryKey: ["site", "metrics"],
    queryFn: async () => {
      const res = await fetch("/api/site/metrics", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: SiteMetrics };
      return data.item;
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (metricsTouched) return;
    if (!metricsQuery.data) return;
    setMetricsForm({
      pendudukTotal: String(metricsQuery.data.pendudukTotal ?? 0),
      rtAktif: String(metricsQuery.data.rtAktif ?? 0),
      rwAktif: String(metricsQuery.data.rwAktif ?? 0),
    });
  }, [metricsQuery.data, metricsTouched]);

  const saveMetricsMutation = useMutation({
    mutationFn: async () => {
      const pendudukTotal = Number(metricsForm.pendudukTotal);
      const rtAktif = Number(metricsForm.rtAktif);
      const rwAktif = Number(metricsForm.rwAktif);

      if (!Number.isFinite(pendudukTotal) || pendudukTotal < 0) throw new Error("Jumlah penduduk tidak valid");
      if (!Number.isFinite(rtAktif) || rtAktif < 0) throw new Error("RT aktif tidak valid");
      if (!Number.isFinite(rwAktif) || rwAktif < 0) throw new Error("RW aktif tidak valid");

      const res = await fetch("/api/site/metrics", {
        method: "PUT",
        headers,
        body: JSON.stringify({ pendudukTotal, rtAktif, rwAktif }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_save");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site", "metrics"] });
      await queryClient.invalidateQueries({ queryKey: ["site", "public", "metrics"] });
      setMetricsTouched(false);
      toast({ title: "Berhasil", description: "Data metrik beranda diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    },
  });

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
              <h1 className="text-2xl font-bold text-foreground">Data Penduduk</h1>
              <p className="text-muted-foreground text-sm">Kelola jumlah penduduk</p>
            </div>
            <Button disabled>
              <Plus className="w-4 h-4" />
              <span className="ml-2">Tambah</span>
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-foreground">Metrik Beranda</div>
                  <div className="text-sm text-muted-foreground">Angka ini akan tampil di beranda user.</div>
                </div>
                <Button
                  disabled={saveMetricsMutation.isPending || !token}
                  onClick={() => {
                    setMetricsTouched(true);
                    saveMetricsMutation.mutate();
                  }}
                >
                  Simpan
                </Button>
              </div>

              {metricsQuery.isLoading && <div className="mt-4 text-sm text-muted-foreground">Memuat...</div>}
              {metricsQuery.isError && <div className="mt-4 text-sm text-destructive">Gagal memuat data</div>}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Jumlah Penduduk</Label>
                  <Input
                    value={metricsForm.pendudukTotal}
                    onChange={(e) => {
                      setMetricsTouched(true);
                      setMetricsForm((p) => ({ ...p, pendudukTotal: e.target.value }));
                    }}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>RT Aktif</Label>
                  <Input
                    value={metricsForm.rtAktif}
                    onChange={(e) => {
                      setMetricsTouched(true);
                      setMetricsForm((p) => ({ ...p, rtAktif: e.target.value }));
                    }}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>RW Aktif</Label>
                  <Input
                    value={metricsForm.rwAktif}
                    onChange={(e) => {
                      setMetricsTouched(true);
                      setMetricsForm((p) => ({ ...p, rwAktif: e.target.value }));
                    }}
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPenduduk;
