-- CreateTable
CREATE TABLE "ClassNote" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassReminder" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "ClassReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassNote_classId_expiresAt_idx" ON "ClassNote"("classId", "expiresAt");

-- CreateIndex
CREATE INDEX "ClassReminder_deliveredAt_remindAt_idx" ON "ClassReminder"("deliveredAt", "remindAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClassReminder_classId_userId_key" ON "ClassReminder"("classId", "userId");

-- AddForeignKey
ALTER TABLE "ClassNote" ADD CONSTRAINT "ClassNote_classId_fkey" FOREIGN KEY ("classId") REFERENCES "VirtualClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassNote" ADD CONSTRAINT "ClassNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReminder" ADD CONSTRAINT "ClassReminder_classId_fkey" FOREIGN KEY ("classId") REFERENCES "VirtualClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassReminder" ADD CONSTRAINT "ClassReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

