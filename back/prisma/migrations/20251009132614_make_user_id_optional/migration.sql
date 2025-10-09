-- DropForeignKey
ALTER TABLE "public"."Tickets" DROP CONSTRAINT "Tickets_User_Id_fkey";

-- AlterTable
ALTER TABLE "Tickets" ALTER COLUMN "User_Id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON DELETE SET NULL ON UPDATE CASCADE;
