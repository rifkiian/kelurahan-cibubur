import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import jaktimLogo from "@/assets/jaktimlogo.png";

type LayananItem = {
  id: string;
  slug: string;
  title: string;
};

const quickLinks = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "/layanan" },
  { label: "Berita", href: "/#berita" },
  { label: "Tentang Kami", href: "/#tentang" },
  { label: "Portal Admin", href: "/admin" },
];

export function Footer() {
  const layananQuery = useQuery({
    queryKey: ["layanan", "public", "footer"],
    queryFn: async () => {
      const res = await fetch("/api/layanan/public?limit=6");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: LayananItem[] };
      return data.items;
    },
  });

  const layananItems = layananQuery.data || [];

  return (
    <footer id="kontak" className="bg-sidebar text-sidebar-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                <img src={jaktimLogo} alt="Logo Jakarta Timur" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="font-bold text-lg">Kelurahan Cibubur</div>
                <div className="text-sm text-sidebar-foreground/70">Jakarta Timur</div>
              </div>
            </div>
            <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
              Melayani masyarakat dengan sepenuh hati. Portal resmi administrasi kependudukan Kelurahan Cibubur.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://www.facebook.com/pages/Kelurahan-Cibubur/123775357696469" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/kel.cibubur/?hl=id" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://x.com/kel_cibubur" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center hover:bg-sidebar-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-6">Tautan Cepat</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-lg mb-6">Layanan</h4>
            <ul className="space-y-3">
              {layananItems.map((service) => (
                <li key={service.slug}>
                  <Link 
                    to={`/layanan/${service.slug}`}
                    className="text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-sm"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-lg mb-6">Kontak</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-5 h-5 text-sidebar-primary shrink-0 mt-0.5" />
                <span className="text-sidebar-foreground/70">
                  Jl. Raya Cibubur No. 123, Kelurahan Cibubur, Jakarta Timur 13720
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-sidebar-primary shrink-0" />
                <span className="text-sidebar-foreground/70">(021) 8765-4321</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-sidebar-primary shrink-0" />
                <span className="text-sidebar-foreground/70">kelurahan.cibubur@jakarta.go.id</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-sidebar-primary shrink-0" />
                <span className="text-sidebar-foreground/70">Senin - Jumat: 08:00 - 16:00</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-sidebar-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sidebar-foreground/60 text-sm">
            © 2026 Kelurahan Cibubur. Hak Cipta Dilindungi.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
              Kebijakan Privasi
            </a>
            <a href="#" className="text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors">
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
