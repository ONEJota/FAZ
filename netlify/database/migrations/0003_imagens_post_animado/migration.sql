-- Usuário excluído (mantido só para o histórico)
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Imagens anexadas ao job (PIT)
CREATE TABLE "JobImage" (
    "id" SERIAL NOT NULL,
    "jobId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobImage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobImage_jobId_idx" ON "JobImage"("jobId");
ALTER TABLE "JobImage" ADD CONSTRAINT "JobImage_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobImage" ADD CONSTRAINT "JobImage_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Nova peça na categoria Social
INSERT INTO "Service" ("name","category","defaultMinutes") VALUES ('Post animado','Social',120) ON CONFLICT ("name") DO NOTHING;
