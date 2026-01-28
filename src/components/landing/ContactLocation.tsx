import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock } from "lucide-react"

type Kontak = {
  id: number;
  address: string;
  phones: string;
  email: string;
  hours: string;
  mapEmbedUrl: string;
};

export function ContactLocation() {
  const kontakQuery = useQuery({
    queryKey: ["site", "kontak", "public"],
    queryFn: async () => {
      const res = await fetch("/api/site/public/kontak");
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { item: Kontak };
      return data.item;
    },
  });

  const address = kontakQuery.data?.address || "Jl. Raya Cibubur No. 123\nKec. Cimanggis, Kota Depok\nJawa Barat 16951";
  const phones = kontakQuery.data?.phones || "(021) 8459 1234\n(021) 8459 5678";
  const email = kontakQuery.data?.email || "kelurahan.cibubur@depok.go.id";
  const hours = kontakQuery.data?.hours || "Senin - Kamis: 08.00 - 16.30 WIB\nJumat: 08.00 - 16.00 WIB\nSabtu - Minggu: Tutup";
  const mapEmbedUrl =
    kontakQuery.data?.mapEmbedUrl ||
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.2143336895773!2d106.9051003152709!3d-6.370000663267778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec1a9e8e7e8b%3A0x2e6f5e1a5a5a5a5a!2sKantor%20Kelurahan%20Cibubur!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid";

  const addressLines = useMemo(() => address.split("\n").map((s) => s.trim()).filter(Boolean), [address]);
  const phoneLines = useMemo(() => phones.split("\n").map((s) => s.trim()).filter(Boolean), [phones]);
  const hoursLines = useMemo(() => hours.split("\n").map((s) => s.trim()).filter(Boolean), [hours]);

  const toTel = (p: string) => p.replace(/[^\d+]/g, "");

  return (
    <section className="py-16 bg-gray-50" id="kontak">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kontak & Lokasi</h2>
          <p className="text-gray-600">Kantor Kelurahan Cibubur siap melayani Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Alamat Kantor</h3>
                <p className="text-gray-600 mt-1">
                  {addressLines.map((l, idx) => (
                    <span key={idx}>
                      {l}
                      {idx < addressLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Telepon</h3>
                <p className="text-gray-600 mt-1">
                  {phoneLines.map((p, idx) => (
                    <span key={idx}>
                      <a className="hover:underline" href={`tel:${toTel(p)}`}>{p}</a>
                      {idx < phoneLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Mail className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Email</h3>
                <p className="text-gray-600 mt-1">
                  <a className="hover:underline" href={`mailto:${email}`}>{email}</a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-orange-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Jam Operasional</h3>
                <p className="text-gray-600 mt-1">
                  {hoursLines.map((l, idx) => (
                    <span key={idx}>
                      {l}
                      {idx < hoursLines.length - 1 ? <br /> : null}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>

          <div className="h-96 bg-gray-200 rounded-lg overflow-hidden">
            <iframe 
              src={mapEmbedUrl} 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy"
              title="Lokasi Kantor Kelurahan Cibubur"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  )
}
