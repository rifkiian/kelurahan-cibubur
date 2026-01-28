import { Router, type Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

const getSiteTentangModel = () => (prisma as unknown as { siteTentang?: any }).siteTentang;
const getSiteKontakModel = () => (prisma as unknown as { siteKontak?: any }).siteKontak;
const getSiteOrganisasiModel = () => (prisma as unknown as { siteOrganisasi?: any }).siteOrganisasi;
const getSiteDaruratModel = () => (prisma as unknown as { siteDarurat?: any }).siteDarurat;
const getSiteMetricsModel = () => (prisma as unknown as { siteMetrics?: any }).siteMetrics;

const defaultTentang = {
  id: 1,
  intro:
    "Kelurahan Cibubur merupakan salah satu kelurahan di Kecamatan Ciracas, Kota Administrasi Jakarta Timur, DKI Jakarta. Dengan luas wilayah yang strategis, kami berkomitmen untuk memberikan pelayanan terbaik bagi seluruh warga Cibubur.",
  visi:
    '"Terwujudnya Kelurahan Cibubur yang mandiri, sejahtera, dan berbudaya dengan didukung oleh masyarakat yang berakhlak mulia dan berdaya saing."',
  misi:
    "Meningkatkan kualitas pelayanan publik yang prima dan berkeadilan\nMeningkatkan kesejahteraan masyarakat melalui program pemberdayaan\nMenjaga keamanan, ketertiban, dan ketentraman masyarakat\nMeningkatkan partisipasi masyarakat dalam pembangunan\nMelestarikan nilai-nilai budaya dan kearifan lokal",
};

const defaultKontak = {
  id: 1,
  address: "Jl. Raya Cibubur No. 123\nKec. Cimanggis, Kota Depok\nJawa Barat 16951",
  phones: "(021) 8459 1234\n(021) 8459 5678",
  email: "kelurahan.cibubur@depok.go.id",
  hours: "Senin - Kamis: 08.00 - 16.30 WIB\nJumat: 08.00 - 16.00 WIB\nSabtu - Minggu: Tutup",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.2143336895773!2d106.9051003152709!3d-6.370000663267778!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69ec1a9e8e7e8b%3A0x2e6f5e1a5a5a5a5a!2sKantor%20Kelurahan%20Cibubur!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid",
};

const defaultDarurat = [
  {
    id: "ambulans",
    name: "Ambulans",
    number: "118",
    icon: "ambulance",
    color: "red",
    note: "Layanan 24 Jam",
    order: 0,
  },
  {
    id: "polisi",
    name: "Polisi",
    number: "110",
    icon: "shield",
    color: "blue",
    note: "Layanan 24 Jam",
    order: 1,
  },
  {
    id: "damkar",
    name: "Pemadam Kebakaran",
    number: "113",
    icon: "fire",
    color: "orange",
    note: "Layanan 24 Jam",
    order: 2,
  },
  {
    id: "puskesmas",
    name: "Puskesmas Cibubur",
    number: "(021) 8459 9999",
    icon: "phone",
    color: "green",
    note: "Buka 24 Jam",
    order: 3,
  },
  {
    id: "pos-kamling",
    name: "Pos Kamling RW 01–10",
    number: "(021) 8459 8888",
    icon: "phone",
    color: "purple",
    note: "Buka 24 Jam",
    order: 4,
  },
  {
    id: "pengaduan",
    name: "Layanan Pengaduan 24 Jam",
    number: "1500-123",
    icon: "phone",
    color: "yellow",
    note: "Layanan Pengaduan",
    order: 5,
  },
];

async function getTentangRow() {
  const model = getSiteTentangModel();
  if (model) {
    const row = await model.findUnique({ where: { id: 1 } });
    return row || null;
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SiteTentang" WHERE "id" = 1 LIMIT 1
    `;
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

async function getPengaduanBulanIni() {
  const pengaduan = (prisma as unknown as { pengaduan?: any }).pengaduan;
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  if (pengaduan) {
    return Number(
      await pengaduan.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      }),
    );
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM "Pengaduan"
      WHERE "createdAt" >= date_trunc('month', NOW())
        AND "createdAt" < (date_trunc('month', NOW()) + INTERVAL '1 month')
    `;
    return Number(rows?.[0]?.count || 0);
  } catch {
    return 0;
  }
}

async function getPendudukTotal() {
  const penduduk = (prisma as unknown as { penduduk?: any }).penduduk;
  if (penduduk) {
    return Number(await penduduk.count());
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM "Penduduk"`;
    return Number(rows?.[0]?.count || 0);
  } catch {
    return 0;
  }
}

async function getDaruratRows() {
  const model = getSiteDaruratModel();
  if (model) {
    const rows = await model.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return rows || [];
  }

  try {
    await ensureDaruratTable();
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SiteDarurat" ORDER BY "order" ASC, "createdAt" ASC
    `;
    return rows || [];
  } catch {
    return [];
  }
}

async function ensureTentangTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteTentang" (
      "id" INTEGER PRIMARY KEY,
      "intro" TEXT NOT NULL,
      "visi" TEXT NOT NULL,
      "misi" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureKontakTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteKontak" (
      "id" INTEGER PRIMARY KEY,
      "address" TEXT NOT NULL,
      "phones" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "hours" TEXT NOT NULL,
      "mapEmbedUrl" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureOrganisasiTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteOrganisasi" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "jabatan" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureDaruratTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteDarurat" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "number" TEXT NOT NULL,
      "icon" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "note" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function ensureMetricsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteMetrics" (
      "id" INTEGER PRIMARY KEY,
      "rtAktif" INTEGER NOT NULL DEFAULT 0,
      "rwAktif" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
}

