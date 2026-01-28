import { Router, type Response } from "express";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const getPengaduanModel = () => (prisma as unknown as { pengaduan?: any }).pengaduan;
const getPendudukModel = () => (prisma as unknown as { penduduk?: any }).penduduk;
 const getBeritaModel = () => (prisma as unknown as { berita?: any }).berita;
 const getAgendaModel = () => (prisma as unknown as { agenda?: any }).agenda;

const toIsoDay = (d: Date) => {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd.toISOString().slice(0, 10);
};

router.get("/overview", async (_req, res: Response) => {
  const penduduk = getPendudukModel();
  const pengaduan = getPengaduanModel();

  let pendudukTotal = 0;
  if (penduduk) {
    pendudukTotal = await penduduk.count();
  } else {
    const rows = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM "Penduduk"`;
    pendudukTotal = Number(rows?.[0]?.count || 0);
  }

  let pengaduanTotal = 0;
  let byStatus: Record<"BARU" | "DIPROSES" | "SELESAI", number> = {
    BARU: 0,
    DIPROSES: 0,
    SELESAI: 0,
  };

  if (pengaduan) {
    pengaduanTotal = await pengaduan.count();
    const grouped = await pengaduan.groupBy({ by: ["status"], _count: { status: true } });
    for (const g of grouped) {
      const status = String(g.status);
      if (status === "BARU" || status === "DIPROSES" || status === "SELESAI") {
        byStatus[status] = Number(g._count.status || 0);
      }
    }
  } else {
    const totalRows = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM "Pengaduan"`;
    pengaduanTotal = Number(totalRows?.[0]?.count || 0);

    const statusRows = await prisma.$queryRaw<any[]>`
      SELECT "status", COUNT(*)::int as count
      FROM "Pengaduan"
      GROUP BY "status"
    `;

    for (const r of statusRows) {
      const status = String(r.status) as keyof typeof byStatus;
      if (status in byStatus) byStatus[status] = Number(r.count || 0);
    }
  }

  const selesaiBulanIniRows = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*)::int as count
    FROM "Pengaduan"
    WHERE "status" = 'SELESAI'
      AND date_trunc('month', "updatedAt") = date_trunc('month', NOW())
  `;
  const pengaduanSelesaiBulanIni = Number(selesaiBulanIniRows?.[0]?.count || 0);

  const last7DaysRows = await prisma.$queryRaw<any[]>`
    SELECT date_trunc('day', "createdAt") as day, COUNT(*)::int as count
    FROM "Pengaduan"
    WHERE "createdAt" >= NOW() - interval '6 days'
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const map = new Map<string, number>();
  for (const r of last7DaysRows) {
    const day = r.day instanceof Date ? toIsoDay(r.day) : String(r.day).slice(0, 10);
    map.set(day, Number(r.count || 0));
  }

  const last7Days: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toIsoDay(d);
    last7Days.push({ date: key, count: map.get(key) ?? 0 });
  }

  return res.json({
    pendudukTotal,
    pengaduan: {
      total: pengaduanTotal,
      byStatus,
      selesaiBulanIni: pengaduanSelesaiBulanIni,
      last7Days,
    },
  });
});

