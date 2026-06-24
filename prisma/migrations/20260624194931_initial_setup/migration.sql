-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'perito', 'assistente');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('backlog', 'aguardando_doc', 'diligencia', 'elaboracao', 'revisao', 'concluido');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('pendente', 'parcial', 'pago');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'perito',
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Processo" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "numero_processo" TEXT NOT NULL,
    "vara_comarca" TEXT NOT NULL,
    "tipo_pericia" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'backlog',
    "data_nomeacao" TIMESTAMP(3) NOT NULL,
    "prazo_entrega" TIMESTAMP(3) NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Processo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Honorario" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "valor_total" DOUBLE PRECISION NOT NULL,
    "valor_recebido" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'pendente',
    "data_vencimento" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Honorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "url_arquivo" TEXT NOT NULL,
    "data_upload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vistoria" (
    "id" TEXT NOT NULL,
    "processo_id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "contato" TEXT NOT NULL,

    CONSTRAINT "Vistoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Processo" ADD CONSTRAINT "Processo_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Honorario" ADD CONSTRAINT "Honorario_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vistoria" ADD CONSTRAINT "Vistoria_processo_id_fkey" FOREIGN KEY ("processo_id") REFERENCES "Processo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
