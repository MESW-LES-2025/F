-- CreateTable
CREATE TABLE "MessageReadLog" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReadLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageReadLog_messageId_idx" ON "MessageReadLog"("messageId");

-- CreateIndex
CREATE INDEX "MessageReadLog_userId_idx" ON "MessageReadLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReadLog_messageId_userId_key" ON "MessageReadLog"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "MessageReadLog" ADD CONSTRAINT "MessageReadLog_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReadLog" ADD CONSTRAINT "MessageReadLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
