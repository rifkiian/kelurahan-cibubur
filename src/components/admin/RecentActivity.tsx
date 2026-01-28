import { Bell, CalendarDays, FileText, MessageSquare, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  pending: { label: "Menunggu", variant: "secondary" as const },
  processing: { label: "Diproses", variant: "default" as const },
  completed: { label: "Selesai", variant: "outline" as const },
};

type RecentItem = {
  id: string;
  type: "pengaduan" | "penduduk" | "berita" | "agenda";
  title: string;
  user: string;
  status: "pending" | "processing" | "completed";
  at: string;
  href?: string;
};

const iconByType: Record<RecentItem["type"], any> = {
  pengaduan: MessageSquare,
  penduduk: User,
  berita: Bell,
  agenda: CalendarDays,
};

const formatRelativeId = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
};

export function RecentActivity() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const headers = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const activityQuery = useQuery({
    queryKey: ["stats", "recent-activity"],
    queryFn: async () => {
      const res = await fetch("/api/stats/recent-activity?limit=10", { headers });
      if (!res.ok) throw new Error("failed_fetch");
      const data = (await res.json()) as { items: RecentItem[] };
      return data.items;
    },
    enabled: Boolean(token),
    staleTime: 5000,
    refetchInterval: 10000,
  });

  const activities = activityQuery.data ?? [];

  return (
    <Card className="border-0 card-shadow">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Aktivitas Terkini</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityQuery.isLoading && (
            <div className="text-sm text-muted-foreground">Memuat...</div>
          )}

          {activityQuery.isError && (
            <div className="text-sm text-muted-foreground">Gagal memuat aktivitas.</div>
          )}

          {!activityQuery.isLoading && !activityQuery.isError && activities.length === 0 && (
            <div className="text-sm text-muted-foreground">Belum ada aktivitas.</div>
          )}

          {activities.map((activity) => {
            const status = statusConfig[activity.status as keyof typeof statusConfig];
            const Icon = iconByType[activity.type] ?? FileText;
            return (
              <div 
                key={activity.id}
                className="flex items-start gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => {
                  if (activity.href) navigate(activity.href);
                }}
                role={activity.href ? "button" : undefined}
                tabIndex={activity.href ? 0 : undefined}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {activity.user} · {formatRelativeId(activity.at)}
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
