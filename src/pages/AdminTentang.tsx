import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

type Tentang = {
  id: number;
  intro: string;
  visi: string;
  misi: string;
};

type OrganisasiItem = {
  id: string;
  name: string;
  jabatan: string;
  description: string;
};

const AdminTentang = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const tentangQuery = useQuery({
    queryKey: ["site", "tentang"],
    queryFn: async () => {
      const res = await fetch("/api/site/tentang", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: Tentang };
      return data.item;
    },
    enabled: Boolean(token),
  });

  const organisasiQuery = useQuery({
    queryKey: ["site", "organisasi"],
    queryFn: async () => {
      const res = await fetch("/api/site/organisasi", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: OrganisasiItem[] };
      return data.items;
    },
    enabled: Boolean(token),
  });

  const [form, setForm] = useState({ intro: "", visi: "", misi: "" });
  const [orgItems, setOrgItems] = useState<OrganisasiItem[]>([]);
  const [touchedTentang, setTouchedTentang] = useState(false);
  const [touchedOrg, setTouchedOrg] = useState(false);

  useEffect(() => {
    if (!tentangQuery.data) return;
    if (touchedTentang) return;
    setForm({
      intro: tentangQuery.data.intro || "",
      visi: tentangQuery.data.visi || "",
      misi: tentangQuery.data.misi || "",
    });
  }, [tentangQuery.data, touchedTentang]);

  useEffect(() => {
    if (!organisasiQuery.data) return;
    if (touchedOrg) return;
    setOrgItems(
      (organisasiQuery.data || []).map((i) => ({
        id: i.id,
        name: i.name || "",
        jabatan: i.jabatan || "",
        description: i.description || "",
      })),
    );
  }, [organisasiQuery.data, touchedOrg]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const normalizedOrgItems = orgItems.map((i) => ({
        ...i,
        name: i.name.trim(),
        jabatan: i.jabatan.trim(),
        description: i.description.trim(),
      }));

      const hasPartial = normalizedOrgItems.some((i) => Boolean(i.name || i.jabatan || i.description));
      const hasInvalid = normalizedOrgItems.some((i) => {
        if (!(i.name || i.jabatan || i.description)) return false;
        return !(i.name && i.jabatan && i.description);
      });

      if (hasPartial && hasInvalid) {
        throw new Error("Lengkapi Struktur Organisasi: Nama, Jabatan, dan Deskripsi wajib diisi.");
      }

      const resTentang = await fetch("/api/site/tentang", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          intro: form.intro,
          visi: form.visi,
          misi: form.misi,
        }),
      });

      if (!resTentang.ok) {
        const data = (await resTentang.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_save");
      }

      const resOrg = await fetch("/api/site/organisasi", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          items: normalizedOrgItems
            .filter((i) => Boolean(i.name && i.jabatan && i.description))
            .map((i) => ({
            id: i.id,
            name: i.name,
            jabatan: i.jabatan,
            description: i.description,
          })),
        }),
      });

      if (!resOrg.ok) {
        const data = (await resOrg.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_save");
      }
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Konten Tentang diperbarui." });
    },
    onError: (e) => {
      toast({ title: "Gagal", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <main className={cn("transition-all duration-300 min-h-screen", sidebarCollapsed ? "ml-20" : "ml-64")}>
        <header className="sticky top-0 z-40 glass-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tentang</h1>
              <p className="text-muted-foreground text-sm">Perbarui konten halaman Tentang di user</p>
            </div>
            <Button disabled={!token || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Simpan
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6 space-y-6">
            {tentangQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {tentangQuery.isError && <div className="text-sm text-destructive">Gagal memuat data</div>}

            <div className="grid gap-2">
              <Label htmlFor="intro">Intro</Label>
              <Textarea
                id="intro"
                rows={5}
                value={form.intro}
                onChange={(e) => {
                  setTouchedTentang(true);
                  setForm((f) => ({ ...f, intro: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visi">Visi</Label>
              <Textarea
                id="visi"
                rows={4}
                value={form.visi}
                onChange={(e) => {
                  setTouchedTentang(true);
                  setForm((f) => ({ ...f, visi: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="misi">Misi (pisahkan tiap poin dengan baris baru)</Label>
              <Textarea
                id="misi"
                rows={8}
                value={form.misi}
                onChange={(e) => {
                  setTouchedTentang(true);
                  setForm((f) => ({ ...f, misi: e.target.value }));
                }}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Struktur Organisasi</h2>
                  <p className="text-xs text-muted-foreground">Isi nama, jabatan, dan deskripsi singkat</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTouchedOrg(true);
                    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}`;
                    setOrgItems((items) => [...items, { id, name: "", jabatan: "", description: "" }]);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Tambah
                </Button>
              </div>

              {organisasiQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat struktur...</div>}
              {organisasiQuery.isError && <div className="text-sm text-destructive">Gagal memuat struktur</div>}
              {!organisasiQuery.isLoading && orgItems.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada data struktur organisasi</div>
              ) : null}

              <div className="space-y-4">
                {orgItems.map((item) => (
                  <div key={item.id} className="rounded-xl border bg-background p-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-2 flex-1">
                        <Label htmlFor={`org-name-${item.id}`}>Nama</Label>
                        <Input
                          id={`org-name-${item.id}`}
                          value={item.name}
                          onChange={(e) => {
                            setTouchedOrg(true);
                            const v = e.target.value;
                            setOrgItems((items) => items.map((x) => (x.id === item.id ? { ...x, name: v } : x)));
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTouchedOrg(true);
                          setOrgItems((items) => items.filter((x) => x.id !== item.id));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`org-jabatan-${item.id}`}>Jabatan</Label>
                      <Input
                        id={`org-jabatan-${item.id}`}
                        value={item.jabatan}
                        onChange={(e) => {
                          setTouchedOrg(true);
                          const v = e.target.value;
                          setOrgItems((items) => items.map((x) => (x.id === item.id ? { ...x, jabatan: v } : x)));
                        }}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor={`org-desc-${item.id}`}>Deskripsi</Label>
                      <Textarea
                        id={`org-desc-${item.id}`}
                        rows={3}
                        value={item.description}
                        onChange={(e) => {
                          setTouchedOrg(true);
                          const v = e.target.value;
                          setOrgItems((items) => items.map((x) => (x.id === item.id ? { ...x, description: v } : x)));
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTentang;
