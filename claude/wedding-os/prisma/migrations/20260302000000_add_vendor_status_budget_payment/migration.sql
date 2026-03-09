-- AlterTable: Add onboardingComplete to Wedding
ALTER TABLE "Wedding" ADD COLUMN "onboardingComplete" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Make User.weddingId optional
ALTER TABLE "User" ALTER COLUMN "weddingId" DROP NOT NULL;

-- AlterTable: Add deposit and paymentMethod to BudgetItem
ALTER TABLE "BudgetItem" ADD COLUMN "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "BudgetItem" ADD COLUMN "paymentMethod" TEXT;

-- AlterTable: Add status, isDefault, payment fields to Vendor; drop contractUrl
ALTER TABLE "Vendor" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "Vendor" ADD COLUMN "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Vendor" ADD COLUMN "remainingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Vendor" ADD COLUMN "paymentDate" TIMESTAMP(3);
ALTER TABLE "Vendor" DROP COLUMN IF EXISTS "contractUrl";
