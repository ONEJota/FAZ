-- Andamento das tarefas: Pendente, Em andamento, Concluída ou Repassada para outro setor
ALTER TABLE "Task" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'PENDENTE';
UPDATE "Task" SET "status" = 'CONCLUIDA' WHERE "done" = true;
