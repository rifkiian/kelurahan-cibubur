import { Router, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

const getAgendaModel = () => (prisma as unknown as { agenda?: any }).agenda;

// Public: agenda
router.get("/public", async (req, res: Response) => {
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : undefined;
  const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw) || 0)) : undefined;

  const allRaw = typeof req.query.all === "string" ? req.query.all : undefined;
  const all = allRaw === "1" || allRaw === "true";

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const agenda = getAgendaModel();
  if (agenda) {
    const items = await agenda.findMany({
      where: all ? undefined : { startAt: { gte: since } },
      orderBy: { startAt: "asc" },
      ...(limit ? { take: limit } : {}),
    });
    return res.json({ items });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Agenda"
    WHERE ${all ? Prisma.sql`true` : Prisma.sql`"startAt" >= NOW() - interval '1 day'`}
    ORDER BY "startAt" ASC
    ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
  `;
  return res.json({ items });
});

router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const agendaCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  startAt: z.string().min(1),
  endAt: z.string().optional().nullable(),
});

router.get("/", async (req, res: Response) => {
  const allRaw = typeof req.query.all === "string" ? req.query.all : undefined;
  const all = allRaw === "1" || allRaw === "true";

  const agenda = getAgendaModel();

  if (agenda) {
    const items = await agenda.findMany({
      where: all ? undefined : { startAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      orderBy: { startAt: "asc" },
    });
    return res.json({ items });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Agenda"
    WHERE ${all ? Prisma.sql`true` : Prisma.sql`"startAt" >= NOW() - interval '1 day'`}
    ORDER BY "startAt" ASC
  `;

  return res.json({ items });
});

router.post("/", async (req, res: Response) => {
  const parsed = agendaCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const startAt = new Date(parsed.data.startAt);
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;

  if (Number.isNaN(startAt.getTime())) return res.status(400).json({ message: "Invalid startAt" });
  if (endAt && Number.isNaN(endAt.getTime())) return res.status(400).json({ message: "Invalid endAt" });

  const agenda = getAgendaModel();

  try {
    if (agenda) {
      const created = await agenda.create({
        data: {
          title: parsed.data.title,
          description: parsed.data.description || null,
          location: parsed.data.location || null,
          startAt,
          endAt,
        },
      });
      return res.status(201).json({ item: created });
    }

    const id = randomUUID();

    const createdRows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Agenda" (
        "id",
        "title",
        "description",
        "location",
        "startAt",
        "endAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${parsed.data.title},
        ${parsed.data.description || null},
        ${parsed.data.location || null},
        ${startAt},
        ${endAt},
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

export default router;
