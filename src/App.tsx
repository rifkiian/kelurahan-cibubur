import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import Index from "./pages/Index";
import Pengaduan from "./pages/Pengaduan";
import Layanan from "./pages/Layanan";
import LayananDetail from "./pages/LayananDetail";
import Berita from "./pages/Berita";
import BeritaDetail from "./pages/BeritaDetail";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPenduduk from "./pages/AdminPenduduk";
import AdminLayanan from "./pages/AdminLayanan";
import AdminPengaduan from "./pages/AdminPengaduan";
import AdminBerita from "./pages/AdminBerita";
import AdminStatistik from "./pages/AdminStatistik";
import AdminTentang from "./pages/AdminTentang";
import AdminKontak from "./pages/AdminKontak";
import AdminNotifikasi from "./pages/AdminNotifikasi";
import AdminPengaturan from "./pages/AdminPengaturan";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function FloatingUserChatbot() {
  const location = useLocation();
  const path = location.pathname;
  if (path.startsWith("/admin")) return null;
  if (path === "/login") return null;
  return <ChatbotWidget />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pengaduan" element={<Pengaduan />} />
              <Route path="/layanan" element={<Layanan />} />
              <Route path="/layanan/:slug" element={<LayananDetail />} />
              <Route path="/berita" element={<Berita />} />
              <Route path="/berita/:slug" element={<BeritaDetail />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/penduduk"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminPenduduk />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/layanan"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminLayanan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pengaduan"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminPengaduan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/berita"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminBerita />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/statistik"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminStatistik />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tentang"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminTentang />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/kontak"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminKontak />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifikasi"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminNotifikasi />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/pengaturan"
                element={
                  <ProtectedRoute requireRole="ADMIN">
                    <AdminPengaturan />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingUserChatbot />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
