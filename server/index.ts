import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { execSync } from "node:child_process";
import bcrypt from "bcryptjs";
import authRoutes from "./routes/auth";
import pendudukRoutes from "./routes/penduduk";
import layananRoutes from "./routes/layanan";
import pengaduanRoutes from "./routes/pengaduan";
import beritaRoutes from "./routes/berita";
import statsRoutes from "./routes/stats";
import agendaRoutes from "./routes/agenda";
import siteRoutes from "./routes/site";
import chatRoutes from "./routes/chat";
import uploadsRoutes from "./routes/uploads";
import { prisma } from "./prisma";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException", err);
});

const app = express();

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@cibubur.go.id";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Admin Kelurahan";

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, role: "ADMIN" },
    update: { name, passwordHash, role: "ADMIN" },
  });
}

async function ensureDatabase() {
  try {
    await prisma.user.findFirst({ select: { id: true } });
    return;
  } catch (e) {
    const anyE = e as any;
    if (anyE?.code === "P2021") {
      try {
        await prisma.$disconnect();
      } catch {
        // ignore
      }
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
      await prisma.$connect();
      return;
    }
    throw e;
  }
}

app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
);

app.get("/", (_req, res) => {
  res.redirect("/api/health");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/penduduk", pendudukRoutes);
app.use("/api/layanan", layananRoutes);
app.use("/api/pengaduan", pengaduanRoutes);
app.use("/api/berita", beritaRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/agenda", agendaRoutes);
app.use("/api/site", siteRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/uploads", uploadsRoutes);

const port = Number(process.env.PORT || 3001);

const start = async () => {
  try {
    await ensureDatabase();
    await bootstrapAdmin();
  } catch (e) {
    console.error("bootstrapAdmin failed", e);
  }

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
};

start();
