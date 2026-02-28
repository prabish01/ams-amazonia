-- AlterTable
ALTER TABLE "User" ADD COLUMN     "incentive" DECIMAL(10,2),
ADD COLUMN     "monthlyAdjustment" DECIMAL(10,2),
ADD COLUMN     "monthlyDeduction" DECIMAL(10,2);