router.get("/recent-activity", async (req, res: Response) => {
  const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 10;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;

  const pengaduan = getPengaduanModel();
  const penduduk = getPendudukModel();
  const berita = getBeritaModel();
  const agenda = getAgendaModel();

  const items: {
    id: string;
    type: "pengaduan" | "penduduk" | "berita" | "agenda";
    title: string;
    user: string;
    status: "pending" | "processing" | "completed";
    at: string;
    href?: string;
  }[] = [];

  const pushItem = (item: (typeof items)[number]) => {
    if (!item.at) return;
    items.push(item);
  };

  try {
    if (pengaduan) {
      const rows = await pengaduan.findMany({ orderBy: { updatedAt: "desc" }, take: limit });
      for (const r of rows) {
        const status = String(r.status);
        const mapped = status === "SELESAI" ? "completed" : status === "DIPROSES" ? "processing" : "pending";
        pushItem({
          id: String(r.id),
          type: "pengaduan",
          title: `Pengaduan: ${String(r.category)}`,
          user: String(r.name),
          status: mapped,
          at: new Date(r.updatedAt).toISOString(),
          href: "/admin/pengaduan",
        });
      }
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "name", "category", "status", "updatedAt"
        FROM "Pengaduan"
        ORDER BY "updatedAt" DESC
        LIMIT ${limit}
      `;
      for (const r of rows) {
        const status = String(r.status);
        const mapped = status === "SELESAI" ? "completed" : status === "DIPROSES" ? "processing" : "pending";
        pushItem({
          id: String(r.id),
          type: "pengaduan",
          title: `Pengaduan: ${String(r.category)}`,
          user: String(r.name),
          status: mapped,
          at: (r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt)).toISOString(),
          href: "/admin/pengaduan",
        });
      }
    }
  } catch {
  }

  try {
    if (penduduk) {
      const rows = await penduduk.findMany({ orderBy: { createdAt: "desc" }, take: limit });
      for (const r of rows) {
        pushItem({
          id: String(r.id),
          type: "penduduk",
          title: "Data penduduk baru ditambahkan",
          user: "Admin",
          status: "completed",
          at: new Date(r.createdAt).toISOString(),
          href: "/admin/penduduk",
        });
      }
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "createdAt"
        FROM "Penduduk"
        ORDER BY "createdAt" DESC
        LIMIT ${limit}
      `;
      for (const r of rows) {
        pushItem({
          id: String(r.id),
          type: "penduduk",
          title: "Data penduduk baru ditambahkan",
          user: "Admin",
          status: "completed",
          at: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
          href: "/admin/penduduk",
        });
      }
    }
  } catch {
  }

  try {
    if (berita) {
      const rows = await berita.findMany({ orderBy: { updatedAt: "desc" }, take: limit });
      for (const r of rows) {
        const published = Boolean(r.published);
        pushItem({
          id: String(r.id),
          type: "berita",
          title: published ? `Berita dipublikasikan: ${String(r.title)}` : `Berita diperbarui: ${String(r.title)}`,
          user: "Admin",
          status: "completed",
          at: new Date(r.updatedAt).toISOString(),
          href: "/admin/berita",
        });
      }
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "title", "published", "updatedAt"
        FROM "Berita"
        ORDER BY "updatedAt" DESC
        LIMIT ${limit}
      `;
      for (const r of rows) {
        const published = Boolean(r.published);
        pushItem({
          id: String(r.id),
          type: "berita",
          title: published ? `Berita dipublikasikan: ${String(r.title)}` : `Berita diperbarui: ${String(r.title)}`,
          user: "Admin",
          status: "completed",
          at: (r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt)).toISOString(),
          href: "/admin/berita",
        });
      }
    }
  } catch {
  }

  try {
    if (agenda) {
      const rows = await agenda.findMany({ orderBy: { updatedAt: "desc" }, take: limit });
      for (const r of rows) {
        pushItem({
          id: String(r.id),
          type: "agenda",
          title: `Agenda diperbarui: ${String(r.title)}`,
          user: "Admin",
          status: "completed",
          at: new Date(r.updatedAt).toISOString(),
          href: "/admin/statistik",
        });
      }
    } else {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT "id", "title", "updatedAt"
        FROM "Agenda"
        ORDER BY "updatedAt" DESC
        LIMIT ${limit}
      `;
      for (const r of rows) {
        pushItem({
          id: String(r.id),
          type: "agenda",
          title: `Agenda diperbarui: ${String(r.title)}`,
          user: "Admin",
          status: "completed",
          at: (r.updatedAt instanceof Date ? r.updatedAt : new Date(r.updatedAt)).toISOString(),
          href: "/admin/statistik",
        });
      }
    }
  } catch {
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return res.json({ items: items.slice(0, limit) });
});

export default router;
