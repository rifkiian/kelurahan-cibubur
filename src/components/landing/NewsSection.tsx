import { Calendar, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PublicBerita = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

export function NewsSection() {
  const beritaQuery = useQuery({
    queryKey: ["berita-public", "latest"],
    queryFn: async () => {
      const res = await fetch("/api/berita/public?limit=3");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: PublicBerita[] };
      return data.items;
    },
  });

  const items = beritaQuery.data || [];
  const fallbackSrc = "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=250&fit=crop";

  return (
    <section id="berita" className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Berita Terkini
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Informasi & Pengumuman
            </h2>
          </div>
          <Link to="/berita">
            <Button variant="outline">
              Lihat Berita & Agenda
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {beritaQuery.isLoading && (
            <div className="text-sm text-muted-foreground">Memuat berita...</div>
          )}

          {beritaQuery.isError && (
            <div className="text-sm text-destructive">Gagal memuat berita</div>
          )}

          {items.map((news, index) => (
            <Link to={`/berita/${news.slug}`} key={news.id} className="block">
              <Card
                className="group overflow-hidden border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={news.coverImageUrl || fallbackSrc}
                    alt={news.title}
                    className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackSrc;
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/55" />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">Berita</Badge>

                  <div className="absolute inset-0 flex items-end p-6">
                    <div className="w-full opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Calendar className="w-4 h-4" />
                        {formatDate(news.publishedAt || news.createdAt)}
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-white line-clamp-2">{news.title}</h3>
                      <p className="mt-3 text-white/90 text-sm leading-relaxed line-clamp-3">
                        {news.excerpt || "-"}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-5" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
