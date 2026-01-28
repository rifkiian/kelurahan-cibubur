import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import jaktimLogo from "@/assets/jaktimlogo.png";
import { scrollToSection } from "@/utils/scrollToSection";

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "Pengaduan", href: "/pengaduan" },
  { label: "Layanan", href: "/layanan" },
  { label: "Berita & Agenda", href: "/berita" },
  { label: "Tentang", href: "/#tentang" },
  { label: "Kontak", href: "/#kontak" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToHash = (path: string) => {
    const targetId = path.startsWith("/#") ? path.substring(2) : path.substring(1);
    if (targetId === "") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.history.pushState(null, "", path);
      return;
    }

    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const headerOffset = 80;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
    window.history.pushState(null, "", path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
              <img src={jaktimLogo} alt="Logo Jakarta Timur" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg lg:text-xl text-foreground">Kelurahan Cibubur</span>
              <span className="text-xs text-muted-foreground hidden sm:block">Kota Administrasi Jakarta Timur</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if (!link.href.startsWith("/#")) return;

                  e.preventDefault();
                  if (location.pathname !== "/") {
                    navigate("/");
                    setTimeout(() => scrollToHash(link.href), 50);
                    return;
                  }
                  scrollToSection(e, link.href);
                }}
                className="text-muted-foreground hover:text-primary font-medium transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/admin">
              <Button variant="outline">Portal Admin</Button>
            </Link>
            <Link to="/pengaduan">
              <Button>Ajukan Pengaduan</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (!link.href.startsWith("/#")) return;

                    e.preventDefault();
                    if (location.pathname !== "/") {
                      navigate("/");
                      setTimeout(() => scrollToHash(link.href), 50);
                      return;
                    }
                    scrollToSection(e, link.href);
                  }}
                  className="px-4 py-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg font-medium transition-colors block cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Link to="/admin">
                  <Button variant="outline" className="w-full">Portal Admin</Button>
                </Link>
                <Link to="/pengaduan">
                  <Button className="w-full">Ajukan Pengaduan</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
