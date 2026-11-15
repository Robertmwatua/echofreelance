ALTER TABLE "Course" ADD COLUMN "feeConfirmed" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "CourseFeeAccount" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "courseId" TEXT NOT NULL,
 "totalCents" INTEGER NOT NULL CHECK ("totalCents" >= 0), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CourseFeeAccount_userId_courseId_key" ON "CourseFeeAccount"("userId", "courseId");
CREATE TABLE "CoursePayment" (
 "id" TEXT PRIMARY KEY, "accountId" TEXT NOT NULL, "amountCents" INTEGER NOT NULL CHECK ("amountCents" > 0 AND "amountCents" % 100 = 0),
 "phone" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'Initiating' CHECK ("status" IN ('Initiating','Pending','Succeeded','Failed','Review')),
 "requestKey" TEXT NOT NULL, "activeKey" TEXT, "providerId" TEXT, "receipt" TEXT,
 "detail" TEXT NOT NULL DEFAULT 'Preparing your M-Pesa request.', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "verifiedAt" TIMESTAMP(3), "settledAt" TIMESTAMP(3),
 FOREIGN KEY ("accountId") REFERENCES "CourseFeeAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CoursePayment_requestKey_key" ON "CoursePayment"("requestKey");
CREATE UNIQUE INDEX "CoursePayment_activeKey_key" ON "CoursePayment"("activeKey");
CREATE UNIQUE INDEX "CoursePayment_providerId_key" ON "CoursePayment"("providerId");
CREATE UNIQUE INDEX "CoursePayment_receipt_key" ON "CoursePayment"("receipt");
CREATE INDEX "CoursePayment_accountId_createdAt_idx" ON "CoursePayment"("accountId", "createdAt");
CREATE INDEX "CoursePayment_status_createdAt_idx" ON "CoursePayment"("status", "createdAt");
