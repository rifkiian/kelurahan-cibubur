import { Router, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

const getBeritaModel = () => (prisma as unknown as { berita?: any }).berita;

// Public: published berita
router.get("/public", async (req, res: Response) => {
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : undefined;
  const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw) || 0)) : undefined;

  const berita = getBeritaModel();
  if (berita) {
    const items = await berita.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    return res.json({ items });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Berita"
    WHERE "published" = true
    ORDER BY COALESCE("publishedAt", "createdAt") DESC
    ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
  `;
  return res.json({ items });
});

router.get("/public/:slug", async (req, res: Response) => {
  const slug = req.params.slug;
  const berita = getBeritaModel();

  if (berita) {
    const item = await berita.findFirst({ where: { slug, published: true } });
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json({ item });
  }

  const rows = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Berita"
    WHERE "slug" = ${slug} AND "published" = true
    LIMIT 1
  `;

  const item = rows?.[0];
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
});

router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const beritaCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().optional().nullable(),
  content: z.string().min(1),
  coverImageUrl: z.string().url().optional().nullable(),
  published: z.boolean().optional().default(false),
});

const beritaUpdateSchema = beritaCreateSchema.partial();

router.get("/", async (_req, res: Response) => {
  const berita = getBeritaModel();

  if (berita) {
    const items = await berita.findMany({ orderBy: { createdAt: "desc" } });
    return res.json({ items });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Berita" ORDER BY "createdAt" DESC
  `;
  return res.json({ items });
});

router.post("/", async (req, res: Response) => {
  const parsed = beritaCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const berita = getBeritaModel();

  try {
    if (berita) {
      const created = await berita.create({
        data: {
          slug: parsed.data.slug,
          title: parsed.data.title,
          excerpt: parsed.data.excerpt || null,
          content: parsed.data.content,
          coverImageUrl: parsed.data.coverImageUrl || null,
          published: parsed.data.published,
          publishedAt: parsed.data.published ? new Date() : null,
        },
      });
      return res.status(201).json({ item: created });
    }

    const exists = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM "Berita" WHERE "slug" = ${parsed.data.slug} LIMIT 1
    `;
    if (exists.length > 0) return res.status(409).json({ message: "Slug already exists" });

    const id = randomUUID();
    const publishedAt = parsed.data.published ? new Date() : null;

    const createdRows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Berita" (
        "id",
        "slug",
        "title",
        "excerpt",
        "content",
        "coverImageUrl",
        "published",
        "publishedAt",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${parsed.data.slug},
        ${parsed.data.title},
        ${parsed.data.excerpt || null},
        ${parsed.data.content},
        ${parsed.data.coverImageUrl || null},
        ${parsed.data.published},
        ${publishedAt},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const created = createdRows?.[0];
    return res.status(201).json({ item: created });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ message: "Slug already exists" });
    }
    throw e;
  }
});

router.put("/:id", async (req, res: Response) => {
  const id = req.params.id;
  const parsed = beritaUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const berita = getBeritaModel();

  try {
    if (berita) {
      const updated = await berita.update({
        where: { id },
        data: {
          slug: parsed.data.slug,
          title: parsed.data.title,
          excerpt: parsed.data.excerpt === undefined ? undefined : parsed.data.excerpt || null,
          content: parsed.data.content,
          coverImageUrl: parsed.data.coverImageUrl === undefined ? undefined : parsed.data.coverImageUrl || null,
          published: parsed.data.published,
          publishedAt:
            parsed.data.published === undefined
              ? undefined
              : parsed.data.published
                ? new Date()
                : null,
        },
      });
      return res.json({ item: updated });
    }

    if (parsed.data.slug) {
      const conflict = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM "Berita" WHERE "slug" = ${parsed.data.slug} AND "id" <> ${id} LIMIT 1
      `;
      if (conflict.length > 0) return res.status(409).json({ message: "Slug already exists" });
    }

    const updateRows = await prisma.$queryRaw<any[]>`
      UPDATE "Berita"
      SET
        "slug" = COALESCE(${parsed.data.slug}, "slug"),
        "title" = COALESCE(${parsed.data.title}, "title"),
        "excerpt" = CASE WHEN ${parsed.data.excerpt === undefined} THEN "excerpt" ELSE ${parsed.data.excerpt || null} END,
        "content" = COALESCE(${parsed.data.content}, "content"),
        "coverImageUrl" = CASE WHEN ${parsed.data.coverImageUrl === undefined} THEN "coverImageUrl" ELSE ${parsed.data.coverImageUrl || null} END,
        "published" = COALESCE(${parsed.data.published}, "published"),
        "publishedAt" = CASE
          WHEN ${parsed.data.published === undefined} THEN "publishedAt"
          WHEN ${parsed.data.published === true} THEN NOW()
          ELSE NULL
        END,
        "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    const updated = updateRows?.[0];
    if (!updated) return res.status(404).json({ message: "Not found" });
    return res.json({ item: updated });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return res.status(404).json({ message: "Not found" });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ message: "Slug already exists" });
    }
    throw e;
  }
});

router.delete("/:id", async (req, res: Response) => {
  const id = req.params.id;

  const berita = getBeritaModel();

  try {
    if (berita) {
      await berita.delete({ where: { id } });
      return res.status(204).send();
    }

    const deletedRows = await prisma.$queryRaw<any[]>`
      DELETE FROM "Berita" WHERE "id" = ${id} RETURNING "id"
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
