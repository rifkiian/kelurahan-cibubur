import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

const AdminPengaturan = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { token } = useAuth();

  const headers = useMemo(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Unauthorized");
      if (!oldPassword || !newPassword) throw new Error("Lengkapi semua field");
      if (newPassword.length < 6) throw new Error("Password baru minimal 6 karakter");
      if (newPassword !== confirmPassword) throw new Error("Konfirmasi password tidak sama");

      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers,
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message || "Gagal mengubah password");
      }
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Password berhasil diubah." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e) => {
      toast({
        title: "Gagal",
        description: e instanceof Error ? e.message : "Gagal mengubah password",
        variant: "destructive",
      });
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
            <p className="text-muted-foreground text-sm">Konfigurasi aplikasi</p>
          </div>
        </header>

        <div className="p-6">
          <Card className="border-0 card-shadow">
            <CardContent className="p-6">
              <div className="text-lg font-bold text-foreground">Ubah Password</div>
              <div className="mt-1 text-sm text-muted-foreground">Ganti password akun yang sedang login</div>

              <div className="mt-6 grid gap-5 max-w-xl">
                <div className="grid gap-2">
                  <Label htmlFor="oldPassword">Password Lama</Label>
                  <Input
                    id="oldPassword"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    disabled={!token || changePasswordMutation.isPending}
                    onClick={() => changePasswordMutation.mutate()}
                  >
                    Simpan
                  </Button>
                  {!token ? <div className="text-sm text-muted-foreground">Silakan login admin.</div> : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPengaturan;
