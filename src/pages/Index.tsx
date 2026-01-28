import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { NewsSection } from "@/components/landing/NewsSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { EmergencyContacts } from "@/components/landing/EmergencyContacts";
import { ContactLocation } from "@/components/landing/ContactLocation";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <section id="tentang" className="scroll-mt-20">
          <AboutSection />
        </section>
        <section id="layanan" className="scroll-mt-20">
          <ServicesSection />
        </section>
        <section id="berita" className="scroll-mt-20">
          <NewsSection />
        </section>
        <section id="kontak" className="scroll-mt-20">
          <EmergencyContacts />
          <ContactLocation />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
