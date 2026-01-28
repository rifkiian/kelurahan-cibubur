import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";

type PublicBeritaDetail = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
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

const BeritaDetail = () => {
  const { slug } = useParams();
  const fallbackSrc = "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=1200&h=600&fit=crop";

  const beritaQuery = useQuery({
    queryKey: ["berita-public", "detail", slug],
    queryFn: async () => {
      const res = await fetch(`/api/berita/public/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: PublicBeritaDetail };
      return data.item;
    },
    enabled: Boolean(slug),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="mb-6">
            <Link to="/berita">
              <Button variant="outline">Kembali</Button>
            </Link>
          </div>

          {beritaQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat...</div>}
          {beritaQuery.isError && <div className="text-sm text-destructive">Gagal memuat berita</div>}

          {beritaQuery.data === null && (
            <div className="text-sm text-muted-foreground">Berita tidak ditemukan atau belum dipublish.</div>
          )}

          {beritaQuery.data && (
            <article className="max-w-3xl">
              <div className="overflow-hidden rounded-xl border bg-card">
                <img
                  src={
                    beritaQuery.data.coverImageUrl ||
                    fallbackSrc
                  }
                  alt={beritaQuery.data.title}
                  className="w-full h-64 md:h-80 object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackSrc;
                  }}
                />
              </div>

              <div className="mt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  {formatDate(beritaQuery.data.publishedAt || beritaQuery.data.createdAt)}
                </div>

                <h1 className="mt-3 text-3xl lg:text-4xl font-bold text-foreground">{beritaQuery.data.title}</h1>

                {beritaQuery.data.excerpt && (
                  <p className="mt-4 text-muted-foreground">{beritaQuery.data.excerpt}</p>
                )}

                <div className="mt-6 text-foreground whitespace-pre-line leading-relaxed">{beritaQuery.data.content}</div>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BeritaDetail;
