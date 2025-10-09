-- CreateTable
CREATE TABLE "Companies" (
    "Id" UUID NOT NULL,
    "Name" VARCHAR(150) NOT NULL,
    "CNPJ" CHAR(14),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Companies_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Users" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID,
    "Name" VARCHAR(100) NOT NULL,
    "Email" VARCHAR(150) NOT NULL,
    "Password_Hash" VARCHAR(255) NOT NULL,
    "Role" INTEGER NOT NULL,
    "Is_Active" BOOLEAN NOT NULL DEFAULT true,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Users_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Clients" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Name" VARCHAR(120) NOT NULL,
    "WhatsApp_Number" VARCHAR(20) NOT NULL,
    "WA_User_Id" VARCHAR(64),
    "Chat_Id_Alias" VARCHAR(128),
    "Profile_Pic_URL" TEXT,
    "Is_Blocked" BOOLEAN NOT NULL DEFAULT false,
    "Last_Contact_At" TIMESTAMP(3),
    "Language" VARCHAR(10),
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Queues" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "Greeting_Message" TEXT NOT NULL,
    "Is_Active" BOOLEAN NOT NULL DEFAULT true,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Queues_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Categories" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(255) NOT NULL,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categories_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Tickets" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Client_Id" UUID NOT NULL,
    "User_Id" UUID NOT NULL,
    "Queue_Id" UUID,
    "Category_Id" UUID,
    "Chat_Id" UUID,
    "Subject" VARCHAR(200) NOT NULL,
    "Resolution_Text" TEXT,
    "Status" INTEGER NOT NULL,
    "Priority" INTEGER,
    "SLA_Due_At" TIMESTAMP(3),
    "Last_Message_At" TIMESTAMP(3),
    "Reopened_Count" INTEGER NOT NULL DEFAULT 0,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,
    "Deleted_At" TIMESTAMP(3),

    CONSTRAINT "Tickets_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Sessions" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Name" VARCHAR(100) NOT NULL,
    "Phone_Number" VARCHAR(20) NOT NULL,
    "Status" INTEGER NOT NULL,
    "Session_Token" VARCHAR(255) NOT NULL,
    "Last_Heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Webhook_URL" TEXT,
    "Proxy_Config" TEXT,
    "QR_SVG" TEXT,
    "QR_Expires_At" TIMESTAMP(3),
    "Reauth_Required" BOOLEAN NOT NULL DEFAULT false,
    "Storage_Type" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sessions_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Chats" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Id" UUID NOT NULL,
    "Client_Id" UUID,
    "WA_Chat_Id" VARCHAR(64) NOT NULL,
    "Type" INTEGER NOT NULL,
    "Is_Archived" BOOLEAN NOT NULL DEFAULT false,
    "Is_Muted" BOOLEAN NOT NULL DEFAULT false,
    "Last_Message_At" TIMESTAMP(3),
    "Unread_Count" INTEGER NOT NULL DEFAULT 0,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chats_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Media" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Storage_Provider" VARCHAR(20) NOT NULL,
    "Storage_Key" TEXT NOT NULL,
    "Mime_Type" TEXT NOT NULL,
    "Size_Bytes" INTEGER NOT NULL,
    "SHA256" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Messages" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Id" UUID NOT NULL,
    "Chat_Id" UUID NOT NULL,
    "Direction" INTEGER NOT NULL,
    "Type" INTEGER NOT NULL,
    "Body" TEXT,
    "Caption" TEXT,
    "Media_Id" UUID,
    "WA_Message_Id" VARCHAR(128) NOT NULL,
    "WA_Timestamp" TIMESTAMP(3),
    "Status" INTEGER NOT NULL,
    "Error_Code" TEXT,
    "Error_Message" TEXT,
    "Metadata_JSON" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Messages_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Message_Status_History" (
    "Id" UUID NOT NULL,
    "Message_Id" UUID NOT NULL,
    "Status" INTEGER NOT NULL,
    "Occurred_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_Status_History_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Webhook_Events" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Id" UUID NOT NULL,
    "Event_Type" VARCHAR(50) NOT NULL,
    "Payload_JSON" TEXT NOT NULL,
    "Received_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Processed_At" TIMESTAMP(3),
    "Process_Status" INTEGER NOT NULL,
    "Error_Message" TEXT,

    CONSTRAINT "Webhook_Events_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Outbox" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Id" UUID NOT NULL,
    "Chat_Id" UUID NOT NULL,
    "To_WA_User_Id" VARCHAR(64) NOT NULL,
    "Payload_JSON" TEXT NOT NULL,
    "Idempotency_Key" TEXT NOT NULL,
    "Attempts" INTEGER NOT NULL DEFAULT 0,
    "Next_Attempt_At" TIMESTAMP(3),
    "Status" INTEGER NOT NULL,
    "Last_Error" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Session_Logs" (
    "Id" UUID NOT NULL,
    "Company_Id" UUID NOT NULL,
    "Session_Id" UUID NOT NULL,
    "Level" INTEGER NOT NULL,
    "Message" TEXT NOT NULL,
    "Meta_JSON" TEXT,
    "Created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_Logs_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Companies_CNPJ_key" ON "Companies"("CNPJ");

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE INDEX "Users_Company_Id_idx" ON "Users"("Company_Id");

-- CreateIndex
CREATE INDEX "Clients_Company_Id_idx" ON "Clients"("Company_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_Company_Id_WhatsApp_Number_key" ON "Clients"("Company_Id", "WhatsApp_Number");

-- CreateIndex
CREATE INDEX "Queues_Company_Id_idx" ON "Queues"("Company_Id");

-- CreateIndex
CREATE INDEX "Categories_Company_Id_idx" ON "Categories"("Company_Id");

-- CreateIndex
CREATE INDEX "Tickets_Company_Id_idx" ON "Tickets"("Company_Id");

-- CreateIndex
CREATE INDEX "Tickets_Client_Id_idx" ON "Tickets"("Client_Id");

-- CreateIndex
CREATE INDEX "Tickets_User_Id_idx" ON "Tickets"("User_Id");

-- CreateIndex
CREATE INDEX "Tickets_Queue_Id_idx" ON "Tickets"("Queue_Id");

-- CreateIndex
CREATE INDEX "Tickets_Category_Id_idx" ON "Tickets"("Category_Id");

-- CreateIndex
CREATE INDEX "Tickets_Chat_Id_idx" ON "Tickets"("Chat_Id");

-- CreateIndex
CREATE INDEX "Sessions_Company_Id_idx" ON "Sessions"("Company_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Sessions_Company_Id_Phone_Number_key" ON "Sessions"("Company_Id", "Phone_Number");

-- CreateIndex
CREATE INDEX "Chats_Company_Id_idx" ON "Chats"("Company_Id");

-- CreateIndex
CREATE INDEX "Chats_Session_Id_idx" ON "Chats"("Session_Id");

-- CreateIndex
CREATE INDEX "Chats_Client_Id_idx" ON "Chats"("Client_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Chats_Company_Id_Session_Id_WA_Chat_Id_key" ON "Chats"("Company_Id", "Session_Id", "WA_Chat_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Media_SHA256_key" ON "Media"("SHA256");

-- CreateIndex
CREATE INDEX "Media_Company_Id_idx" ON "Media"("Company_Id");

-- CreateIndex
CREATE INDEX "Messages_Company_Id_idx" ON "Messages"("Company_Id");

-- CreateIndex
CREATE INDEX "Messages_Session_Id_idx" ON "Messages"("Session_Id");

-- CreateIndex
CREATE INDEX "Messages_Chat_Id_Created_At_idx" ON "Messages"("Chat_Id", "Created_At");

-- CreateIndex
CREATE INDEX "Messages_Media_Id_idx" ON "Messages"("Media_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Messages_Company_Id_Session_Id_WA_Message_Id_key" ON "Messages"("Company_Id", "Session_Id", "WA_Message_Id");

-- CreateIndex
CREATE INDEX "Message_Status_History_Message_Id_idx" ON "Message_Status_History"("Message_Id");

-- CreateIndex
CREATE INDEX "Webhook_Events_Company_Id_idx" ON "Webhook_Events"("Company_Id");

-- CreateIndex
CREATE INDEX "Webhook_Events_Session_Id_idx" ON "Webhook_Events"("Session_Id");

-- CreateIndex
CREATE UNIQUE INDEX "Outbox_Idempotency_Key_key" ON "Outbox"("Idempotency_Key");

-- CreateIndex
CREATE INDEX "Outbox_Company_Id_idx" ON "Outbox"("Company_Id");

-- CreateIndex
CREATE INDEX "Outbox_Session_Id_idx" ON "Outbox"("Session_Id");

-- CreateIndex
CREATE INDEX "Outbox_Chat_Id_idx" ON "Outbox"("Chat_Id");

-- CreateIndex
CREATE INDEX "Session_Logs_Company_Id_idx" ON "Session_Logs"("Company_Id");

-- CreateIndex
CREATE INDEX "Session_Logs_Session_Id_idx" ON "Session_Logs"("Session_Id");

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queues" ADD CONSTRAINT "Queues_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categories" ADD CONSTRAINT "Categories_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_Client_Id_fkey" FOREIGN KEY ("Client_Id") REFERENCES "Clients"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_User_Id_fkey" FOREIGN KEY ("User_Id") REFERENCES "Users"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_Queue_Id_fkey" FOREIGN KEY ("Queue_Id") REFERENCES "Queues"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_Category_Id_fkey" FOREIGN KEY ("Category_Id") REFERENCES "Categories"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tickets" ADD CONSTRAINT "Tickets_Chat_Id_fkey" FOREIGN KEY ("Chat_Id") REFERENCES "Chats"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessions" ADD CONSTRAINT "Sessions_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_Session_Id_fkey" FOREIGN KEY ("Session_Id") REFERENCES "Sessions"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chats" ADD CONSTRAINT "Chats_Client_Id_fkey" FOREIGN KEY ("Client_Id") REFERENCES "Clients"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_Session_Id_fkey" FOREIGN KEY ("Session_Id") REFERENCES "Sessions"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_Chat_Id_fkey" FOREIGN KEY ("Chat_Id") REFERENCES "Chats"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Messages" ADD CONSTRAINT "Messages_Media_Id_fkey" FOREIGN KEY ("Media_Id") REFERENCES "Media"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message_Status_History" ADD CONSTRAINT "Message_Status_History_Message_Id_fkey" FOREIGN KEY ("Message_Id") REFERENCES "Messages"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook_Events" ADD CONSTRAINT "Webhook_Events_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Webhook_Events" ADD CONSTRAINT "Webhook_Events_Session_Id_fkey" FOREIGN KEY ("Session_Id") REFERENCES "Sessions"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_Session_Id_fkey" FOREIGN KEY ("Session_Id") REFERENCES "Sessions"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_Chat_Id_fkey" FOREIGN KEY ("Chat_Id") REFERENCES "Chats"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session_Logs" ADD CONSTRAINT "Session_Logs_Company_Id_fkey" FOREIGN KEY ("Company_Id") REFERENCES "Companies"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session_Logs" ADD CONSTRAINT "Session_Logs_Session_Id_fkey" FOREIGN KEY ("Session_Id") REFERENCES "Sessions"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
