import { useQuery } from "@tanstack/react-query";
import { Bell, Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PublicBerita = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
};

type PublicAgenda = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
};

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const formatTime = (iso: string | null | undefined) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
};

const Berita = () => {
  const agendaQuery = useQuery({
    queryKey: ["agenda-public", "upcoming"],
    queryFn: async () => {
      const res = await fetch("/api/agenda/public?limit=6");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: PublicAgenda[] };
      return data.items;
    },
  });

  const beritaQuery = useQuery({
    queryKey: ["berita-public", "all"],
    queryFn: async () => {
      const res = await fetch("/api/berita/public");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: PublicBerita[] };
      return data.items;
    },
  });

  const items = beritaQuery.data || [];
  const agendaItems = agendaQuery.data || [];
  const fallbackSrc = "https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=400&h=250&fit=crop";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-2xl border bg-muted/30 px-6 py-10 lg:px-10 lg:py-14">
              <div className="max-w-2xl">
                <div className="h-1 w-10 rounded-full bg-primary mb-5" />
                <h1 className="text-3xl lg:text-5xl font-bold text-foreground">Berita & Agenda</h1>
                <p className="mt-4 text-muted-foreground">
                  Informasi terkini mengenai kegiatan, pengumuman, dan agenda Kelurahan Cibubur.
                </p>
              </div>
            </div>

            <div className="mt-8 lg:mt-10">
              <Tabs defaultValue="agenda">
                <TabsList className="gap-1">
                  <TabsTrigger value="berita" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Berita
                  </TabsTrigger>
                  <TabsTrigger value="agenda" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    Agenda
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="agenda" className="mt-6">
                  {agendaQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat agenda...</div>}
                  {agendaQuery.isError && <div className="text-sm text-destructive">Gagal memuat agenda</div>}

                  {agendaQuery.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {agendaItems.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Belum ada agenda</div>
                      ) : (
                        agendaItems.map((a, index) => {
                          const start = new Date(a.startAt);
                          const isValid = !Number.isNaN(start.getTime());
                          const day = isValid ? String(start.getDate()) : "-";
                          const month = isValid
                            ? start.toLocaleString("id-ID", { month: "short" })
                            : "-";
                          const year = isValid ? String(start.getFullYear()) : "-";

                          return (
                            <Card
                              key={a.id}
                              className="group overflow-hidden border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 animate-fade-up"
                              style={{ animationDelay: `${index * 0.06}s` }}
                            >
                              <div className="h-44 w-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/45 to-background" />
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
                                <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-6">
                                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 text-white/90 px-3 py-1 text-xs font-semibold backdrop-blur-sm ring-1 ring-white/15">
                                    <Calendar className="w-4 h-4" />
                                    Tanggal Agenda
                                  </div>

                                  <div className="mt-4 flex items-end justify-center gap-3">
                                    <div className="text-6xl font-extrabold tracking-tight text-white drop-shadow-sm leading-none">
                                      {day}
                                    </div>
                                    <div className="pb-1 text-left">
                                      <div className="text-sm font-bold uppercase tracking-[0.2em] text-white/95">
                                        {month}
                                      </div>
                                      <div className="text-sm font-semibold text-white/70">{year}</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <CardContent className="p-6">
                                <Badge className="bg-primary/10 text-primary">Agenda</Badge>

                                <h3 className="mt-3 text-lg font-bold text-foreground line-clamp-2">{a.title}</h3>

                                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(a.startAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {formatTime(a.startAt)}
                                      {a.endAt ? ` - ${formatTime(a.endAt)}` : ""}
                                      WIB
                                    </span>
                                  </div>
                                  {a.location && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4" />
                                      <span className="line-clamp-1">{a.location}</span>
                                    </div>
                                  )}
                                </div>

                                {a.description ? (
                                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{a.description}</p>
                                ) : null}

                                <div className="mt-5">
                                  <Button type="button" variant="outline" className="w-full" disabled>
                                    Lihat Detail
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="berita" className="mt-6">
                  {beritaQuery.isLoading && <div className="text-sm text-muted-foreground">Memuat berita...</div>}
                  {beritaQuery.isError && <div className="text-sm text-destructive">Gagal memuat berita</div>}

                  {beritaQuery.data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.length === 0 ? (
                        <div className="text-sm text-muted-foreground">Belum ada berita</div>
                      ) : (
                        items.map((news, index) => (
                          <Link to={`/berita/${news.slug}`} key={news.id} className="block">
                            <Card
                              className="group overflow-hidden border-0 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-0.5 cursor-pointer animate-fade-up"
                              style={{ animationDelay: `${index * 0.06}s` }}
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
                                    <h3 className="text-xl font-bold text-white line-clamp-2">
                                      {news.title}
                                    </h3>
                                    <div className="mt-2 flex items-center gap-2 text-white/90 text-sm">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(news.publishedAt || news.createdAt)}
                                    </div>
                                    <p className="mt-3 text-white/90 text-sm leading-relaxed line-clamp-3">
                                      {news.excerpt || "-"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <CardContent className="p-5">
                                <Button variant="outline" className="w-full" type="button">
                                  Lihat Detail
                                </Button>
                              </CardContent>
                            </Card>
                          </Link>
                        ))
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Berita;
