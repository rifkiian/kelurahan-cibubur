import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreVertical } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";

const statusConfig = {
  pending: { label: "Menunggu", className: "bg-accent/20 text-accent-foreground border-accent" },
  processing: { label: "Diproses", className: "bg-secondary/20 text-secondary border-secondary" },
  completed: { label: "Selesai", className: "bg-primary/20 text-primary border-primary" },
};

type PengaduanStatus = "BARU" | "DIPROSES" | "SELESAI";

type Pengaduan = {
  id: string;
  name: string;
  phone: string;
  category: string;
  location: string;
  description: string;
  photoUrl: string | null;
  status: PengaduanStatus;
  createdAt: string;
  updatedAt: string;
};

const mapStatus = (status: PengaduanStatus): keyof typeof statusConfig => {
  if (status === "SELESAI") return "completed";
  if (status === "DIPROSES") return "processing";
  return "pending";
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

export function ServiceRequests() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const pengaduanQuery = useQuery({
    queryKey: ["pengaduan", "dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/pengaduan", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Pengaduan[] };
      return data.items;
    },
    enabled: Boolean(token),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const rows = (pengaduanQuery.data ?? []).slice(0, 5);

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Pengaduan Layanan</CardTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/admin/pengaduan")}>
          Lihat Semua
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">No. Pengajuan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Jenis Layanan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Pemohon</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Tanggal</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pengaduanQuery.isLoading && (
                <tr>
                  <td className="py-6 px-2 text-sm text-muted-foreground" colSpan={6}>
                    Memuat...
                  </td>
                </tr>
              )}

              {pengaduanQuery.isError && (
                <tr>
                  <td className="py-6 px-2 text-sm text-muted-foreground" colSpan={6}>
                    Gagal memuat data pengaduan.
                  </td>
                </tr>
              )}

              {!pengaduanQuery.isLoading && !pengaduanQuery.isError && rows.length === 0 && (
                <tr>
                  <td className="py-6 px-2 text-sm text-muted-foreground" colSpan={6}>
                    Belum ada pengaduan.
                  </td>
                </tr>
              )}

              {rows.map((r) => {
                const status = statusConfig[mapStatus(r.status)];
                return (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-2">
                      <span className="font-mono text-sm font-medium text-foreground">{r.id}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-foreground">{r.category}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-foreground">{r.name}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => navigate("/admin/pengaduan")}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => navigate("/admin/pengaduan")}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
