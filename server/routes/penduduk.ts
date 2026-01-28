import { Router, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const pendudukCreateSchema = z.object({
  nik: z.string().min(1),
  nama: z.string().min(1),
  jenisKelamin: z.string().min(1),
  tanggalLahir: z.string().optional().nullable(),
  alamat: z.string().optional().nullable(),
});

const pendudukUpdateSchema = pendudukCreateSchema.partial();

router.get("/", async (_req, res: Response) => {
  const items = await prisma.penduduk.findMany({ orderBy: { createdAt: "desc" } });
  return res.json({ items });
});

router.post("/", async (req, res: Response) => {
  const parsed = pendudukCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  try {
    const created = await prisma.penduduk.create({ data: parsed.data });
    return res.status(201).json({ item: created });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ message: "NIK already exists" });
    }
    throw e;
  }
});

router.put("/:id", async (req, res: Response) => {
  const id = req.params.id;
  const parsed = pendudukUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  try {
    const updated = await prisma.penduduk.update({ where: { id }, data: parsed.data });
    return res.json({ item: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ message: "Not found" });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ message: "NIK already exists" });
    }
    throw e;
  }
});

router.delete("/:id", async (req, res: Response) => {
  const id = req.params.id;

  try {
    await prisma.penduduk.delete({ where: { id } });
    return res.status(204).send();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ message: "Not found" });
    }
    throw e;
  }
});

export default router;
