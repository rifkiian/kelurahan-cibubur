import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

type Kontak = {
  id: number;
  address: string;
  phones: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;
};

const AdminKontak = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const kontakQuery = useQuery({
    queryKey: ["site", "kontak"],
    queryFn: async () => {
      const res = await fetch("/api/site/kontak", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: Kontak };
      return data.item;
    },
    enabled: Boolean(token),
  });

  const [form, setForm] = useState({ address: "", phones: "", email: "", hours: "", mapEmbedUrl: "" });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!kontakQuery.data) return;
    if (touched) return;
    setForm({
      address: kontakQuery.data.address || "",
      phones: kontakQuery.data.phones || "",
      email: kontakQuery.data.email || "",
      hours: kontakQuery.data.hours || "",
      mapEmbedUrl: kontakQuery.data.mapEmbedUrl || "",
    });
  }, [kontakQuery.data, touched]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/site/kontak", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          address: form.address,
          phones: form.phones,
          email: form.email,
          hours: form.hours,
          mapEmbedUrl: form.mapEmbedUrl,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "failed_save");
      }
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Konten Kontak diperbarui." });
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
              <h1 className="text-2xl font-bold text-foreground">Kontak</h1>
              <p className="text-muted-foreground text-sm">Perbarui konten halaman Kontak di user</p>
            </div>
            <Button disabled={!token || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Simpan
            </Button>
          </div>
        </header>

        <div className="p-6">
          <div className="glass-card p-6 space-y-6">
            {kontakQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
            {kontakQuery.isError && <div className="text-sm text-destructive">Gagal memuat data</div>}

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat (pisahkan baris dengan Enter)</Label>
              <Textarea
                id="address"
                rows={5}
                value={form.address}
                onChange={(e) => {
                  setTouched(true);
                  setForm((f) => ({ ...f, address: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phones">Telepon (pisahkan baris dengan Enter)</Label>
              <Textarea
                id="phones"
                rows={4}
                value={form.phones}
                onChange={(e) => {
                  setTouched(true);
                  setForm((f) => ({ ...f, phones: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => {
                  setTouched(true);
                  setForm((f) => ({ ...f, email: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hours">Jam Operasional (pisahkan baris dengan Enter)</Label>
              <Textarea
                id="hours"
                rows={4}
                value={form.hours}
                onChange={(e) => {
                  setTouched(true);
                  setForm((f) => ({ ...f, hours: e.target.value }));
                }}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mapEmbedUrl">Google Maps Embed URL</Label>
              <Textarea
                id="mapEmbedUrl"
                rows={3}
                value={form.mapEmbedUrl}
                onChange={(e) => {
                  setTouched(true);
                  setForm((f) => ({ ...f, mapEmbedUrl: e.target.value }));
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminKontak;
