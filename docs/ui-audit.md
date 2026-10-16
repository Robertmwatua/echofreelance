# Frontend design audit

## Direction and implementation

Use an editorial serif for major headings and a restrained sans serif for controls and reading text. Slate surfaces, a muted green accent, opaque 1px borders, 8px control radii, 12px surface radii, and subtle shadows replace translucent/glowing surfaces. Main page gutters use 24px; sections use 32–64px spacing. Keep photography as documentary content, without floating mockups or glass overlays.

## Priority files

| File | Finding | Applied improvement |
| --- | --- | --- |
| `apps/web/styles/globals.css` | Conflicting appended overrides, legacy atmospheric effects, weak metadata contrast, light-mode status badge problems | Consolidated tokens and component rules; solid surfaces; explicit muted text; neutral status badges; 44px controls; 3px focus outline and forced-colors support |
| `apps/web/tailwind.config.js` | Legacy glow shadow | Reduced compatibility alias to a micro-shadow |
| `apps/web/components/CourseCard.tsx` | Cards duplicated between catalog and homepage; metadata crowded into one line | Shared card with semantic heading and definition list; level/lesson count separate from price/action; descriptive link names |
| `apps/web/components/SiteShell.tsx` | No current-page indicator; account disclosure stays open outside interactions | Underlined active route with `aria-current`; outside-click, Escape, and focus-leave dismissal |
| `apps/web/components/ProgressBar.tsx` | Gradient-only decoration without progress semantics | Solid accent; named progressbar with values and invalid-number fallback |
| `apps/web/pages/index.tsx` | Photo caption resembles floating glass card; duplicated course presentation | Plain caption below photo; shared course cards; restrained corner radius |
| `apps/web/pages/courses/index.tsx` | Decorative radial background; flat metadata; category selection communicated only by color | Removed background effects; responsive card grid; explicit `aria-pressed` filters |
| `apps/web/pages/student/index.tsx` | Featured widget uses gradient and different radius/padding | Flat surface and accent rule; consistent radii and page spacing |
| `apps/web/pages/courses/[id].tsx` | All lesson bodies displayed together; no initial loading feedback; unlabeled textareas | Native lesson disclosures; readable body width/line height; loading/retry and empty syllabus; textarea accessible names |
| `apps/web/pages/discussions/index.tsx` | Empty state appears before enrollment request completes | Loading/retry states; consistent Community label |
| Other existing page JSX | Many `text-ink/40` through `/75` and translucent border values | Replaced with shared muted text and solid border tokens |

## Exact reusable patterns

```css
.ef-panel {
  @apply rounded-xl border border-line bg-panel p-6 shadow-sm;
}
.ef-filter[aria-pressed='true'] {
  @apply border-ink bg-ink text-panel;
}
:where(a, button, input, textarea, select, summary, [tabindex]):focus-visible {
  outline: 3px solid rgb(var(--c-ink));
  outline-offset: 3px;
  box-shadow: 0 0 0 3px rgb(var(--c-panel));
}
```

```tsx
<Link href="/courses" aria-current={isActive('/courses') ? 'page' : undefined}
  className="ef-nav-link">Courses</Link>

<ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {courses.map(course => <li key={course.id}><CourseCard course={course} /></li>)}
</ul>
```

## Remaining targeted work

- Split `SiteShell` into navigation, account disclosure, and notification panel components; desktop/mobile notification markup is duplicated. Preserve focus return and outside-click behavior when extracting.
- Split course detail into lesson, assignment, discussion, and review components. Its request/mutation state is shared, so unrelated actions currently disable each other.
- Course detail silently converts optional request failures into empty collections. Give each section independent loading/error/retry state before presenting “no content” messages.
- Dashboard assignment queries scale with enrolled course count. Add an aggregate upcoming-work API and independent widget loading boundaries.
- Fetch lesson notes with a request identity guard: switching lessons quickly must not show an earlier lesson’s late response. A failed fetch must preserve a visible error rather than opening a blank editable note.
- Replace legacy floating device components if they are reused; they are currently unused on the homepage. Self-host licensed fonts to avoid reliance on Google Fonts availability.
- Verify authenticated student/tutor/admin workflows with real course data, long titles, keyboard-only interaction, zoom, and narrow screens. Full accessibility conformance is not established by this visual refresh.

## Accessibility scope

WCAG 2.2 SC 2.4.13 (AAA) asks for a focus indicator at least equivalent to a 2px perimeter and at least 3:1 focused/unfocused contrast. The new 3px outline uses contrasting foreground/surface tokens and has a forced-colors fallback. This addresses the focus design, not a claim of whole-site AAA compliance. See https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html.

## Validation performed

- Next.js production build passed, including type checking and generation of 26 pages.
- TypeScript `--noEmit` passed after the final removal of decorative backgrounds on tutor/class pages.
- `git diff --check` passed.
- Visually inspected homepage and catalog in the local browser; verified active Courses navigation and API-error/retry presentation.
- The API was unavailable. Populated course cards, authenticated dashboards, lesson mutations, mobile layouts, and complete accessibility conformance remain unverified in a browser.

## Page feedback and live classroom follow-up

Added `components/PageFeedback.tsx` with `PageHero`, `FeedbackCard`, and `CardSkeletons`. Classes now has local search/category/status filters, consistent schedule cards, instructor initials, calendar actions, and explicitly labeled disabled sample previews during connection failures. Courses, Community, Notes, and Certificates share the hero and feedback pattern; homepage and student-dashboard requests share skeleton/error presentation. Reduced-motion preferences disable skeleton pulses through the global animation override.

The production build passed. Browser verification covered the live-classes error state and preserving the selected Live filter after retry. Populated backend results and authenticated pages still require a running API for end-to-end verification.

## Interactive refinements

- Sticky navbar now uses theme-aware translucent surfaces and backdrop blur.
- `LiveDot.tsx` shares the ping animation between actual live statuses; reduced-motion styling disables animation.
- Homepage adds three micro-stat columns using review-weighted catalog ratings, available course counts, and live tutor counts. Missing backend data uses descriptive copy, never invented numeric claims.
- Hero image has two glass accents. Learner avatar initials are explicitly illustrative; active-lab wording only appears when a session is actually live.
- Course and session cards share emerald hover borders/glow and keyboard focus-within treatment.
- Registration has a rounded photo panel, glass caption, improved hierarchy and copy, autocomplete attributes, password guidance, a show/hide control, and a readable connection error state.

## Code-native media replacement

Removed stock-photo panels from the homepage, login, and registration. `components/LabPreview.tsx` supplies a responsive, horizontally scrollable code window with manually highlighted Python/Bash examples, language selection, and explicitly simulated terminal output. It executes no commands. `AuthLearningPanel` reuses the preview with certificate and guided-class feature tiles. No external imagery or syntax-highlighting dependency is required. Dark preview focus outlines are independently styled for contrast even in light mode. Existing unused wallpaper assets remain on disk, but frontend pages no longer reference them.

## Photo correction

Restored photographic layouts per the user's clarification. `TechPhoto.tsx` replaces terminal panels on homepage/login/registration with locally stored Unsplash developer-workspace photos, dark tints, readable captions, and source links. `LabPreview.tsx` remains available but is not used in these layouts. TypeScript and whitespace checks passed; the homepage photo was visually verified in the browser.
