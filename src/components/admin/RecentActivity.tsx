import { FileText, User, Bell, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const activities = [
  {
    id: 1,
    type: "layanan",
    title: "Pengajuan Surat Keterangan Domisili",
    user: "Budi Santoso",
    time: "5 menit lalu",
    status: "pending",
    icon: FileText,
  },
  {
    id: 2,
    type: "penduduk",
    title: "Data penduduk baru ditambahkan",
    user: "Admin",
    time: "15 menit lalu",
    status: "completed",
    icon: User,
  },
  {
    id: 3,
    type: "layanan",
    title: "KTP Elektronik selesai diproses",
    user: "Siti Nurhaliza",
    time: "1 jam lalu",
    status: "completed",
    icon: CheckCircle,
  },
  {
    id: 4,
    type: "pengumuman",
    title: "Berita baru dipublikasikan",
    user: "Admin",
    time: "2 jam lalu",
    status: "completed",
    icon: Bell,
  },
  {
    id: 5,
    type: "layanan",
    title: "Pengajuan Kartu Keluarga Baru",
    user: "Ahmad Wijaya",
    time: "3 jam lalu",
    status: "processing",
    icon: FileText,
  },
];

const statusConfig = {
  pending: { label: "Menunggu", variant: "secondary" as const },
  processing: { label: "Diproses", variant: "default" as const },
  completed: { label: "Selesai", variant: "outline" as const },
};

export function RecentActivity() {
  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Aktivitas Terkini</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const status = statusConfig[activity.status as keyof typeof statusConfig];
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <activity.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.user} · {activity.time}
                  </p>
                </div>
                <Badge variant={status.variant} className="shrink-0 text-xs">
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
