import {
  BadgeCheck,
  Building,
  CreditCard,
  FileText,
  Home,
  Users,
  type LucideIcon,
} from "lucide-react";

export type LayananItem = {
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  persyaratan: string[];
};

export const layananItems: LayananItem[] = [
  {
    slug: "surat-keterangan",
    icon: FileText,
    title: "Surat Keterangan",
    description: "Pengurusan berbagai surat keterangan seperti SKCK, domisili, dan lainnya.",
    color: "bg-primary/10 text-primary",
    persyaratan: [
      "Fotokopi KTP",
      "Fotokopi Kartu Keluarga",
      "Surat pengantar RT/RW (jika diperlukan)",
    ],
  },
  {
    slug: "kartu-keluarga",
    icon: Users,
    title: "Kartu Keluarga",
    description: "Pembuatan dan perubahan data Kartu Keluarga baru maupun update.",
    color: "bg-secondary/20 text-secondary",
    persyaratan: [
      "Fotokopi KTP",
      "Fotokopi Kartu Keluarga lama (untuk perubahan)",
      "Dokumen pendukung (akta nikah/akta lahir sesuai kebutuhan)",
    ],
  },
  {
    slug: "surat-pindah",
    icon: Home,
    title: "Surat Pindah",
    description: "Pengurusan surat pindah masuk dan keluar wilayah kelurahan.",
    color: "bg-accent/20 text-accent-foreground",
    persyaratan: [
      "Fotokopi KTP",
      "Fotokopi Kartu Keluarga",
      "Surat pengantar RT/RW",
    ],
  },
  {
    slug: "ktp-elektronik",
    icon: CreditCard,
    title: "KTP Elektronik",
    description: "Layanan pembuatan e-KTP baru dan penggantian karena hilang/rusak.",
    color: "bg-primary/10 text-primary",
    persyaratan: [
      "Fotokopi Kartu Keluarga",
      "Surat kehilangan dari kepolisian (jika hilang)",
      "KTP lama (jika rusak/perpanjangan)",
    ],
  },
  {
    slug: "perizinan-usaha",
    icon: Building,
    title: "Perizinan Usaha",
    description: "Rekomendasi dan pengurusan izin usaha tingkat kelurahan.",
    color: "bg-secondary/20 text-secondary",
    persyaratan: [
      "Fotokopi KTP",
      "Surat keterangan domisili usaha (jika diperlukan)",
      "Dokumen pendukung usaha",
    ],
  },
  {
    slug: "legalisasi-dokumen",
    icon: BadgeCheck,
    title: "Legalisasi Dokumen",
    description: "Layanan legalisasi dan pengesahan dokumen resmi.",
    color: "bg-accent/20 text-accent-foreground",
    persyaratan: [
      "Dokumen asli yang akan dilegalisasi",
      "Fotokopi dokumen",
      "Fotokopi KTP pemohon",
    ],
  },
];
