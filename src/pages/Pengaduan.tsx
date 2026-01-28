import { Navbar } from "@/components/landing/Navbar";
import { ComplaintForm } from "@/components/landing/ComplaintForm";
import { Footer } from "@/components/landing/Footer";

const Pengaduan = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 lg:pt-20">
        <ComplaintForm />
      </main>
      <Footer />
    </div>
  );
};

export default Pengaduan;