async function getMetricsRow() {
  const model = getSiteMetricsModel();
  if (model) {
    const row = await model.findUnique({ where: { id: 1 } });
    return row || null;
  }

  try {
    await ensureMetricsTable();
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SiteMetrics" WHERE "id" = 1 LIMIT 1
    `;
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

async function getOrganisasiRows() {
  const model = getSiteOrganisasiModel();
  if (model) {
    const rows = await model.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
    return rows || [];
  }

  try {
    await ensureOrganisasiTable();
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SiteOrganisasi" ORDER BY "order" ASC, "createdAt" ASC
    `;
    return rows || [];
  } catch {
    return [];
  }
}

async function getKontakRow() {
  const model = getSiteKontakModel();
  if (model) {
    const row = await model.findUnique({ where: { id: 1 } });
    return row || null;
  }

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "SiteKontak" WHERE "id" = 1 LIMIT 1
    `;
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

// Public
router.get("/public/tentang", async (_req, res: Response) => {
  const row = await getTentangRow();
  return res.json({ item: row || defaultTentang });
});

router.get("/public/kontak", async (_req, res: Response) => {
  const row = await getKontakRow();
  return res.json({ item: row || defaultKontak });
});

router.get("/public/organisasi", async (_req, res: Response) => {
  const items = await getOrganisasiRows();
  return res.json({ items });
});

router.get("/public/darurat", async (_req, res: Response) => {
  const items = await getDaruratRows();
  return res.json({ items: items.length ? items : defaultDarurat });
});

router.get("/public/metrics", async (_req, res: Response) => {
  const [pendudukTotal, metrics, pengaduanBulanIni] = await Promise.all([
    getPendudukTotal(),
    getMetricsRow(),
    getPengaduanBulanIni(),
  ]);
  const rtAktif = Number(metrics?.rtAktif || 0);
  const rwAktif = Number(metrics?.rwAktif || 0);
  return res.json({
    pendudukTotal,
    rtAktif,
    rwAktif,
    rtRwAktif: rtAktif + rwAktif,
    pengaduanBulanIni,
  });
});

// Admin-only
router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const updateTentangSchema = z.object({
  intro: z.string().min(1),
  visi: z.string().min(1),
  misi: z.string().min(1),
});

const updateKontakSchema = z.object({
  address: z.string().min(1),
  phones: z.string().min(1),
  email: z.string().min(1),
  hours: z.string().min(1),
  mapEmbedUrl: z.string().min(1),
});

const organisasiItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  jabatan: z.string().min(1),
  description: z.string().min(1),
});

const updateOrganisasiSchema = z.object({
  items: z.array(organisasiItemSchema).max(50),
});

const daruratIconSchema = z.enum(["ambulance", "shield", "fire", "phone"]);
const daruratColorSchema = z.enum(["red", "blue", "orange", "green", "purple", "yellow"]);

const daruratItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  number: z.string().min(1),
  icon: daruratIconSchema,
  color: daruratColorSchema,
  note: z.string().min(1),
});

const updateDaruratSchema = z.object({
  items: z.array(daruratItemSchema).max(50),
});

const updateMetricsSchema = z.object({
  rtAktif: z.number().int().min(0).max(9999),
  rwAktif: z.number().int().min(0).max(9999),
});

router.get("/tentang", async (_req, res: Response) => {
  const row = await getTentangRow();
  return res.json({ item: row || defaultTentang });
});

router.put("/tentang", async (req, res: Response) => {
  const parsed = updateTentangSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const model = getSiteTentangModel();
  if (model) {
    const item = await model.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: { ...parsed.data },
    });
    return res.json({ item });
  }

  try {
    await ensureTentangTable();
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "SiteTentang" ("id", "intro", "visi", "misi", "createdAt", "updatedAt")
      VALUES (1, ${parsed.data.intro}, ${parsed.data.visi}, ${parsed.data.misi}, NOW(), NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "intro" = EXCLUDED."intro",
        "visi" = EXCLUDED."visi",
        "misi" = EXCLUDED."misi",
        "updatedAt" = NOW()
      RETURNING *
    `;
    return res.json({ item: rows?.[0] });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
});

