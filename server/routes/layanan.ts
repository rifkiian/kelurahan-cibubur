import { Router, type Response } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "../prisma";
import { requireAuth, type AuthenticatedRequest } from "../auth";

const router = Router();

const DEFAULT_COLOR = "bg-primary/10 text-primary";
const ATTACHMENT_PREFIX = "__ATTACHMENT_URL__=";
const ALUR_PREFIX = "__ALUR__=";
const EXTERNAL_LINK_PREFIX = "__EXTERNAL_LINK__=";

const stripMeta = (persyaratan: unknown) => {
  const list = Array.isArray(persyaratan)
    ? ((persyaratan as unknown[]).filter((x) => typeof x === "string") as string[])
    : [];
  const attachmentEntry = list.find((s) => s.startsWith(ATTACHMENT_PREFIX));
  const attachmentUrl = attachmentEntry ? attachmentEntry.slice(ATTACHMENT_PREFIX.length) : null;
  const alur = list
    .filter((s) => s.startsWith(ALUR_PREFIX))
    .map((s) => s.slice(ALUR_PREFIX.length))
    .map((s) => s.trim())
    .filter(Boolean);
  const externalLinkEntry = list.find((s) => s.startsWith(EXTERNAL_LINK_PREFIX));
  const externalLink = externalLinkEntry ? externalLinkEntry.slice(EXTERNAL_LINK_PREFIX.length) : null;
  const cleaned = list.filter((s) => !s.startsWith(ATTACHMENT_PREFIX) && !s.startsWith(ALUR_PREFIX) && !s.startsWith(EXTERNAL_LINK_PREFIX));
  return { persyaratan: cleaned, attachmentUrl, alur, externalLink };
};

const withMeta = (persyaratan: string[], attachmentUrl?: string | null, alur?: string[], externalLink?: string | null) => {
  const cleaned = (persyaratan || []).filter(
    (s) =>
      typeof s === "string" &&
      !s.startsWith(ATTACHMENT_PREFIX) &&
      !s.startsWith(ALUR_PREFIX) &&
      !s.startsWith(EXTERNAL_LINK_PREFIX),
  );
  const next: string[] = [...cleaned];
  if (attachmentUrl) next.push(`${ATTACHMENT_PREFIX}${attachmentUrl}`);
  const steps = Array.isArray(alur) ? alur.map((s) => String(s).trim()).filter(Boolean) : [];
  for (const step of steps) next.push(`${ALUR_PREFIX}${step}`);
  if (externalLink) next.push(`${EXTERNAL_LINK_PREFIX}${externalLink}`);
  return next;
};

const getLayananModel = () => (prisma as unknown as { layanan?: any }).layanan;

// Public
router.get("/public", async (req, res: Response) => {
  const limitRaw = typeof req.query.limit === "string" ? req.query.limit : undefined;
  const limit = limitRaw ? Math.max(1, Math.min(50, Number(limitRaw) || 0)) : undefined;

  const layanan = getLayananModel();
  if (layanan) {
    const items = await layanan.findMany({
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: limit } : {}),
    });
    const mapped = items.map((it: any) => {
      const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(it.persyaratan);
      return { ...it, persyaratan, attachmentUrl, alur, externalLink };
    });
    return res.json({ items: mapped });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT *
    FROM "Layanan"
    ORDER BY "createdAt" DESC
    ${limit ? Prisma.sql`LIMIT ${limit}` : Prisma.empty}
  `;
  const mapped = (items || []).map((it: any) => {
    const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(it.persyaratan);
    return { ...it, persyaratan, attachmentUrl, alur, externalLink };
  });
  return res.json({ items: mapped });
});

router.get("/public/:slug", async (req, res: Response) => {
  const slug = req.params.slug;
  const layanan = getLayananModel();
  if (layanan) {
    const item = await layanan.findUnique({ where: { slug } });
    if (!item) return res.status(404).json({ message: "Not found" });
    const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta((item as any).persyaratan);
    return res.json({ item: { ...(item as any), persyaratan, attachmentUrl, alur, externalLink } });
  }

  const rows = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Layanan" WHERE "slug" = ${slug} LIMIT 1
  `;
  const item = rows?.[0];
  if (!item) return res.status(404).json({ message: "Not found" });
  const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(item.persyaratan);
  return res.json({ item: { ...item, persyaratan, attachmentUrl, alur, externalLink } });
});

