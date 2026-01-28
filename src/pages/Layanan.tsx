import { Link } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Ambulance,
  BadgeCheck,
  Building,
  ChevronRight,
  Clock,
  CreditCard,
  FireExtinguisher,
  FileText,
  Home,
  PhoneCall,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";

type LayananItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  persyaratan: string[];
  attachmentUrl?: string | null;
};

type DaruratIcon = "ambulance" | "shield" | "fire" | "phone";
type DaruratColor = "red" | "blue" | "orange" | "green" | "purple" | "yellow";

type DaruratItem = {
  id: string;
  name: string;
  number: string;
  icon: DaruratIcon;
  color: DaruratColor;
  note: string;
};

const iconMap: Record<string, LucideIcon> = {
  "surat-keterangan": FileText,
  "kartu-keluarga": Users,
  "surat-pindah": Home,
  "ktp-elektronik": CreditCard,
  "perizinan-usaha": Building,
  "legalisasi-dokumen": BadgeCheck,
};

const emergencyContactsFallback: Array<{
  id: string;
  name: string;
  number: string;
  icon: LucideIcon;
  color: string;
  note: string;
}> = [
  {
    id: "ambulans",
    name: "Ambulans",
    number: "118",
    icon: Ambulance,
    color: "bg-red-500/10 text-red-600",
    note: "Layanan 24 Jam",
  },
  {
    id: "polisi",
    name: "Polisi",
    number: "110",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-600",
    note: "Layanan 24 Jam",
  },
  {
    id: "damkar",
    name: "Pemadam Kebakaran",
    number: "113",
    icon: FireExtinguisher,
    color: "bg-orange-500/10 text-orange-600",
    note: "Layanan 24 Jam",
  },
  {
    id: "puskesmas",
    name: "Puskesmas Cibubur",
    number: "(021) 8459 9999",
    icon: PhoneCall,
    color: "bg-green-500/10 text-green-600",
    note: "Buka 24 Jam",
  },
  {
    id: "pos-kamling",
    name: "Pos Kamling RW 01–10",
    number: "(021) 8459 8888",
    icon: PhoneCall,
    color: "bg-purple-500/10 text-purple-600",
    note: "Buka 24 Jam",
  },
  {
    id: "pengaduan",
    name: "Layanan Pengaduan 24 Jam",
    number: "1500-123",
    icon: PhoneCall,
    color: "bg-yellow-500/10 text-yellow-700",
    note: "Layanan Pengaduan",
  },
];

const daruratIconMap: Record<DaruratIcon, LucideIcon> = {
  ambulance: Ambulance,
  shield: Shield,
  fire: FireExtinguisher,
  phone: PhoneCall,
};

const daruratColorMap: Record<DaruratColor, string> = {
  red: "bg-red-500/10 text-red-600",
  blue: "bg-blue-500/10 text-blue-600",
  orange: "bg-orange-500/10 text-orange-600",
  green: "bg-green-500/10 text-green-600",
  purple: "bg-purple-500/10 text-purple-600",
  yellow: "bg-yellow-500/10 text-yellow-700",
};

const Layanan = () => {
  const layananQuery = useQuery({
    queryKey: ["layanan", "public"],
    queryFn: async () => {
      const data = await apiFetch("/api/layanan/public");
      return data.items as LayananItem[];
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const daruratQuery = useQuery({
    queryKey: ["site", "darurat", "public"],
    queryFn: async () => {
      const res = await fetch("/api/site/public/darurat");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: DaruratItem[] };
      return data.items;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
    retry: 1,
  });

  const items = layananQuery.data || [];
  const emergencyContacts = daruratQuery.data
    ? daruratQuery.data.map((i) => ({
        id: i.id,
        name: i.name,
        number: i.number,
        icon: daruratIconMap[i.icon] || PhoneCall,
        color: daruratColorMap[i.color] || "bg-blue-500/10 text-blue-600",
        note: i.note,
      }))
    : emergencyContactsFallback;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border bg-muted/30 px-6 py-10 lg:px-10 lg:py-14">
              <div className="max-w-2xl">
                <div className="h-1 w-10 rounded-full bg-primary mb-5" />
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground">Layanan Kelurahan</h1>
                <p className="mt-4 text-muted-foreground">
                  Informasi lengkap mengenai layanan administratif yang tersedia beserta persyaratan dan alur pelayanan.
                </p>
              </div>

              <div className="mt-8">
                <Card className="border bg-background/60">
                  <CardContent className="p-4 lg:p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-primary">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Jam Pelayanan:</span> Senin - Jumat, 08:00 - 16:00 WIB.
                        Pastikan dokumen lengkap sebelum datang ke kantor.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-10 lg:mt-12">
              {layananQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat layanan...</div>}
              {layananQuery.isError && <div className="text-sm text-destructive">Gagal memuat layanan</div>}

              {layananQuery.data && items.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada layanan</div>
              ) : null}

              <div className="mt-6 space-y-5">
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
                        className="group border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer animate-fade-up"
                        style={{ animationDelay: `${index * 0.06}s` }}
                      >
                        <CardContent className="p-5 lg:p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <Icon className="w-6 h-6" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h3 className="text-lg lg:text-xl font-bold text-foreground truncate">
                                    {service.title}
                                  </h3>
                                  <p className="mt-1 text-sm lg:text-base text-muted-foreground line-clamp-2">
                                    {service.description}
                                  </p>
                                </div>

                                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                                  <ChevronRight className="w-5 h-5" />
                                </div>
                              </div>

                              <div className="mt-3 text-xs text-muted-foreground">
                                Klik untuk melihat persyaratan
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              <section className="mt-14 lg:mt-16">
                <div className="text-center">
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Layanan Darurat</h2>
                  <p className="mt-2 text-muted-foreground">
                    Nomor penting yang dapat dihubungi dalam keadaan darurat
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {emergencyContacts.map((contact) => {
                    const Icon = contact.icon;
                    const tel = contact.number.replace(/\D/g, "");

                    return (
                      <Card
                        key={contact.id}
                        className="border bg-background/60 hover:card-shadow transition-shadow duration-200"
                      >
                        <CardContent className="p-6 flex items-start gap-4">
                          <div className={`p-3 rounded-full ${contact.color} shrink-0`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-base lg:text-lg text-foreground">
                              {contact.name}
                            </h3>
                            <a
                              href={tel ? `tel:${tel}` : undefined}
                              className="mt-1 inline-flex items-center gap-2 font-semibold text-primary hover:opacity-90"
                            >
                              <PhoneCall className="h-4 w-4" />
                              <span className="text-base">{contact.number}</span>
                            </a>
                            <p className="mt-2 text-sm text-muted-foreground">{contact.note}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-10 rounded-xl border bg-muted/30 p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Penting!</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Gunakan nomor darurat ini dengan bijak. Hubungi hanya dalam keadaan darurat yang sesungguhnya.
                        Penyalahgunaan dapat menghambat penanganan kasus yang benar-benar membutuhkan pertolongan.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layanan;
