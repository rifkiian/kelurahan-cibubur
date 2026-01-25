import { FileText, Users, Home, CreditCard, Building, BadgeCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: FileText,
    title: "Surat Keterangan",
    description: "Pengurusan berbagai surat keterangan seperti SKCK, domisili, dan lainnya.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Users,
    title: "Kartu Keluarga",
    description: "Pembuatan dan perubahan data Kartu Keluarga baru maupun update.",
    color: "bg-secondary/20 text-secondary",
  },
  {
    icon: Home,
    title: "Surat Pindah",
    description: "Pengurusan surat pindah masuk dan keluar wilayah kelurahan.",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: CreditCard,
    title: "KTP Elektronik",
    description: "Layanan pembuatan e-KTP baru dan penggantian karena hilang/rusak.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Building,
    title: "Perizinan Usaha",
    description: "Rekomendasi dan pengurusan izin usaha tingkat kelurahan.",
    color: "bg-secondary/20 text-secondary",
  },
  {
    icon: BadgeCheck,
    title: "Legalisasi Dokumen",
    description: "Layanan legalisasi dan pengesahan dokumen resmi.",
    color: "bg-accent/20 text-accent-foreground",
  },
];

export function ServicesSection() {
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
          {services.map((service, index) => (
            <Card 
              key={service.title}
              className="group border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <div className="flex items-center text-primary font-semibold text-sm group-hover:gap-2 transition-all">
                  Selengkapnya
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button size="lg">
            Lihat Semua Layanan
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
