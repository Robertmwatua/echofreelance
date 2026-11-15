# Public programmes and teaching Admins

The public catalogue includes published, non-archived courses and 18 explicitly approved existing programme IDs. Approval lives in `apps/api/src/modules/courses/programme-roadmaps.ts`. It does not make arbitrary tutors’ private drafts public, and it does not change publication or enrollment records.

Each existing programme has an authored five-stage **proposed** learning roadmap. Programme titles come from existing records and the prospectus import; the roadmap text is a suggested sequence, not an assertion that these lessons exist or that the client has confirmed a syllabus. Tutors can later add actual lessons independently. Confirm final curriculum with the school before presenting it as final.

The 16 prospectus programmes have fees pending confirmation; their zero-value placeholders are never displayed as Free or matched by the Free filter. Duration filters exclude unknown/zero lesson duration. Enrollment is unavailable until a course is published, not archived and has lessons. Roadmap details and browsing require no login; private lesson bodies, resources and recordings keep existing access controls. API-side enrollment also rejects empty published courses.

Admins retain teaching privileges. The Admin dashboard links to all-course management, instant classes, scheduling and user-role management. New tutors register normally and an Admin promotes their existing account; no credentials or invitations are fabricated. `/tutor?tab=live#instant-class` opens the live-class workspace directly. Its course selection now updates after asynchronous course loading.

Validation: both workspace builds pass; seven course-service tests cover publication, ownership, duplication, catalogue filters, public allowlist boundaries, private draft lesson protection and empty-course enrollment rejection. Read-only real-database service check returns 18 public programmes, 18 roadmaps, 16 pending fee flags and zero private lessons in an anonymous draft preview. No database migration or record changes are required.
