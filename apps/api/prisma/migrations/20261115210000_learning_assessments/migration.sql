ALTER TABLE "Assignment" ADD COLUMN "requiredForCertificate" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "passPercent" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "ClassAttendance" ADD COLUMN "attendanceStatus" TEXT, ADD COLUMN "markedAt" TIMESTAMP(3);
ALTER TABLE "SchoolTask" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'Task';
CREATE TABLE "LessonQuiz" (
 "id" TEXT NOT NULL, "lessonId" TEXT NOT NULL, "title" TEXT NOT NULL, "questions" JSONB NOT NULL,
 "passPercent" INTEGER NOT NULL DEFAULT 70, "requiredForCertificate" BOOLEAN NOT NULL DEFAULT true,
 "published" BOOLEAN NOT NULL DEFAULT false, "revision" INTEGER NOT NULL DEFAULT 1, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "LessonQuiz_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "QuizAttempt" (
 "id" TEXT NOT NULL, "quizId" TEXT NOT NULL, "userId" TEXT NOT NULL, "revision" INTEGER NOT NULL,
 "answers" JSONB NOT NULL, "score" INTEGER NOT NULL, "passed" BOOLEAN NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LessonQuiz_lessonId_key" ON "LessonQuiz"("lessonId");
CREATE INDEX "QuizAttempt_quizId_userId_revision_idx" ON "QuizAttempt"("quizId", "userId", "revision");
ALTER TABLE "LessonQuiz" ADD CONSTRAINT "LessonQuiz_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "LessonQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
