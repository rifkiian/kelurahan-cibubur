import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building, CreditCard, FileText, Home, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type LayananItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
};

const iconMap: Record<string, LucideIcon> = {
  "surat-keterangan": FileText,
  "kartu-keluarga": Users,
  "surat-pindah": Home,
  "ktp-elektronik": CreditCard,
  "perizinan-usaha": Building,
  "legalisasi-dokumen": BadgeCheck,
};

export function ServicesSection() {
  const layananQuery = useQuery({
    queryKey: ["layanan", "public", "landing"],
    queryFn: async () => {
      const res = await fetch("/api/layanan/public?limit=6");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: LayananItem[] };
      return data.items;
    },
  });

  const items = layananQuery.data || [];

  return (
    <section id="layanan" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Layanan Kami
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Pelayanan Administrasi Terpadu
          </h2>
          <p className="text-muted-foreground text-lg">
            Berbagai layanan administrasi kependudukan yang dapat Anda akses dengan mudah dan cepat.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layananQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat layanan...</div>}
          {layananQuery.isError && <div className="text-sm text-muted-foreground">Layanan belum tersedia</div>}

          {items.map((service, index) => {
            const Icon = iconMap[service.slug] || FileText;
            return (
            <Link
              key={service.slug}
              to={`/layanan/${service.slug}`}
              className="block"
              aria-label={`Buka layanan ${service.title}`}
            >
              <Card 
                className="group border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground mb-4">{service.description}</p>
                  <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                    Selengkapnya
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link to="/layanan">
              Lihat Semua Layanan
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
