import { Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const newsItems = [
  {
    id: 1,
    title: "Jadwal Pelayanan Libur Tahun Baru 2026",
    excerpt: "Pemberitahuan mengenai jadwal libur dan pelayanan kantor kelurahan selama periode tahun baru.",
    date: "23 Jan 2026",
    category: "Pengumuman",
    image: "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=250&fit=crop",
  },
  {
    id: 2,
    title: "Program Vaksinasi Gratis untuk Lansia",
    excerpt: "Kelurahan Cibubur mengadakan program vaksinasi gratis untuk warga berusia 60 tahun ke atas.",
    date: "20 Jan 2026",
    category: "Kesehatan",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=250&fit=crop",
  },
  {
    id: 3,
    title: "Pelatihan UMKM Digital Marketing",
    excerpt: "Dukung UMKM lokal melalui pelatihan digital marketing gratis untuk pelaku usaha.",
    date: "18 Jan 2026",
    category: "Ekonomi",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=250&fit=crop",
  },
];

export function NewsSection() {
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
          <Button variant="outline">
            Lihat Semua Berita
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map((news, index) => (
            <Card 
              key={news.id}
              className="group overflow-hidden border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative overflow-hidden">
                <img 
                  src={news.image} 
                  alt={news.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  {news.category}
                </Badge>
              </div>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                  <Calendar className="w-4 h-4" />
                  {news.date}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {news.title}
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2">
                  {news.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
