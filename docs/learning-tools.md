# Learning tools release

## Where to use them

- **Tutor → course → Students and teaching tools**: create assignments, set points, due date and an optional certificate pass requirement; create or update a quiz for a lesson. Publish the lesson before publishing its quiz. “View assignments and review submissions” opens the course assignment list and its review links.
- **Course → Assignments & feedback**: students submit text and an optional project/document URL, then read their grade and tutor feedback in the same card. Tutors review submitted work from the assignment review link. Grades cannot exceed the assignment maximum.
- **Course → Quizzes**: enrolled learners answer questions, submit, review explanations, and retry. Correct answers and explanations stay server-side until an attempt is submitted. Publishing an edited question set or pass mark increments the revision; earlier passes do not satisfy the revised requirement for future certificate issuance.
- **Live class → Attendance roster**: the host or an admin marks Present, Absent or Excused after the class starts. Unmarked restores automatic room-entry evidence where available. The roster includes enrolled students who never registered. Registration alone is not attendance.
- **My learning → My attendance**: classes since enrollment show their recorded state. Missing records are “Not recorded”, never an invented absence. Excused/unmarked classes and classes before enrollment do not reduce the tutor performance attendance percentage.
- **Manage → Admin → Planner**: calendar shows the next 30 days of classes, assignment due dates and open tasks. Plan type can be Task, Intake or Deadline. Existing host conflicts are labelled; new or edited overlapping Scheduled/Live classes for the same host are rejected using a transaction-level host lock. Adjacent sessions are allowed.
- **Notification bell**: in-app alerts for new assignments, submissions, grading, published quizzes, scheduled/changed classes, verified payments and earned certificates. Payment alerts are idempotent and committed with verified credit. Email/SMS/push delivery is not introduced.
- **Certificates**: enrolled students must complete all published lessons and pass all published assessments marked required. A passing final grade, quiz attempt, lesson completion or explicit claim rechecks eligibility. Certificates have a unique verification URL, print/save-as-PDF action, and public verification omits account email addresses. Existing issued certificates are preserved as historical awards.

## Simplicity and fitting

No extra dashboard menu was introduced for assessments. Course tools have three jump links: Lessons, Assignments & feedback, Quizzes. Tutor tables have readable, non-wrapping status/header labels, horizontal containment on tablets, and stacked cards on phones. Phone navigation/filter controls wrap; pagination stays after the records. Quiz, grading, attendance and calendar controls fit 390px, 768px and 1440px in both themes.

## Limits

Assignments accept text and a document/project URL; binary uploads require a storage integration. Quizzes are single-answer multiple-choice with 2–4 choices and up to 10 questions. Attendance records do not measure call duration or prove learning. Calendar intake entries are planning records, not an automated admissions/enrollment campaign. Alerts are in-app; SMTP setup remains necessary for password-recovery mail. No real student data, payment prompt or external email was used in QA.

## Verification and rollout

- API and web production builds pass.
- 22 new local integration checks cover role guards, DTOs, answer privacy, revisions, required-assessment certificate gates, grading limits, attendance, notifications and concurrent tutor scheduling.
- 58 existing regression tests cover payments, auth, course/editor privacy, school operations and classrooms.
- `audits/learning-responsive-checks.json`: 42 light/dark page-and-width checks, all without document horizontal overflow. Actual browser flows checked grading, attendance marking, wrong-answer explanation, successful retry, student feedback and automatic certificate issuance.
- Additive migration: `20261115210000_learning_assessments`. Existing assignments default to optional; existing attendance and certificates remain intact. Deploy migrations before the API release. Do not run the seed against production.
