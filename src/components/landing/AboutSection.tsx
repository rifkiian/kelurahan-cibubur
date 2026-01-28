import cibuburImage from "@/assets/cibubur.png";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tentang = {
  id: number;
  intro: string;
  visi: string;
  misi: string;
};

type OrganisasiItem = {
  id: string;
  name: string;
  jabatan: string;
  description: string;
};

export function AboutSection() {
  const tentangQuery = useQuery({
    queryKey: ["site", "tentang", "public"],
    queryFn: async () => {
      const res = await fetch("/api/site/public/tentang");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: Tentang };
      return data.item;
    },
  });

  const organisasiQuery = useQuery({
    queryKey: ["site", "organisasi", "public"],
    queryFn: async () => {
      const res = await fetch("/api/site/public/organisasi");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: OrganisasiItem[] };
      return data.items;
    },
  });

  const intro = tentangQuery.data?.intro ||
    "Kelurahan Cibubur merupakan salah satu kelurahan di Kecamatan Ciracas, Kota Administrasi Jakarta Timur, DKI Jakarta. Dengan luas wilayah yang strategis, kami berkomitmen untuk memberikan pelayanan terbaik bagi seluruh warga Cibubur.";
  const visi = tentangQuery.data?.visi ||
    "\"Terwujudnya Kelurahan Cibubur yang mandiri, sejahtera, dan berbudaya dengan didukung oleh masyarakat yang berakhlak mulia dan berdaya saing.\"";
  const misiLines = (tentangQuery.data?.misi ||
    "Meningkatkan kualitas pelayanan publik yang prima dan berkeadilan\nMeningkatkan kesejahteraan masyarakat melalui program pemberdayaan\nMenjaga keamanan, ketertiban, dan ketentraman masyarakat\nMeningkatkan partisipasi masyarakat dalam pembangunan\nMelestarikan nilai-nilai budaya dan kearifan lokal")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const organisasiItems = (organisasiQuery.data || [])
    .map((i) => ({
      id: i.id,
      name: i.name?.trim() || "",
      jabatan: i.jabatan?.trim() || "",
      description: i.description?.trim() || "",
    }))
    .filter((i) => i.name && i.jabatan);

  return (
    <section id="tentang" className="py-16 md:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Image */}
          <div className="w-full lg:w-1/2">
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <img 
                src={cibuburImage} 
                alt="Kelurahan Cibubur"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="w-full lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Tentang Kelurahan <span className="text-primary">Cibubur</span>
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              {intro}
            </p>

            {organisasiItems.length > 0 ? (
              <div className="mb-8">
                <Button
                  size="lg"
                  onClick={() => {
                    const targetElement = document.getElementById("struktur-organisasi");
                    if (!targetElement) return;

                    const headerOffset = 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                    window.history.pushState(null, "", "/#struktur-organisasi");
                  }}
                >
                  Struktur Organisasi
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            ) : null}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                  <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
                  Visi
                </h3>
                <p className="text-muted-foreground pl-5">
                  {visi}
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
                  <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
                  Misi
                </h3>
                <ul className="space-y-2 pl-5 text-muted-foreground">
                  {misiLines.map((m, idx) => (
                    <li className="flex items-start" key={idx}>
                      <span className="text-primary mr-2">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {organisasiItems.length > 0 ? (
          <div id="struktur-organisasi" className="mt-14 scroll-mt-20">
            <div className="text-center max-w-2xl mx-auto">
              <div className="h-1 w-12 rounded-full bg-primary mx-auto mb-4" />
              <h3 className="text-3xl lg:text-4xl font-bold text-foreground">Struktur Organisasi</h3>
              <p className="mt-3 text-muted-foreground">Perangkat kelurahan yang siap melayani kebutuhan masyarakat</p>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {organisasiItems.map((person) => (
                <div
                  key={person.id}
                  className="rounded-2xl bg-card border-0 card-shadow hover:card-shadow-hover transition-all duration-300"
                >
                  <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <Users className="w-7 h-7" />
                    </div>
                    <div className="mt-4 font-semibold text-foreground">{person.name}</div>
                    <div className="mt-1 text-sm font-semibold text-primary">{person.jabatan}</div>
                    {person.description ? (
                      <div className="mt-3 text-sm text-muted-foreground leading-relaxed">{person.description}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
