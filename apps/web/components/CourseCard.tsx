import Link from 'next/link'
import { Course, formatPrice } from '../lib/api'
import { Sparkle } from './Sparkle'

export function CourseCard({ course }: { course: Course }) {
  const tutor = course.tutor?.name || course.instructor?.name
  /* a real signal from real data — not an invented recommendation */
  const topRated = course.avgRating != null && course.avgRating >= 4.5 && (course.reviewCount || 0) >= 3

  function askAbout() {
    window.dispatchEvent(new CustomEvent('ef:ask-tutor', {
      detail: { q: `Is "${course.title}" right for me?` },
    }))
  }

  return (
    <article className="ef-session-card ef-sweep flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="ef-eyebrow">{course.category}</p>
        {topRated && <span className="ef-badge-grad">Top rated</span>}
      </div>

      <h2 className="mt-4 font-display text-xl font-semibold leading-snug tracking-tight">
        <Link href={`/courses/${course.id}`} className="transition-colors hover:text-moss">
          {course.title}
        </Link>
      </h2>

      <p className="ef-muted mt-3 line-clamp-3 text-sm leading-6">{course.description}</p>

      <dl className="ef-meta mt-6 grid grid-cols-2 gap-x-4 gap-y-3 font-accent">
        <div>
          <dt className="text-[11px] uppercase tracking-wider">Level</dt>
          <dd className="font-medium text-ink">{course.level}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider">Lessons</dt>
          <dd className="font-medium text-ink">{course.lessonCount ?? '\u2014'}</dd>
        </div>
        {course.avgRating != null && (
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-wider">Rating</dt>
            <dd className="font-medium text-ink">
              {course.avgRating}/5 \u00b7 {course.reviewCount || 0} review{course.reviewCount === 1 ? '' : 's'}
            </dd>
          </div>
        )}
      </dl>

      {tutor && <p className="ef-meta mt-4">With {tutor}</p>}

      <button type="button" onClick={askAbout} className="ef-ask-link mt-5 self-start">
        <Sparkle /> Ask about this course
      </button>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <span className="font-accent text-sm font-semibold text-ink">{formatPrice(course.priceCents)}</span>
        <Link
          href={`/courses/${course.id}`}
          className="ef-btn-ghost !py-2 text-sm"
          aria-label={`${course.enrolled ? 'Continue' : 'View'} ${course.title}`}
        >
          {course.enrolled ? 'Continue learning' : 'View course'}
        </Link>
      </div>
    </article>
  )
}