// Admin-only
router.use((req, res, next) => requireAuth(req as AuthenticatedRequest, res, next));
router.use((req, res, next) => {
  const auth = (req as AuthenticatedRequest).auth;
  if (!auth || auth.role !== "ADMIN") return res.status(403).json({ message: "Forbidden" });
  next();
});

const layananCreateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  color: z.string().min(1).optional(),
  persyaratan: z.array(z.string()).optional(),
  attachmentUrl: z.string().min(1).optional().nullable(),
  alur: z.array(z.string()).optional(),
  externalLink: z.string().min(1).optional().nullable(),
});

const layananUpdateSchema = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  persyaratan: z.array(z.string()).optional(),
  attachmentUrl: z.string().min(1).optional().nullable(),
  alur: z.array(z.string()).optional(),
  externalLink: z.string().min(1).optional().nullable(),
});

router.get("/", async (_req, res: Response) => {
  const layanan = getLayananModel();

  if (layanan) {
    const items = await layanan.findMany({ orderBy: { createdAt: "desc" } });
    const mapped = items.map((it: any) => {
      const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(it.persyaratan);
      return { ...it, persyaratan, attachmentUrl, alur, externalLink };
    });
    return res.json({ items: mapped });
  }

  const items = await prisma.$queryRaw<any[]>`
    SELECT * FROM "Layanan" ORDER BY "createdAt" DESC
  `;
  const mapped = (items || []).map((it: any) => {
    const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(it.persyaratan);
    return { ...it, persyaratan, attachmentUrl, alur, externalLink };
  });
  return res.json({ items: mapped });
});

router.post("/attachment", async (req, res: Response) => {
  const schema = z.object({
    fileName: z.string().min(1),
    mimeType: z.enum(["application/pdf", "image/jpeg"]),
    dataBase64: z.string().min(1),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const maxBytes = 5 * 1024 * 1024;
  const buffer = Buffer.from(parsed.data.dataBase64, "base64");
  if (!buffer.length || buffer.length > maxBytes) {
    return res.status(400).json({ message: "File terlalu besar (maks 5MB)" });
  }

  const ext = parsed.data.mimeType === "application/pdf" ? "pdf" : "jpg";
  const safeName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "uploads", "layanan");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, safeName), buffer);

  return res.status(201).json({ url: `/uploads/layanan/${safeName}` });
});