router.get("/kontak", async (_req, res: Response) => {
  const row = await getKontakRow();
  return res.json({ item: row || defaultKontak });
});

router.put("/kontak", async (req, res: Response) => {
  const parsed = updateKontakSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const model = getSiteKontakModel();
  if (model) {
    const item = await model.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: { ...parsed.data },
    });
    return res.json({ item });
  }

  try {
    await ensureKontakTable();
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "SiteKontak" (
        "id", "address", "phones", "email", "hours", "mapEmbedUrl", "createdAt", "updatedAt"
      ) VALUES (
        1, ${parsed.data.address}, ${parsed.data.phones}, ${parsed.data.email}, ${parsed.data.hours}, ${parsed.data.mapEmbedUrl}, NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "address" = EXCLUDED."address",
        "phones" = EXCLUDED."phones",
        "email" = EXCLUDED."email",
        "hours" = EXCLUDED."hours",
        "mapEmbedUrl" = EXCLUDED."mapEmbedUrl",
        "updatedAt" = NOW()
      RETURNING *
    `;
    return res.json({ item: rows?.[0] });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
});

router.get("/organisasi", async (_req, res: Response) => {
  const items = await getOrganisasiRows();
  return res.json({ items });
});

router.put("/organisasi", async (req, res: Response) => {
  const parsed = updateOrganisasiSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const model = getSiteOrganisasiModel();
  if (model) {
    await prisma.$transaction([
      model.deleteMany({}),
      ...parsed.data.items.map((item, index) =>
        model.create({
          data: {
            id: item.id || randomUUID(),
            name: item.name,
            jabatan: item.jabatan,
            description: item.description,
            order: index,
          },
        }),
      ),
    ]);
    const items = await getOrganisasiRows();
    return res.json({ items });
  }

  await ensureOrganisasiTable();
  const statements: any[] = [prisma.$executeRawUnsafe('DELETE FROM "SiteOrganisasi"')];
  for (let i = 0; i < parsed.data.items.length; i++) {
    const item = parsed.data.items[i];
    const id = item.id || randomUUID();
    statements.push(
      prisma.$executeRaw`
        INSERT INTO "SiteOrganisasi" (
          "id", "name", "jabatan", "description", "order", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${item.name}, ${item.jabatan}, ${item.description}, ${i}, NOW(), NOW()
        )
      `,
    );
  }

  await prisma.$transaction(statements);
  const items = await getOrganisasiRows();
  return res.json({ items });
});

router.get("/darurat", async (_req, res: Response) => {
  const items = await getDaruratRows();
  return res.json({ items: items.length ? items : defaultDarurat });
});

router.put("/darurat", async (req, res: Response) => {
  const parsed = updateDaruratSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const model = getSiteDaruratModel();
  if (model) {
    await prisma.$transaction([
      model.deleteMany({}),
      ...parsed.data.items.map((item, index) =>
        model.create({
          data: {
            id: item.id || randomUUID(),
            name: item.name,
            number: item.number,
            icon: item.icon,
            color: item.color,
            note: item.note,
            order: index,
          },
        }),
      ),
    ]);
    const items = await getDaruratRows();
    return res.json({ items });
  }

  await ensureDaruratTable();
  const statements: any[] = [prisma.$executeRawUnsafe('DELETE FROM "SiteDarurat"')];
  for (let i = 0; i < parsed.data.items.length; i++) {
    const item = parsed.data.items[i];
    const id = item.id || randomUUID();
    statements.push(
      prisma.$executeRaw`
        INSERT INTO "SiteDarurat" (
          "id", "name", "number", "icon", "color", "note", "order", "createdAt", "updatedAt"
        ) VALUES (
          ${id}, ${item.name}, ${item.number}, ${item.icon}, ${item.color}, ${item.note}, ${i}, NOW(), NOW()
        )
      `,
    );
  }

  await prisma.$transaction(statements);
  const items = await getDaruratRows();
  return res.json({ items });
});

router.get("/metrics", async (_req, res: Response) => {
  const row = await getMetricsRow();
  return res.json({ item: row || { id: 1, rtAktif: 0, rwAktif: 0 } });
});

router.put("/metrics", async (req, res: Response) => {
  const parsed = updateMetricsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const model = getSiteMetricsModel();
  if (model) {
    const item = await model.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: { ...parsed.data },
    });
    return res.json({ item });
  }

  try {
    await ensureMetricsTable();
    const rows = await prisma.$queryRaw<any[]>`
      INSERT INTO "SiteMetrics" ("id", "rtAktif", "rwAktif", "createdAt", "updatedAt")
      VALUES (1, ${parsed.data.rtAktif}, ${parsed.data.rwAktif}, NOW(), NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "rtAktif" = EXCLUDED."rtAktif",
        "rwAktif" = EXCLUDED."rwAktif",
        "updatedAt" = NOW()
      RETURNING *
    `;
    return res.json({ item: rows?.[0] });
  } catch {
    return res.status(500).json({ message: "Database error" });
  }
});

export default router;
