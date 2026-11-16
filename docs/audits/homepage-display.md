# Homepage display controls and footer alignment

Admins: open **Manage → Courses → Homepage courses**. Add up to three published courses, move them up/down, remove any, and save. Preview opens the public homepage. Saving zero courses deliberately hides the cards; otherwise only the selected courses appear, in saved order. Unpublishing or archiving a selected course immediately removes it from public display. Before the first selection is saved, the existing newest-published selection remains the default.

The selection is persisted in the new singleton HomepageSelection table. Apply the additive Prisma migration 20261116090000_homepage_selection as part of API deployment. No existing course, payment or authentication columns change. PATCH/GET selection management is Admin-only. Public GET /courses/homepage only exposes eligible public course cards. The frontend temporarily falls back to the previous selection on an old API's 404 during a rolling deployment; other errors retain a retry state.

The shared footer has aligned brand, navigation and visit/contact groups; location and email icons; a lazy Google Maps preview; and a clearly labelled external maps link. Desktop keeps email on one line when space allows. Mobile wraps the address and stacks the location section without horizontal overflow. The Google map itself uses Google's theme.

Homepage course cards reuse subject icons and colour tokens, with equal-height cards, aligned metadata and a consistent footer action. The catalogue and course routes retain their existing behaviour.

Validation: API TypeScript build and Next.js production build passed. Disposable PostgreSQL migration applied successfully. Integration checks cover anonymous/student/tutor denial, Admin save, persisted order, duplicate/over-limit/private/missing rejection, atomic rejected writes, unpublished filtering and explicitly empty selection. Browser admin selection and save confirmed; footer at 390, 768 and 1440px in light/dark, with no horizontal overflow; equal-height homepage cards checked on desktop. Real production selections are left for the administrator.

Changed files: apps/api/prisma/schema.prisma; new migration; courses.controller.ts; courses.service.ts; dto/homepage-selection.dto.ts; tests/homepage-courses.cjs; apps/web/components/Footer.tsx; components/admin/HomepageCourses.tsx; lib/api.ts; pages/admin/courses.tsx; pages/index.tsx; styles/compact-home.css; styles/faq-footer.css; this report.
