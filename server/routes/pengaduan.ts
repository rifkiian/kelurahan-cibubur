import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

const pengaduanCreateSchema = z.object({
  name: z.string().min(1).max(100).transform(val => val.trim()),
  phone: z.string().min(1).max(20).transform(val => val.trim()),
  category: z.string().min(1).max(50).transform(val => val.trim()),
  location: z.string().min(1).max(200).transform(val => val.trim()),
  description: z.string().min(1).max(1000).transform(val => val.trim()),
  photoUrl: z.string().optional().nullable().refine((url) => {
    if (!url) return true; // Allow null/empty
    // Validasi bahwa URL hanya mengarah ke /uploads/ dengan filename yang valid
    return /^\/uploads\/pengaduan-[a-f0-9]{32}\.(jpg|jpeg|png|webp)$/i.test(url);
  }, {
    message: "Photo URL tidak valid. Hanya file yang diupload melalui sistem yang diperbolehkan"
  }),
});

const pengaduanUpdateSchema = z.object({
  status: z.enum(["BARU", "DIPROSES", "SELESAI"]),
});

const getPengaduanModel = () => (prisma as unknown as { pengaduan?: any }).pengaduan;

const pengaduanTrackSchema = z.object({
  id: z.string().min(1),
});

// Public: submit pengaduan
router.post("/", async (req: Request, res: Response) => {
  const parsed = pengaduanCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const pengaduan = getPengaduanModel();
  try {
    if (pengaduan) {
      const created = await pengaduan.create({
        data: {
          name: parsed.data.name,
          phone: parsed.data.phone,
          category: parsed.data.category,
          location: parsed.data.location,
          description: parsed.data.description,
          photoUrl: parsed.data.photoUrl || null,
        },
      });
      return res.status(201).json({ item: created });
    }

    const id = randomUUID();
    const createdRows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Pengaduan" (
        "id",
        "name",
        "phone",
        "category",
        "location",
        "description",
        "photoUrl",
        "status",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${parsed.data.name},
        ${parsed.data.phone},
        ${parsed.data.category},
        ${parsed.data.location},
        ${parsed.data.description},
        ${parsed.data.photoUrl || null},
        'BARU',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const created = createdRows?.[0];
    return res.status(201).json({ item: created });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ message: "Database error" });
    }
    throw e;
  }
});

// Public: track pengaduan by kode
router.get("/track/:id", async (req: Request, res: Response) => {
  const parsed = pengaduanTrackSchema.safeParse({ id: req.params.id });
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const pengaduan = getPengaduanModel();
  try {
    if (pengaduan) {
      const found = await pengaduan.findUnique({ where: { id: parsed.data.id } });
      if (!found) return res.status(404).json({ message: "Not found" });
      return res.json({
        item: {
          id: found.id,
          status: found.status,
          category: found.category,
          createdAt: found.createdAt,
          updatedAt: found.updatedAt,
        },
      });
    }

    const rows = await prisma.$queryRaw<any[]>`
      SELECT "id", "status", "category", "createdAt", "updatedAt"
      FROM "Pengaduan"
      WHERE "id" = ${parsed.data.id}
      LIMIT 1
    `;
    const found = rows?.[0];
    if (!found) return res.status(404).json({ message: "Not found" });
    return res.json({ item: found });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return res.status(500).json({ message: "Database error" });
    }
    throw e;
  }
});

// Admin-only
router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

router.get("/", async (_req, res: Response) => {
  const pengaduan = getPengaduanModel();

  if (pengaduan) {
    const items = await pengaduan.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ items });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Pengaduan" ORDER BY "createdAt" DESC
  `;
  return res.json({ items });
});

router.put("/:id", async (req, res: Response) => {
  const id = req.params.id;
  const parsed = pengaduanUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const pengaduan = getPengaduanModel();
  try {
    if (pengaduan) {
      const updated = await pengaduan.update({ where: { id }, data: parsed.data });
      return res.json({ item: updated });
    }

    const updatedRows = await prisma.$queryRaw<any[]>`
      UPDATE "Pengaduan"
      SET "status" = ${parsed.data.status}, "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    const updated = updatedRows?.[0];
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json({ item: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ message: "Not found" });
    }
    throw e;
  }
});

router.delete("/:id", async (req, res: Response) => {
  const id = req.params.id;

  const pengaduan = getPengaduanModel();
  try {
    if (pengaduan) {
      await pengaduan.delete({ where: { id } });
      return res.status(204).send();
    }

    const deletedRows = await prisma.$queryRaw<any[]>`
      DELETE FROM "Pengaduan" WHERE "id" = ${id} RETURNING "id"
    `;

    if (!deletedRows?.[0]) return res.status(404).json({ message: "Not found" });
    return res.status(204).send();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ message: "Not found" });
    }
    throw e;
  }
});

export default router;
