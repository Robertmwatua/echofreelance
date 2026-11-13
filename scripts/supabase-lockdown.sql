-- Run after restoring the Prisma application schema into a NEW Supabase project.
-- The application accesses data through its server-only Postgres connection.
-- Do not expose Prisma tables through Supabase's browser Data API.
BEGIN;
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename IN (
        'User', 'Course', 'Lesson', 'LessonResource', 'LessonProgress', 'VirtualClass', 'ClassAttendance', 'Enrollment', 'Assignment', 'AssignmentSubmission', 'Challenge', 'ChallengeSolve', 'CourseReview', 'CourseAnnouncement', 'Notification', 'Certificate', 'DiscussionPost', 'LessonNote', 'ClassNote', 'ClassReminder', '_prisma_migrations'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;
COMMIT;
