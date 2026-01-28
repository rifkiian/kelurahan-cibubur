import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

type Layanan = {
  id: string;
  slug: string;
  title: string;
  description: string;
  persyaratan: string[];
  attachmentUrl?: string | null;
  alur?: string[];
  externalLink?: string | null;
  createdAt: string;
  updatedAt: string;
};

type LayananForm = {
  slug: string;
  title: string;
  description: string;
  persyaratanText: string;
  alurText: string;
  attachmentUrl: string;
  externalLink: string;
};

type LayananBulkItem = {
  id?: string;
  slug: string;
  title: string;
  description: string;
  persyaratanText: string;
  alurText: string;
  attachmentUrl: string;
  externalLink: string;
};

type DaruratIcon = "ambulance" | "shield" | "fire" | "phone";
type DaruratColor = "red" | "blue" | "orange" | "green" | "purple" | "yellow";

type DaruratItem = {
  id?: string;
  name: string;
  number: string;
  icon: DaruratIcon;
  color: DaruratColor;
  note: string;
};

const AdminLayanan = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const prefillHandledRef = useRef(false);
  const layananSnapshotRef = useRef<Layanan[] | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Layanan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<LayananForm>({
    slug: "",
    title: "",
    description: "",
    persyaratanText: "",
    alurText: "",
    attachmentUrl: "",
    externalLink: "",
  });

  const saveLayananBulkMutation = useMutation({
    mutationFn: async (items: LayananBulkItem[]) => {
      const normalized = items.map((i) => {
        const persyaratan = i.persyaratanText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        const alur = i.alurText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);

        return {
          ...i,
          slug: i.slug.trim(),
          title: i.title.trim(),
          description: i.description.trim(),
          persyaratan,
          alur,
          attachmentUrl: i.attachmentUrl.trim(),
        };
      });

      const hasPartial = normalized.some((i) => Boolean(i.slug || i.title || i.description));
      const hasInvalid = normalized.some((i) => {
        if (!(i.slug || i.title || i.description)) return false;
        return !(i.slug && i.title && i.description);
      });
      if (hasPartial && hasInvalid) {
        throw new Error("Lengkapi Layanan: Slug, Judul, dan Deskripsi wajib diisi.");
      }

      const usedSlugs = new Set<string>();
      for (const it of normalized) {
        if (!it.slug) continue;
        const key = it.slug.toLowerCase();
        if (usedSlugs.has(key)) throw new Error("Slug layanan tidak boleh duplikat.");
        usedSlugs.add(key);
      }

      const existing = layananSnapshotRef.current || layananQuery.data || [];
      const existingById = new Map(existing.map((l) => [l.id, l] as const));

      const nextExisting = normalized.filter((i) => i.id && existingById.has(i.id));
      const nextIds = new Set(nextExisting.map((i) => i.id as string));
      const toDelete = existing.filter((l) => !nextIds.has(l.id)).map((l) => l.id);
      const toCreate = normalized.filter((i) => !i.id && i.slug && i.title && i.description);

      const toUpdate = nextExisting.filter((i) => {
        const prev = existingById.get(i.id as string);
        if (!prev) return false;
        const prevPers = (prev.persyaratan || []).join("\n").trim();
        const prevAttach = (prev.attachmentUrl || "").trim();
        const prevAlur = ((prev as any).alur || []).join("\n").trim();
        const prevExternal = ((prev as any).externalLink || "").trim();
        const nextAlur = (i as any).alur.join("\n").trim();
        const nextExternal = ((i as any).externalLink || "").trim();
        return (
          prev.slug !== i.slug ||
          prev.title !== i.title ||
          prev.description !== i.description ||
          prevPers !== i.persyaratan.join("\n").trim() ||
          prevAlur !== nextAlur ||
          prevAttach !== i.attachmentUrl ||
          prevExternal !== nextExternal
        );
      });

      for (const id of toDelete) {
        const res = await fetch(`/api/layanan/${id}`, { method: "DELETE", headers });
        if (!res.ok && res.status !== 204) throw new Error("failed_delete");
      }

      for (const item of toUpdate) {
        const res = await fetch(`/api/layanan/${item.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            slug: item.slug,
            title: item.title,
            description: item.description,
            persyaratan: item.persyaratan,
            alur: (item as any).alur,
            attachmentUrl: item.attachmentUrl ? item.attachmentUrl : null,
            externalLink: (item as any).externalLink ? (item as any).externalLink : null,
          }),
        });
        if (res.status === 409) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(data.message || "conflict");
        }
        if (!res.ok) throw new Error("failed_update");
      }

      for (const item of toCreate) {
        const res = await fetch("/api/layanan", {
          method: "POST",
          headers,
          body: JSON.stringify({
            slug: item.slug,
            title: item.title,
            description: item.description,
            persyaratan: item.persyaratan,
            alur: (item as any).alur,
            attachmentUrl: item.attachmentUrl ? item.attachmentUrl : null,
            externalLink: (item as any).externalLink ? (item as any).externalLink : null,
          }),
        });
        if (res.status === 409) {
          const data = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(data.message || "conflict");
        }
        if (!res.ok) throw new Error("failed_create");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["layanan"] });
      setLayananBulkTouched(false);
      toast({ title: "Berhasil", description: "Daftar layanan diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menyimpan layanan", variant: "destructive" });
    },
  });

  const [daruratTouched, setDaruratTouched] = useState(false);
  const [daruratItems, setDaruratItems] = useState<DaruratItem[]>([]);

  const [layananBulkTouched, setLayananBulkTouched] = useState(false);
  const [layananBulkItems, setLayananBulkItems] = useState<LayananBulkItem[]>([]);

  useEffect(() => {
    if (prefillHandledRef.current) return;
    const sp = new URLSearchParams(location.search);
    if (sp.get("from") !== "pengaduan") return;

    const slug = sp.get("slug") || "";
    const title = sp.get("title") || "";
    const description = sp.get("description") || "";

    if (!slug && !title && !description) return;

    prefillHandledRef.current = true;
    setEditing(null);
    setForm({
      slug,
      title,
      description,
      persyaratanText: "",
      alurText: "",
      attachmentUrl: "",
      externalLink: "",
    });
    setDialogOpen(true);
    navigate("/admin/layanan", { replace: true });
  }, [location.search, navigate]);

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const layananQuery = useQuery({
    queryKey: ["layanan"],
    queryFn: async () => {
      const res = await fetch("/api/layanan", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: Layanan[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (layananBulkTouched) return;
    if (!layananQuery.data) return;
    layananSnapshotRef.current = layananQuery.data;
    setLayananBulkItems(
      layananQuery.data.map((l) => ({
        id: l.id,
        slug: l.slug || "",
        title: l.title || "",
        description: l.description || "",
        persyaratanText: (l.persyaratan || []).join("\n"),
        alurText: (l.alur || []).join("\n"),
        attachmentUrl: l.attachmentUrl || "",
        externalLink: l.externalLink || "",
      })),
    );
  }, [layananBulkTouched, layananQuery.data]);

  const daruratQuery = useQuery({
    queryKey: ["site", "darurat"],
    queryFn: async () => {
      const res = await fetch("/api/site/darurat", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: DaruratItem[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (daruratTouched) return;
    if (!daruratQuery.data) return;
    setDaruratItems(
      daruratQuery.data.map((i) => ({
        id: i.id,
        name: i.name || "",
        number: i.number || "",
        icon: (i.icon || "phone") as DaruratIcon,
        color: (i.color || "blue") as DaruratColor,
        note: i.note || "",
      })),
    );
  }, [daruratQuery.data, daruratTouched]);

  const createMutation = useMutation({
    mutationFn: async (payload: LayananForm) => {
      const persyaratan = payload.persyaratanText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const alur = payload.alurText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/layanan", {
        method: "POST",
        headers,
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          description: payload.description,
          persyaratan,
          alur,
          attachmentUrl: payload.attachmentUrl || null,
          externalLink: payload.externalLink || null,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) throw new Error("failed_create");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["layanan"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Layanan ditambahkan." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menambah layanan", variant: "destructive" });
    },
  });

  const saveDaruratMutation = useMutation({
    mutationFn: async (items: DaruratItem[]) => {
      const normalized = items.map((i) => ({
        ...i,
        name: i.name.trim(),
        number: i.number.trim(),
        note: i.note.trim(),
      }));

      const hasPartial = normalized.some((i) => Boolean(i.name || i.number || i.note));
      const hasInvalid = normalized.some((i) => {
        if (!(i.name || i.number || i.note)) return false;
        return !(i.name && i.number && i.note && i.icon && i.color);
      });

      if (hasPartial && hasInvalid) {
        throw new Error("Lengkapi Layanan Darurat: Nama, Nomor, dan Catatan wajib diisi.");
      }

      const payloadItems = normalized
        .filter((i) => Boolean(i.name && i.number && i.note))
        .map((i) => ({
          id: i.id,
          name: i.name,
          number: i.number,
          icon: i.icon,
          color: i.color,
          note: i.note,
        }));

      const res = await fetch("/api/site/darurat", {
        method: "PUT",
        headers,
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_save");
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["site", "darurat"] });
      setDaruratTouched(false);
      toast({ title: "Berhasil", description: "Layanan darurat diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menyimpan layanan darurat", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: LayananForm }) => {
      const persyaratan = payload.persyaratanText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const alur = payload.alurText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/layanan/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          slug: payload.slug,
          title: payload.title,
          description: payload.description,
          persyaratan,
          alur,
          attachmentUrl: payload.attachmentUrl || null,
          externalLink: payload.externalLink || null,
        }),
      });

      if (res.status === 409) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || "conflict");
      }
      if (!res.ok) throw new Error("failed_update");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["layanan"] });
      setDialogOpen(false);
      toast({ title: "Berhasil", description: "Layanan diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal mengubah layanan", variant: "destructive" });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      slug: "",
      title: "",
      description: "",
      persyaratanText: "",
      alurText: "",
      attachmentUrl: "",
      externalLink: "",
    });
    setDialogOpen(true);
  };

  const uploadAttachment = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("failed_read"));
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") return reject(new Error("failed_read"));
          const comma = result.indexOf(",");
          if (comma === -1) return reject(new Error("failed_read"));
          resolve(result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/layanan/attachment", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64: base64,
        }),
      });

      const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
      if (!res.ok || !data?.url) throw new Error(data?.message || "failed_upload");

      setForm((f) => ({ ...f, attachmentUrl: data.url || "" }));
      toast({ title: "Berhasil", description: "Lampiran berhasil diupload." });
    } catch (e) {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal upload lampiran", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const uploadAttachmentForBulk = async (index: number, file: File) => {
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("failed_read"));
        reader.onload = () => {
          const result = reader.result;
          if (typeof result !== "string") return reject(new Error("failed_read"));
          const comma = result.indexOf(",");
          if (comma === -1) return reject(new Error("failed_read"));
          resolve(result.slice(comma + 1));
        };
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/layanan/attachment", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          dataBase64: base64,
        }),
      });

      const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
      if (!res.ok || !data?.url) throw new Error(data?.message || "failed_upload");

      setLayananBulkTouched(true);
      setLayananBulkItems((prev) => prev.map((p, i) => (i === index ? { ...p, attachmentUrl: data.url || "" } : p)));
      toast({ title: "Berhasil", description: "Lampiran berhasil diupload." });
    } catch (e) {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal upload lampiran", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submitDisabled = !form.slug.trim() || !form.title.trim() || !form.description.trim();

  const layananBulkSubmitDisabled = layananBulkItems.some((i) => {
    const slug = i.slug.trim();
    const title = i.title.trim();
    const description = i.description.trim();
    if (!(slug || title || description)) return false;
    return !(slug && title && description);
  });

  const daruratSubmitDisabled = daruratItems.some((i) => {
    const name = i.name.trim();
    const number = i.number.trim();
    const note = i.note.trim();
    if (!(name || number || note)) return false;
    return !(name && number && note);
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
              <h1 className="text-2xl font-bold text-foreground">Layanan</h1>
              <p className="text-muted-foreground text-sm">Kelola layanan kelurahan</p>
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
                  <div className="text-lg font-bold text-foreground">Edit Layanan (Bulk)</div>
                  <div className="text-sm text-muted-foreground">Edit daftar layanan sekaligus seperti Layanan Darurat.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLayananBulkTouched(true);
                      setLayananBulkItems((prev) => [
                        ...prev,
                        {
                          id: undefined,
                          slug: "",
                          title: "",
                          description: "",
                          persyaratanText: "",
                          alurText: "",
                          attachmentUrl: "",
                          externalLink: "",
                        },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-2">Tambah</span>
                  </Button>
                  <Button
                    disabled={layananBulkSubmitDisabled || uploading || saveLayananBulkMutation.isPending}
                    onClick={() => {
                      setLayananBulkTouched(true);
                      saveLayananBulkMutation.mutate(layananBulkItems);
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              </div>

              {layananQuery.isLoading && <div className="mt-4 text-sm text-muted-foreground">Memuat layanan...</div>}
              {layananQuery.isError && <div className="mt-4 text-sm text-destructive">Gagal memuat data layanan</div>}

              <div className="mt-6 grid gap-4">
                {layananBulkItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada layanan</div>
                ) : (
                  layananBulkItems.map((item, idx) => (
                    <div key={item.id || idx} className="rounded-xl border bg-background/40 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3">
                          <Label>Slug</Label>
                          <Input
                            value={item.slug}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, slug: v } : p)));
                            }}
                            placeholder="surat-keterangan"
                          />
                        </div>

                        <div className="lg:col-span-4">
                          <Label>Judul</Label>
                          <Input
                            value={item.title}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, title: v } : p)));
                            }}
                            placeholder="Judul layanan"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <Label>Lampiran (opsional)</Label>
                          <div className="grid gap-2">
                            <Input
                              type="file"
                              accept="application/pdf,image/jpeg"
                              disabled={!token || uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.type !== "application/pdf" && file.type !== "image/jpeg") {
                                  toast({
                                    title: "Gagal",
                                    description: "Tipe file harus PDF atau JPG",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                void uploadAttachmentForBulk(idx, file);
                              }}
                            />

                            {item.attachmentUrl ? (
                              <div className="text-sm text-muted-foreground">
                                <a href={item.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
                                  Lihat lampiran
                                </a>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="ml-2 h-auto px-2 py-1"
                                  onClick={() => {
                                    setLayananBulkTouched(true);
                                    setLayananBulkItems((prev) =>
                                      prev.map((p, i) => (i === idx ? { ...p, attachmentUrl: "" } : p)),
                                    );
                                  }}
                                >
                                  Hapus
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="lg:col-span-2 flex justify-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="lg:col-span-6">
                          <Label>Deskripsi</Label>
                          <Textarea
                            value={item.description}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, description: v } : p)));
                            }}
                            placeholder="Deskripsi singkat layanan"
                          />
                        </div>

                        <div className="lg:col-span-6">
                          <Label>Persyaratan (1 baris = 1 item)</Label>
                          <Textarea
                            value={item.persyaratanText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, persyaratanText: v } : p)));
                            }}
                            placeholder={`Fotokopi KTP\nFotokopi Kartu Keluarga`}
                          />
                        </div>

                        <div className="lg:col-span-6">
                          <Label>Alur Pelayanan (1 baris = 1 langkah)</Label>
                          <Textarea
                            value={item.alurText}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, alurText: v } : p)));
                            }}
                            placeholder={`Hubungi ketua RT/RW setempat\nJelaskan keperluan surat pengantar`}
                          />
                        </div>

                        <div className="lg:col-span-6">
                          <Label>Ajukan Sekarang</Label>
                          <Input
                            value={item.externalLink || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setLayananBulkTouched(true);
                              setLayananBulkItems((prev) => prev.map((p, i) => (i === idx ? { ...p, externalLink: v } : p)));
                            }}
                            placeholder="https://contoh-website.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-foreground">Layanan Darurat</div>
                  <div className="text-sm text-muted-foreground">Kelola nomor layanan darurat yang tampil di halaman user.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDaruratTouched(true);
                      setDaruratItems((prev) => [
                        ...prev,
                        {
                          id: undefined,
                          name: "",
                          number: "",
                          icon: "phone",
                          color: "blue",
                          note: "",
                        },
                      ]);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-2">Tambah</span>
                  </Button>
                  <Button
                    disabled={daruratSubmitDisabled || saveDaruratMutation.isPending}
                    onClick={() => {
                      setDaruratTouched(true);
                      saveDaruratMutation.mutate(daruratItems);
                    }}
                  >
                    Simpan
                  </Button>
                </div>
              </div>

              {daruratQuery.isLoading && <div className="mt-4 text-sm text-muted-foreground">Memuat layanan darurat...</div>}
              {daruratQuery.isError && <div className="mt-4 text-sm text-destructive">Gagal memuat layanan darurat</div>}

              <div className="mt-6 grid gap-4">
                {daruratItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada layanan darurat</div>
                ) : (
                  daruratItems.map((item, idx) => (
                    <div key={item.id || idx} className="rounded-xl border bg-background/40 p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                        <div className="lg:col-span-3">
                          <Label>Nama</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.map((p, i) => (i === idx ? { ...p, name: v } : p)));
                            }}
                            placeholder="Ambulans"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <Label>Nomor</Label>
                          <Input
                            value={item.number}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.map((p, i) => (i === idx ? { ...p, number: v } : p)));
                            }}
                            placeholder="118"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <Label>Ikon</Label>
                          <Select
                            value={item.icon}
                            onValueChange={(v) => {
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.map((p, i) => (i === idx ? { ...p, icon: v as DaruratIcon } : p)));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih ikon" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ambulance">Ambulance</SelectItem>
                              <SelectItem value="shield">Polisi</SelectItem>
                              <SelectItem value="fire">Damkar</SelectItem>
                              <SelectItem value="phone">Telepon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="lg:col-span-2">
                          <Label>Warna</Label>
                          <Select
                            value={item.color}
                            onValueChange={(v) => {
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.map((p, i) => (i === idx ? { ...p, color: v as DaruratColor } : p)));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih warna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="red">Merah</SelectItem>
                              <SelectItem value="blue">Biru</SelectItem>
                              <SelectItem value="orange">Oranye</SelectItem>
                              <SelectItem value="green">Hijau</SelectItem>
                              <SelectItem value="purple">Ungu</SelectItem>
                              <SelectItem value="yellow">Kuning</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="lg:col-span-2 flex justify-end">
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.filter((_, i) => i !== idx));
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="lg:col-span-10">
                          <Label>Catatan</Label>
                          <Input
                            value={item.note}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDaruratTouched(true);
                              setDaruratItems((prev) => prev.map((p, i) => (i === idx ? { ...p, note: v } : p)));
                            }}
                            placeholder="Layanan 24 Jam"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
              <DialogDescription>
                Lengkapi data berikut untuk {editing ? "memperbarui" : "menambahkan"} layanan.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="contoh: surat-keterangan"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Judul</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Judul layanan"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsi singkat layanan"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="persyaratan">Persyaratan (1 baris = 1 item)</Label>
                <Textarea
                  id="persyaratan"
                  value={form.persyaratanText}
                  onChange={(e) => setForm((f) => ({ ...f, persyaratanText: e.target.value }))}
                  placeholder={`Fotokopi KTP\nFotokopi Kartu Keluarga`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="alur">Alur Pelayanan (1 baris = 1 langkah)</Label>
                <Textarea
                  id="alur"
                  value={form.alurText}
                  onChange={(e) => setForm((f) => ({ ...f, alurText: e.target.value }))}
                  placeholder={`Hubungi ketua RT/RW setempat\nJelaskan keperluan surat pengantar`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="attachment">Lampiran (PDF/JPG)</Label>
                <Input
                  id="attachment"
                  type="file"
                  accept="application/pdf,image/jpeg"
                  disabled={!token || uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type !== "application/pdf" && file.type !== "image/jpeg") {
                      toast({
                        title: "Gagal",
                        description: "Tipe file harus PDF atau JPG",
                        variant: "destructive",
                      });
                      return;
                    }
                    void uploadAttachment(file);
                  }}
                />

                {form.attachmentUrl ? (
                  <div className="text-sm text-muted-foreground">
                    <a href={form.attachmentUrl} target="_blank" rel="noreferrer" className="underline">
                      Lihat lampiran
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      className="ml-2 h-auto px-2 py-1"
                      onClick={() => setForm((f) => ({ ...f, attachmentUrl: "" }))}
                    >
                      Hapus
                    </Button>
                  </div>
                ) : null}

                {uploading ? <div className="text-xs text-muted-foreground">Mengupload...</div> : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="externalLink">Link Website Eksternal</Label>
                <Input
                  id="externalLink"
                  value={form.externalLink}
                  onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))}
                  placeholder="https://contoh-website.com"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button
                disabled={submitDisabled || uploading || createMutation.isPending || updateMutation.isPending}
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

export default AdminLayanan;
