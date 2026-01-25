import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "Layanan", href: "#layanan" },
  { label: "Berita", href: "#berita" },
  { label: "Tentang", href: "#tentang" },
  { label: "Kontak", href: "#kontak" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 lg:w-7 lg:h-7 text-primary-foreground" />
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
                className="text-muted-foreground hover:text-primary font-medium transition-colors"
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
            <Button>Ajukan Layanan</Button>
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
                  className="px-4 py-3 text-muted-foreground hover:text-primary hover:bg-muted rounded-lg font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Link to="/admin">
                  <Button variant="outline" className="w-full">Portal Admin</Button>
                </Link>
                <Button className="w-full">Ajukan Layanan</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
