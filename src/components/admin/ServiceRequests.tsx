import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreVertical } from "lucide-react";

const requests = [
  {
    id: "LYN-2026-001",
    type: "Surat Keterangan Domisili",
    applicant: "Budi Santoso",
    date: "25 Jan 2026",
    status: "pending",
  },
  {
    id: "LYN-2026-002",
    type: "KTP Elektronik",
    applicant: "Dewi Lestari",
    date: "24 Jan 2026",
    status: "processing",
  },
  {
    id: "LYN-2026-003",
    type: "Kartu Keluarga",
    applicant: "Ahmad Wijaya",
    date: "24 Jan 2026",
    status: "pending",
  },
  {
    id: "LYN-2026-004",
    type: "Surat Pindah",
    applicant: "Rina Marlina",
    date: "23 Jan 2026",
    status: "completed",
  },
  {
    id: "LYN-2026-005",
    type: "Legalisasi Dokumen",
    applicant: "Joko Widodo",
    date: "23 Jan 2026",
    status: "processing",
  },
];

const statusConfig = {
  pending: { label: "Menunggu", className: "bg-accent/20 text-accent-foreground border-accent" },
  processing: { label: "Diproses", className: "bg-secondary/20 text-secondary border-secondary" },
  completed: { label: "Selesai", className: "bg-primary/20 text-primary border-primary" },
};

export function ServiceRequests() {
  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Pengajuan Layanan</CardTitle>
        <Button variant="outline" size="sm">Lihat Semua</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">No. Pengajuan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Jenis Layanan</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Pemohon</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Tanggal</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const status = statusConfig[request.status as keyof typeof statusConfig];
                return (
                  <tr key={request.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-2">
                      <span className="font-mono text-sm font-medium text-foreground">{request.id}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-foreground">{request.type}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-foreground">{request.applicant}</span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-muted-foreground">{request.date}</span>
                    </td>
                    <td className="py-4 px-2">
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
