-- CreateTable
CREATE TABLE "User_Queues" (
    "Id" UUID NOT NULL,
    "User_Id" UUID NOT NULL,
    "Queue_Id" UUID NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_Queues_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE INDEX "User_Queues_User_Id_idx" ON "User_Queues"("User_Id");

-- CreateIndex
CREATE INDEX "User_Queues_Queue_Id_idx" ON "User_Queues"("Queue_Id");

-- CreateIndex
CREATE UNIQUE INDEX "User_Queues_User_Id_Queue_Id_key" ON "User_Queues"("User_Id", "Queue_Id");

-- AddForeignKey
ALTER TABLE "User_Queues" ADD CONSTRAINT "User_Queues_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Queues" ADD CONSTRAINT "User_Queues_Queue_Id_fkey" FOREIGN KEY ("Queue_Id") REFERENCES "Queues"("Id") ON DELETE CASCADE ON UPDATE CASCADE;
