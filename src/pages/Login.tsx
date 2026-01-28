import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthProvider";
import jaktimLogo from "@/assets/jaktimlogo.png";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from || "/admin";

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="hidden lg:flex flex-col justify-between rounded-2xl border bg-white/40 backdrop-blur-xl p-8 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                  <img src={jaktimLogo} alt="Logo Jakarta Timur" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-lg font-bold text-foreground">Kelurahan Cibubur</div>
                  <div className="text-sm text-muted-foreground">Kota Administrasi Jakarta Timur</div>
                </div>
              </div>
              <div className="mt-10">
                <div className="text-3xl font-bold tracking-tight text-foreground">Portal Admin</div>
                <div className="mt-2 text-muted-foreground">
                  Masuk untuk mengelola layanan, pengaduan, dan informasi wilayah.
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">© 2026 Kelurahan Cibubur</div>
          </div>

          <Card className="w-full rounded-2xl border bg-white/70 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3 lg:hidden">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                  <img src={jaktimLogo} alt="Logo Jakarta Timur" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Kelurahan Cibubur</div>
                  <div className="text-xs text-muted-foreground">Jakarta Timur</div>
                </div>
              </div>
              <CardTitle className="mt-2">Login Admin</CardTitle>
              <CardDescription>Masuk untuk mengakses portal admin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSubmitting(true);
                  setError(null);
                  try {
                    await login(email, password);
                    navigate(from, { replace: true });
                  } catch {
                    setError("Email atau password salah");
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                </div>
                {error && <div className="text-sm text-destructive">{error}</div>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  Masuk
                </Button>
                <div className="text-sm text-muted-foreground text-center">
                  <Link to="/" className="hover:underline">Kembali ke Beranda</Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
