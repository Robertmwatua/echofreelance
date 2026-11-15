ALTER TABLE "Lesson" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE "JobPosting" (
 "id" TEXT PRIMARY KEY,"title" TEXT NOT NULL,"company" TEXT NOT NULL,"location" TEXT NOT NULL,"kind" TEXT NOT NULL,"description" TEXT NOT NULL,"deadline" TIMESTAMP(3),"published" BOOLEAN NOT NULL DEFAULT false,"createdById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 FOREIGN KEY("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE INDEX "JobPosting_published_deadline_idx" ON "JobPosting"("published","deadline");
CREATE TABLE "JobApplication" (
 "id" TEXT PRIMARY KEY,"jobId" TEXT NOT NULL,"userId" TEXT NOT NULL,"coverLetter" TEXT NOT NULL,"resumeUrl" TEXT NOT NULL,"portfolioUrl" TEXT,"status" TEXT NOT NULL DEFAULT 'Received',"reviewNotes" TEXT NOT NULL DEFAULT '',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 FOREIGN KEY("jobId") REFERENCES "JobPosting"("id") ON DELETE RESTRICT ON UPDATE CASCADE,FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE UNIQUE INDEX "JobApplication_jobId_userId_key" ON "JobApplication"("jobId","userId");
CREATE INDEX "JobApplication_status_createdAt_idx" ON "JobApplication"("status","createdAt");
CREATE TABLE "AdmissionEnquiry" (
 "id" TEXT PRIMARY KEY,"courseId" TEXT,"name" TEXT NOT NULL,"email" TEXT NOT NULL,"phone" TEXT,"message" TEXT NOT NULL,"status" TEXT NOT NULL DEFAULT 'New',"notes" TEXT NOT NULL DEFAULT '',"consentedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 FOREIGN KEY("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE INDEX "AdmissionEnquiry_status_createdAt_idx" ON "AdmissionEnquiry"("status","createdAt");
CREATE TABLE "SchoolTask" (
 "id" TEXT PRIMARY KEY,"title" TEXT NOT NULL,"details" TEXT NOT NULL DEFAULT '',"dueAt" TIMESTAMP(3) NOT NULL,"done" BOOLEAN NOT NULL DEFAULT false,"assigneeId" TEXT,"createdById" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,
 FOREIGN KEY("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,FOREIGN KEY("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE INDEX "SchoolTask_done_dueAt_idx" ON "SchoolTask"("done","dueAt");
CREATE TABLE "SubmissionLimit" ("bucket" TEXT PRIMARY KEY,"count" INTEGER NOT NULL DEFAULT 1,"expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "SubmissionLimit_expiresAt_idx" ON "SubmissionLimit"("expiresAt");

-- Some deployed databases already have the earlier session-revocation migration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Course" ADD COLUMN "depositPercent" INTEGER NOT NULL DEFAULT 50 CHECK ("depositPercent" BETWEEN 1 AND 100), ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0 CHECK ("discountPercent" BETWEEN 0 AND 100), ADD COLUMN "discountUntil" TIMESTAMP(3), ADD COLUMN "programmeDuration" TEXT, ADD COLUMN "registrationFeeCents" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "certificationFeeCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CourseFeeAccount" ADD COLUMN "baseCents" INTEGER, ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "unlockCents" INTEGER NOT NULL DEFAULT 100, ADD COLUMN "depositPercent" INTEGER NOT NULL DEFAULT 0;
UPDATE "CourseFeeAccount" SET "baseCents" = "totalCents";
CREATE TABLE "AccountToken" ("id" TEXT PRIMARY KEY,"hash" TEXT NOT NULL UNIQUE,"purpose" TEXT NOT NULL,"userId" TEXT,"expiresAt" TIMESTAMP(3) NOT NULL,"usedAt" TIMESTAMP(3),"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "AccountToken_expiresAt_idx" ON "AccountToken"("expiresAt");
CREATE TABLE "GoogleIdentity" ("subject" TEXT PRIMARY KEY,"userId" TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
