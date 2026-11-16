# Theme, FAQ, footer and assistant update

## Changes

- Shared CSS tokens now define light and dark surfaces, semantic status colours, borders, text and focus. Theme choice uses `theme`, defaults to the OS, migrates the old preference, handles blocked storage and applies before paint.
- Extracted HomeFaq and Footer; retained all four FAQ answers and first-open behaviour. Footer uses existing public school contact information, admissions fallback and the supplied Google Maps location.
- StatusBadge supplies semantic dots and labels on people, attendance and admin class screens. Tutor status colours use the same tokens.
- School assistant now has a desktop panel and mobile full-screen sheet, visual-viewport sizing, clearer speaker labels, quick questions, New chat, multiline composer, Enter/Shift+Enter, Escape, focus restoration and background scroll locking.

## Validation

Production Next.js build passed (45 routes). Ten theme behaviour checks and 24 contrast assertions passed; exact ratios are in theme-contrast.json. Component/page colour scan found no raw hex/rgb/hsl colour declarations.

Rendered public homepage/assistant checked at 360, 768 and 1280px; light/dark toggle and persisted reload checked. Short 360x420 chat viewport kept its composer visible without horizontal overflow. Keyboard FAQ activation and Escape focus restoration passed. Admissions map source and mobile overflow checked. Authenticated role pages were checked through build and shared styles, not a fresh signed-in visual tour. Real mobile on-screen keyboard was not available; short viewport was simulated.

## Limits and assumptions

The assistant remains a scripted automated guide, not a model-backed AI service. No AI API key/provider was added. Public WhatsApp remains hidden until NEXT_PUBLIC_SCHOOL_WHATSAPP_NUMBER is configured; the paid-student group invitation is not used as a public contact. No invented address or terms route. Existing shared 1200px container retained to align with the homepage; mobile Help stays above the existing bottom navigation. Google map frame follows site tokens but third-party map content controls its own colours.

## Files

Shared components: AskTutor.tsx, SiteShell.tsx, Footer.tsx, HomeFaq.tsx, StatusBadge.tsx, learning/AttendanceHistory.tsx, tutor/CourseStudio.tsx.

Theme/contact: lib/theme.ts, lib/brand.ts; pages/_app.tsx, _document.tsx, index.tsx, admissions.tsx; pages/admin/classes.tsx, index.tsx, people.tsx.

Styles: tokens.css, globals.css, editorial-home.css, interaction-hierarchy.css, workspaces.css, compact-home.css, faq-footer.css, theme-surfaces.css, school-chat.css.

Verification: tests/theme.cjs, docs/audits/theme-contrast.json and this report.
