import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Wand2, Eye, Image as ImageIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

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

const statusLabel: Record<PengaduanStatus, string> = {
  BARU: "Menunggu",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
};

const AdminPengaduan = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const focusId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("focus") || "";
  }, [location.search]);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const pengaduanQuery = useQuery({
    queryKey: ["pengaduan"],
    queryFn: async () => {
      const res = await fetch("/api/pengaduan", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Pengaduan[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PengaduanStatus }) => {
      const res = await fetch(`/api/pengaduan/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("failed_update");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pengaduan"] });
      toast({ title: "Berhasil", description: "Status pengaduan diperbarui." });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal memperbarui status", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pengaduan/${id}`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) throw new Error("failed_delete");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pengaduan"] });
      toast({ title: "Berhasil", description: "Pengaduan dihapus." });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus pengaduan", variant: "destructive" });
    },
  });

  const toSlug = (input: string) =>
    input
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  const jadikanLayanan = (p: Pengaduan) => {
    const title = `Tindak lanjut pengaduan - ${p.category}`;
    const description = `Kategori: ${p.category}\nLokasi: ${p.location}\n\n${p.description}`;
    const slug = `pengaduan-${toSlug(p.category)}-${p.id.slice(-6)}`;

    const sp = new URLSearchParams();
    sp.set("from", "pengaduan");
    sp.set("slug", slug);
    sp.set("title", title);
    sp.set("description", description);

    navigate(`/admin/layanan?${sp.toString()}`);
  };

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
              <h1 className="text-2xl font-bold text-foreground">Pengaduan</h1>
              <p className="text-muted-foreground text-sm">Kelola pengaduan masyarakat</p>
              {focusId ? <p className="text-xs text-muted-foreground mt-1">Fokus kode: {focusId}</p> : null}
            </div>
            <Button variant="outline" onClick={() => pengaduanQuery.refetch()}>
              <Plus className="w-4 h-4" />
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6">
            {pengaduanQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {pengaduanQuery.isError && <div className="text-sm text-destructive">Gagal memuat data pengaduan</div>}

            {pengaduanQuery.data && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengaduanQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Belum ada pengaduan
                      </TableCell>
                    </TableRow>
                  ) : (
                    pengaduanQuery.data.map((p) => (
                      <TableRow key={p.id} className={focusId && p.id === focusId ? "bg-yellow-50" : undefined}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.phone}</div>
                        </TableCell>
                        <TableCell className="capitalize">{p.category}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{p.location}</TableCell>
                        <TableCell className="max-w-[300px]">
                          <div className="truncate" title={p.description}>
                            {p.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {p.photoUrl ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <ImageIcon className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Foto Pengaduan</DialogTitle>
                                  <DialogDescription>
                                    {p.name} - {p.category}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4">
                                  <img 
                                    src={p.photoUrl} 
                                    alt="Foto pengaduan" 
                                    className="w-full rounded-lg border"
                                    onError={(e) => {
                                      e.currentTarget.src = "/api/uploads/placeholder.png";
                                    }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={p.status}
                            onValueChange={(v) => updateStatusMutation.mutate({ id: p.id, status: v as PengaduanStatus })}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Pilih" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BARU">{statusLabel.BARU}</SelectItem>
                              <SelectItem value="DIPROSES">{statusLabel.DIPROSES}</SelectItem>
                              <SelectItem value="SELESAI">{statusLabel.SELESAI}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => jadikanLayanan(p)}>
                              <Wand2 className="w-4 h-4" />
                              <span className="ml-1 hidden sm:inline">Jadikan Layanan</span>
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus pengaduan?</AlertDialogTitle>
                                  <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)}>Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPengaduan;
