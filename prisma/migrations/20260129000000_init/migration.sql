-- CreateEnum
CREATE TYPE "Status" AS ENUM ('active', 'expired', 'qualified', 'rejected');

-- CreateEnum
CREATE TYPE "FunnelStep" AS ENUM ('collect_name', 'collect_birth_date', 'collect_weight_loss_reason', 'qualified', 'rejected');

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'active',
    "funnelStep" "FunnelStep" NOT NULL DEFAULT 'collect_name',
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "name" TEXT,
    "birthDate" TIMESTAMP(3),
    "weightLossReason" TEXT,
    "qualified" BOOLEAN,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_phoneNumber_key" ON "conversations"("phoneNumber");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
