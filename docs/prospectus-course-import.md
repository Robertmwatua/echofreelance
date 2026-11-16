# Prospectus course import

Source: client-supplied `ECO FREELANCE TECH SCHOOL PROSPECTUS (1).pdf`, program pathways on page 5. All 16 program titles are preserved. Short descriptions paraphrase the titles; no lesson syllabus, fees, durations or intakes were supplied.

Owner requested by the client representative: `favourmwatua@gmail.com` (must already have a Tutor or Admin account).

The additive importer reads the API's configured database from its existing environment. It skips existing titles case-insensitively across the catalogue, creates only unpublished drafts, and never changes users, roles, existing courses or enrollments. Do not use the destructive development seed for this task.

Preview:

```sh
node apps/api/scripts/import-prospectus.cjs --owner=favourmwatua@gmail.com
```

Import:

```sh
node apps/api/scripts/import-prospectus.cjs --owner=favourmwatua@gmail.com --apply
```

Each draft requires tutor review before publication. The current schema requires a numeric price, so drafts use zero internally; this is **not a confirmed free offering**. Confirm the currency and fees, set the actual price, level, lesson content, and intake information before publishing. Public course APIs exclude drafts.

Manifest: `apps/api/prisma/prospectus-courses.json`.
