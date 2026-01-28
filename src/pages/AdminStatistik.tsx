import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

type Agenda = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AgendaForm = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AdminStatistik = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { token } = useAuth();
  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<AgendaForm>({
    title: "",
    description: "",
    location: "",
    startAt: "",
    endAt: "",
  });

  const agendaQuery = useQuery({
    queryKey: ["agenda"],
    queryFn: async () => {
      const res = await fetch("/api/agenda", { headers: { Authorization: headers.Authorization || "" } });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Agenda[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: AgendaForm) => {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: payload.title,
          description: payload.description.trim() ? payload.description : null,
          location: payload.location.trim() ? payload.location : null,
          startAt: payload.startAt,
          endAt: payload.endAt.trim() ? payload.endAt : null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_create");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["agenda"] });
      setDialogOpen(false);
      setForm({ title: "", description: "", location: "", startAt: "", endAt: "" });
      toast({ title: "Berhasil", description: "Agenda ditambahkan." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menambah agenda", variant: "destructive" });
    },
  });

  const submitDisabled = !form.title.trim() || !form.startAt.trim();

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
              <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
              <p className="text-muted-foreground text-sm">Kelola agenda dan jadwal kegiatan</p>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              <span className="ml-2">Tambah</span>
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6">
            {agendaQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {agendaQuery.isError && <div className="text-sm text-destructive">Gagal memuat agenda</div>}

            {agendaQuery.data && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Selesai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agendaQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada agenda
                      </TableCell>
                    </TableRow>
                  ) : (
                    agendaQuery.data.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{a.description || "-"}</div>
                        </TableCell>
                        <TableCell className="text-sm">{a.location || "-"}</TableCell>
                        <TableCell className="text-sm font-mono">{formatDateTime(a.startAt)}</TableCell>
                        <TableCell className="text-sm font-mono">{formatDateTime(a.endAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tambah Agenda</DialogTitle>
              <DialogDescription>Tambahkan agenda acara yang akan datang.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Judul</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi (opsional)</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Lokasi (opsional)</Label>
                <Input id="location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startAt">Mulai</Label>
                <Input
                  id="startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endAt">Selesai (opsional)</Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={submitDisabled || createMutation.isPending}
                onClick={() => {
                  createMutation.mutate(form);
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

export default AdminStatistik;
