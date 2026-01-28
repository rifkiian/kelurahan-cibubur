import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Building, ClipboardList, CreditCard, FileText, Paperclip, Home, Users, type LucideIcon } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LayananItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  persyaratan: string[];
  attachmentUrl?: string | null;
  alur?: string[];
  externalLink?: string | null;
};

const iconMap: Record<string, LucideIcon> = {
  "surat-keterangan": FileText,
  "kartu-keluarga": Users,
  "surat-pindah": Home,
  "ktp-elektronik": CreditCard,
  "perizinan-usaha": Building,
  "legalisasi-dokumen": BadgeCheck,
};

const defaultAlurLayanan = [
  "Hubungi ketua RT/RW setempat",
  "Jelaskan keperluan surat pengantar",
  "Serahkan dokumen yang diperlukan",
  "Tunggu proses pembuatan surat",
  "Ambil surat pengantar yang sudah ditandatangani",
];

const LayananDetail = () => {
  const { slug } = useParams();
  const layananQuery = useQuery({
    queryKey: ["layanan", "public", slug],
    queryFn: async () => {
      const res = await fetch(`/api/layanan/public/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: LayananItem };
      return data.item;
    },
    enabled: Boolean(slug),
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const layanan = layananQuery.data;
  const Icon = slug ? (iconMap[slug] || FileText) : FileText;
  const attachmentUrl = layanan?.attachmentUrl?.trim() || "";
  const hasAttachment = Boolean(attachmentUrl && /\.(pdf|jpg)$/i.test(attachmentUrl));
  const alurSteps = (layanan?.alur && layanan.alur.length > 0) ? layanan.alur : defaultAlurLayanan;
  const externalLink = layanan?.externalLink?.trim() || "";
  const hasExternalLink = Boolean(externalLink);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="mb-8">
            <Button asChild variant="ghost">
              <Link to="/layanan" className="inline-flex items-center">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Layanan
              </Link>
            </Button>
          </div>

          {layananQuery.isLoading ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-6">
                <div className="text-sm text-muted-foreground">Memuat...</div>
              </CardContent>
            </Card>
          ) : layananQuery.isError ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-6">
                <div className="text-sm text-destructive">Gagal memuat layanan</div>
              </CardContent>
            </Card>
          ) : !layanan ? (
            <Card className="border-0 card-shadow">
              <CardContent className="p-6">
                <h1 className="text-2xl font-bold text-foreground">Layanan tidak ditemukan</h1>
                <p className="mt-2 text-muted-foreground">Tautan layanan tidak valid atau layanan sudah tidak tersedia.</p>
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/layanan">Lihat Semua Layanan</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-0 card-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">{layanan.title}</h1>
                        <p className="mt-2 text-muted-foreground">{layanan.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 card-shadow">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold text-foreground">Persyaratan</h2>
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        {layanan.persyaratan.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-0 card-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">Alur Layanan</h2>
                      </div>
                      <ol className="mt-4 space-y-3">
                        {alurSteps.map((step, idx) => (
                          <li key={step} className="flex items-start gap-3">
                            <div className="mt-0.5 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                </div>

                {hasAttachment ? (
                  <Card className="border-0 card-shadow mt-6">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">Lampiran</h2>
                      </div>

                      <div className="mt-4">
                        {attachmentUrl.toLowerCase().endsWith(".jpg") ? (
                          <div className="space-y-4">
                            <div className="overflow-hidden rounded-xl border bg-card">
                              <img
                                src={attachmentUrl}
                                alt={`Lampiran ${layanan.title}`}
                                className="w-full h-64 object-contain bg-muted"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <Button asChild variant="outline">
                              <a href={attachmentUrl} target="_blank" rel="noreferrer">
                                Buka Lampiran
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <Button asChild variant="outline">
                            <a href={attachmentUrl} target="_blank" rel="noreferrer">
                              Unduh / Buka PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {hasExternalLink ? (
                  <Card className="border-0 card-shadow mt-6">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-foreground">Website Alpukat Betawi</h2>
                      </div>

                      <div className="mt-4">
                        <Button asChild className="w-full">
                          <a href={externalLink} target="_blank" rel="noopener noreferrer">
                            Ajukan Pelayanan Sekarang
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div>
                <Card className="border-0 card-shadow">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-foreground">Butuh bantuan?</h2>
                    <p className="mt-2 text-muted-foreground">
                      Jika ada kendala, Anda dapat mengajukan pengaduan melalui formulir online.
                    </p>
                    <div className="mt-6">
                      <Button asChild className="w-full">
                        <Link to="/pengaduan">Ajukan Pengaduan</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LayananDetail;
