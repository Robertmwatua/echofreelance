-- Rename Instructor -> Tutor on Role enum (Postgres 10+)
ALTER TYPE "Role" RENAME VALUE 'Instructor' TO 'Tutor';

-- Course: rename instructorId -> tutorId, add category, default published false for new semantics
ALTER TABLE "Course" RENAME COLUMN "instructorId" TO "tutorId";
ALTER TABLE "Course" RENAME CONSTRAINT "Course_instructorId_fkey" TO "Course_tutorId_fkey";
ALTER TABLE "Course" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "Course" ALTER COLUMN "published" SET DEFAULT false;

-- User profile fields
ALTER TABLE "User" ADD COLUMN "bio" TEXT;
ALTER TABLE "User" ADD COLUMN "headline" TEXT;

-- ClassStatus enum
CREATE TYPE "ClassStatus" AS ENUM ('Scheduled', 'Live', 'Completed', 'Cancelled');

-- Lesson
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- VirtualClass
CREATE TABLE "VirtualClass" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VirtualClass_pkey" PRIMARY KEY ("id")
);

-- ClassAttendance
CREATE TABLE "ClassAttendance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassAttendance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lesson_courseId_order_idx" ON "Lesson"("courseId", "order");
CREATE INDEX "VirtualClass_startsAt_idx" ON "VirtualClass"("startsAt");
CREATE INDEX "VirtualClass_courseId_idx" ON "VirtualClass"("courseId");
CREATE UNIQUE INDEX "ClassAttendance_classId_userId_key" ON "ClassAttendance"("classId", "userId");

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VirtualClass" ADD CONSTRAINT "VirtualClass_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VirtualClass" ADD CONSTRAINT "VirtualClass_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "VirtualClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
