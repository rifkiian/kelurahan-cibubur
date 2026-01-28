import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

type Berita = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type BeritaForm = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  published: boolean;
};

const AdminBerita = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Berita | null>(null);
  const [form, setForm] = useState<BeritaForm>({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    coverImageUrl: "",
    published: false,
  });

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const beritaQuery = useQuery({
    queryKey: ["berita"],
    queryFn: async () => {
      const res = await fetch("/api/berita", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Berita[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: BeritaForm) => {
      const res = await fetch("/api/berita", {
        method: "POST",
        headers,
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          excerpt: payload.excerpt.trim() ? payload.excerpt : null,
          content: payload.content,
          coverImageUrl: payload.coverImageUrl.trim() ? payload.coverImageUrl : null,
          published: payload.published,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_create");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["berita"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Berita ditambahkan." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menambah berita", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: BeritaForm }) => {
      const res = await fetch(`/api/berita/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          excerpt: payload.excerpt.trim() ? payload.excerpt : null,
          content: payload.content,
          coverImageUrl: payload.coverImageUrl.trim() ? payload.coverImageUrl : null,
          published: payload.published,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_update");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["berita"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Berita diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal mengubah berita", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/berita/${id}`, { method: "DELETE", headers });
      if (!res.ok && res.status !== 204) throw new Error("failed_delete");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["berita"] });
      toast({ title: "Berhasil", description: "Berita dihapus." });
    },
    onError: () => {
      toast({ title: "Gagal", description: "Gagal menghapus berita", variant: "destructive" });
    },
  });

  const submitDisabled = !form.slug.trim() || !form.title.trim() || !form.content.trim();

  const openCreate = () => {
    setEditing(null);
    setForm({ slug: "", title: "", excerpt: "", content: "", coverImageUrl: "", published: false });
    setDialogOpen(true);
  };

  const openEdit = (b: Berita) => {
    setEditing(b);
    setForm({
      slug: b.slug,
      title: b.title,
      excerpt: b.excerpt || "",
      content: b.content,
      coverImageUrl: b.coverImageUrl || "",
      published: Boolean(b.published),
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
              <h1 className="text-2xl font-bold text-foreground">Berita</h1>
              <p className="text-muted-foreground text-sm">Kelola berita dan pengumuman</p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              <span className="ml-2">Tambah</span>
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6">
            {beritaQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {beritaQuery.isError && <div className="text-sm text-destructive">Gagal memuat berita</div>}

            {beritaQuery.data && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Slug</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Publish</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beritaQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada berita
                      </TableCell>
                    </TableRow>
                  ) : (
                    beritaQuery.data.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono">{b.slug}</TableCell>
                        <TableCell>
                          <div className="font-medium">{b.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{b.excerpt || "-"}</div>
                        </TableCell>
                        <TableCell>{b.published ? "Ya" : "Tidak"}</TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => openEdit(b)}>
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
                                  <AlertDialogTitle>Hapus berita?</AlertDialogTitle>
                                  <AlertDialogDescription>Tindakan ini tidak bisa dibatalkan.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteMutation.mutate(b.id)}>Hapus</AlertDialogAction>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Berita" : "Tambah Berita"}</DialogTitle>
              <DialogDescription>
                Lengkapi data berikut untuk {editing ? "memperbarui" : "menambahkan"} berita.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="contoh: pengumuman-libur"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Judul berita"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="excerpt">Ringkasan (opsional)</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                  placeholder="Ringkasan singkat..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="content">Konten</Label>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Isi berita..."
                  rows={10}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="coverImageUrl">Cover Image URL (opsional)</Label>
                <Input
                  id="coverImageUrl"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Publish</div>
                  <div className="text-xs text-muted-foreground">Jika aktif, berita akan ditandai sebagai terbit.</div>
                </div>
                <Switch checked={form.published} onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
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

export default AdminBerita;
