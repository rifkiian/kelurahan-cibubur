import { ArrowRight, MapPin, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollFade } from "@/components/ui/ScrollFade";
import heroBg from "@/assets/cibubur.png";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

type PublicMetrics = {
  pendudukTotal: number;
  rtAktif: number;
  rwAktif: number;
  rtRwAktif: number;
  pengaduanBulanIni: number;
};

export function HeroSection() {
  const navigate = useNavigate();

  const metricsQuery = useQuery({
    queryKey: ["site", "public", "metrics"],
    queryFn: async () => {
      const res = await fetch("/api/site/public/metrics");
      if (!res.ok) throw new Error("failed_fetch");
      return (await res.json()) as PublicMetrics;
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const pendudukTotal = metricsQuery.data?.pendudukTotal;
  const rtRwAktif = metricsQuery.data?.rtRwAktif;
  const pengaduanBulanIni = metricsQuery.data?.pengaduanBulanIni;
  const formatNumber = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-32 lg:py-40">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollFade offset={-100}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              Jakarta Timur, DKI Jakarta
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Selamat Datang di<br />
              <span className="text-primary-foreground">Kelurahan Cibubur</span>
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Melayani masyarakat dengan sepenuh hati. Portal resmi pelayanan administrasi kependudukan dan informasi wilayah Kelurahan Cibubur.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" onClick={() => navigate("/pengaduan")}>
                Ajukan Pengaduan
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="heroOutline" size="xl" onClick={() => navigate("/layanan")}>
                Lihat Layanan
              </Button>
            </div>
          </ScrollFade>
        </div>

        {/* Stats */}
        <div className="mt-16 max-w-4xl mx-auto">
          <ScrollFade offset={-50}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {typeof pendudukTotal === "number" ? formatNumber(pendudukTotal) : "-"}
                </div>
                <div className="text-muted-foreground text-sm">Total Penduduk</div>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {typeof pengaduanBulanIni === "number" ? formatNumber(pengaduanBulanIni) : "-"}
                </div>
                <div className="text-muted-foreground text-sm">Pengaduan Bulan Ini</div>
              </div>
              <div className="glass-card rounded-2xl p-6 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-3xl font-bold text-foreground mb-1">
                  {typeof rtRwAktif === "number" ? formatNumber(rtRwAktif) : "-"}
                </div>
                <div className="text-muted-foreground text-sm">RT/RW Aktif</div>
              </div>
            </div>
          </ScrollFade>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-2.5 rounded-full bg-primary-foreground/50" />
        </div>
      </div>
    </section>
  );
}