router.post("/", async (req, res: Response) => {
  const parsed = layananCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const layanan = getLayananModel();
  const payload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description,
    color: parsed.data.color || DEFAULT_COLOR,
    persyaratan: withMeta(parsed.data.persyaratan || [], parsed.data.attachmentUrl, parsed.data.alur || [], parsed.data.externalLink),
  };

  try {
    if (layanan) {
      const created = await layanan.create({ data: payload });
      const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta((created as any).persyaratan);
      return res.status(201).json({ item: { ...(created as any), persyaratan, attachmentUrl, alur, externalLink } });
    }

    const id = randomUUID();
    const createdRows = await prisma.$queryRaw<any[]>`
      INSERT INTO "Layanan" (
        "id",
        "slug",
        "title",
        "description",
        "color",
        "persyaratan",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${payload.slug},
        ${payload.title},
        ${payload.description},
        ${payload.color},
        ${payload.persyaratan},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    const created = createdRows?.[0];
    const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(created?.persyaratan);
    return res.status(201).json({ item: { ...created, persyaratan, attachmentUrl, alur, externalLink } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return res.status(409).json({ message: "Slug already exists" });
    }
    throw e;
  }
});

router.put("/:id", async (req, res: Response) => {
  const id = req.params.id;
  const parsed = layananUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid request" });

  const layanan = getLayananModel();

  try {
    if (layanan) {
      const current = await layanan.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ message: "Not found" });

      const currentSplit = stripMeta((current as any).persyaratan);
      const nextAttachmentUrl = typeof parsed.data.attachmentUrl !== "undefined"
        ? (parsed.data.attachmentUrl as any)
        : currentSplit.attachmentUrl;
      const nextAlur = typeof (parsed.data as any).alur !== "undefined"
        ? ((parsed.data as any).alur as any)
        : currentSplit.alur;
      const nextExternalLink = typeof (parsed.data as any).externalLink !== "undefined"
        ? ((parsed.data as any).externalLink as any)
        : currentSplit.externalLink;
      const nextPersyaratanBase = parsed.data.persyaratan ? (parsed.data.persyaratan as any) : currentSplit.persyaratan;
      const nextPersyaratan = withMeta(nextPersyaratanBase, nextAttachmentUrl, nextAlur, nextExternalLink);

      const dataToUpdate: any = { ...parsed.data };
      delete dataToUpdate.attachmentUrl;
      delete dataToUpdate.alur;
      delete dataToUpdate.externalLink;
      dataToUpdate.persyaratan = nextPersyaratan;

      const updated = await layanan.update({ where: { id }, data: dataToUpdate });
      const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta((updated as any).persyaratan);
      return res.json({ item: { ...(updated as any), persyaratan, attachmentUrl, alur, externalLink } });
    }

    const currentRows = await prisma.$queryRaw<any[]>`
      SELECT * FROM "Layanan" WHERE "id" = ${id} LIMIT 1
    `;
    const current = currentRows?.[0];
    if (!current) return res.status(404).json({ message: "Not found" });

    const currentSplit = stripMeta(current.persyaratan);
    const nextAttachmentUrl = typeof parsed.data.attachmentUrl !== "undefined"
      ? (parsed.data.attachmentUrl as any)
      : currentSplit.attachmentUrl;
    const nextAlur = typeof (parsed.data as any).alur !== "undefined"
      ? ((parsed.data as any).alur as any)
      : currentSplit.alur;
    const nextExternalLink = typeof (parsed.data as any).externalLink !== "undefined"
      ? ((parsed.data as any).externalLink as any)
      : currentSplit.externalLink;

    const next = {
      slug: parsed.data.slug ?? current.slug,
      title: parsed.data.title ?? current.title,
      description: parsed.data.description ?? current.description,
      color: parsed.data.color ?? current.color ?? DEFAULT_COLOR,
      persyaratan: parsed.data.persyaratan
        ? withMeta(parsed.data.persyaratan as any, nextAttachmentUrl, nextAlur, nextExternalLink)
        : withMeta(currentSplit.persyaratan, nextAttachmentUrl, nextAlur, nextExternalLink),
    };

    const updatedRows = await prisma.$queryRaw<any[]>`
      UPDATE "Layanan"
      SET
        "slug" = ${next.slug},
        "title" = ${next.title},
        "description" = ${next.description},
        "color" = ${next.color},
        "persyaratan" = ${next.persyaratan},
        "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    const updated = updatedRows?.[0];
    if (!updated) return res.status(404).json({ message: "Not found" });
    const { persyaratan, attachmentUrl, alur, externalLink } = stripMeta(updated.persyaratan);
    return res.json({ item: { ...updated, persyaratan, attachmentUrl, alur, externalLink } });
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

  const layanan = getLayananModel();
  try {
    if (layanan) {
      await layanan.delete({ where: { id } });
      return res.status(204).send();
    }

    const deletedRows = await prisma.$queryRaw<any[]>`
      DELETE FROM "Layanan" WHERE "id" = ${id} RETURNING "id"
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
