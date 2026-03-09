-- CreateTable
CREATE TABLE "SiteTentang" (
    "id" INTEGER NOT NULL,
    "intro" TEXT NOT NULL,
    "visi" TEXT NOT NULL,
    "misi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTentang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteKontak" (
    "id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "phones" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hours" TEXT NOT NULL,
    "mapEmbedUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteKontak_pkey" PRIMARY KEY ("id")
);
