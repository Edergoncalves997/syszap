-- AlterTable
ALTER TABLE "Categories" ADD COLUMN     "Deleted_At" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Sessions" ADD COLUMN     "Deleted_At" TIMESTAMP(3);
