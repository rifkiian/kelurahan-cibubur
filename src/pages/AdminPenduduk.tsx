import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Penduduk = {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  tanggalLahir: string | null;
  alamat: string | null;
  createdAt: string;
  updatedAt: string;
};

type PendudukForm = {
  nik: string;
  nama: string;
  jenisKelamin: string;
  tanggalLahir: string;
  alamat: string;
};

type SiteMetrics = {
  id: number;
  rtAktif: number;
  rwAktif: number;
};

const AdminPenduduk = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [metricsTouched, setMetricsTouched] = useState(false);
  const [metricsForm, setMetricsForm] = useState<{ rtAktif: string; rwAktif: string }>({
    rtAktif: "0",
    rwAktif: "0",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Penduduk | null>(null);
  const [form, setForm] = useState<PendudukForm>({
    nik: "",
    nama: "",
    jenisKelamin: "LAKI_LAKI",
    tanggalLahir: "",
    alamat: "",
  });

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const pendudukQuery = useQuery({
    queryKey: ["penduduk"],
    queryFn: async () => {
      const res = await fetch("/api/penduduk", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Penduduk[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

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
      rtAktif: String(metricsQuery.data.rtAktif ?? 0),
      rwAktif: String(metricsQuery.data.rwAktif ?? 0),
    });
  }, [metricsQuery.data, metricsTouched]);

  const saveMetricsMutation = useMutation({
    mutationFn: async () => {
      const rtAktif = Number(metricsForm.rtAktif);
      const rwAktif = Number(metricsForm.rwAktif);

      if (!Number.isFinite(rtAktif) || rtAktif < 0) throw new Error("RT aktif tidak valid");
      if (!Number.isFinite(rwAktif) || rwAktif < 0) throw new Error("RW aktif tidak valid");

      const res = await fetch("/api/site/metrics", {
        method: "PUT",
        headers,
        body: JSON.stringify({ rtAktif, rwAktif }),
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
      toast({ title: "Berhasil", description: "Data RT/RW aktif diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: PendudukForm) => {
      const res = await fetch("/api/penduduk", {
        method: "POST",
        headers,
        body: JSON.stringify({
          nik: payload.nik,
          nama: payload.nama,
          jenisKelamin: payload.jenisKelamin,
          tanggalLahir: payload.tanggalLahir || null,
          alamat: payload.alamat || null,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) throw new Error("failed_create");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["penduduk"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Data penduduk ditambahkan." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menambah data", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: PendudukForm }) => {
      const res = await fetch(`/api/penduduk/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          nik: payload.nik,
          nama: payload.nama,
          jenisKelamin: payload.jenisKelamin,
          tanggalLahir: payload.tanggalLahir || null,
          alamat: payload.alamat || null,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) throw new Error("failed_update");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["penduduk"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Data penduduk diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal mengubah data", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/penduduk/${id}`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) throw new Error("failed_delete");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["penduduk"] });
      toast({ title: "Berhasil", description: "Data penduduk dihapus." });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus data", variant: "destructive" });
    },
  });

  const submitDisabled = !form.nik.trim() || !form.nama.trim() || !form.jenisKelamin.trim();

  const openCreate = () => {
    setEditing(null);
    setForm({ nik: "", nama: "", jenisKelamin: "LAKI_LAKI", tanggalLahir: "", alamat: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: Penduduk) => {
    setEditing(p);
    setForm({
      nik: p.nik,
      nama: p.nama,
      jenisKelamin: p.jenisKelamin,
      tanggalLahir: p.tanggalLahir || "",
      alamat: p.alamat || "",
    });
    setDialogOpen(true);
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
              <h1 className="text-2xl font-bold text-foreground">Data Penduduk</h1>
              <p className="text-muted-foreground text-sm">Kelola data penduduk</p>
            </div>
            <Button onClick={openCreate}>
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
                  <div className="text-lg font-bold text-foreground">RT/RW Aktif</div>
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
              {metricsQuery.isError && <div className="mt-4 text-sm text-destructive">Gagal memuat data RT/RW</div>}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="glass-card p-6">
            {pendudukQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {pendudukQuery.isError && (
              <div className="text-sm text-destructive">Gagal memuat data penduduk</div>
            )}

            {pendudukQuery.data && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Tanggal Lahir</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendudukQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendudukQuery.data.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono">{p.nik}</TableCell>
                        <TableCell>{p.nama}</TableCell>
                        <TableCell>{p.jenisKelamin}</TableCell>
                        <TableCell>{p.tanggalLahir || "-"}</TableCell>
                        <TableCell>{p.alamat || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus data penduduk?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tindakan ini tidak bisa dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      deleteMutation.mutate(p.id);
                                    }}
                                  >
                                    Hapus
                                  </AlertDialogAction>
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
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Penduduk" : "Tambah Penduduk"}</DialogTitle>
              <DialogDescription>
                Lengkapi data berikut untuk {editing ? "memperbarui" : "menambahkan"} penduduk.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nik">NIK</Label>
                <Input
                  id="nik"
                  value={form.nik}
                  onChange={(e) => setForm((f) => ({ ...f, nik: e.target.value }))}
                  placeholder="Contoh: 3175xxxxxxxxxxxx"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nama">Nama</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  placeholder="Nama lengkap"
                />
              </div>

              <div className="grid gap-2">
                <Label>Jenis Kelamin</Label>
                <Select value={form.jenisKelamin} onValueChange={(v) => setForm((f) => ({ ...f, jenisKelamin: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  id="tanggalLahir"
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(e) => setForm((f) => ({ ...f, tanggalLahir: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="alamat">Alamat</Label>
                <Input
                  id="alamat"
                  value={form.alamat}
                  onChange={(e) => setForm((f) => ({ ...f, alamat: e.target.value }))}
                  placeholder="Alamat"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                disabled={submitDisabled || createMutation.isPending || updateMutation.isPending}
                onClick={() => {
                  if (editing) {
                    updateMutation.mutate({ id: editing.id, payload: form });
                  } else {
                    createMutation.mutate(form);
                  }
                }}
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPenduduk;
