import Link from 'next/link'
import { Course, formatPrice } from '../lib/api'

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="ef-panel ef-interactive-card flex h-full flex-col">
      <p className="ef-eyebrow">{course.category}</p>
      <h2 className="mt-3 font-display text-2xl tracking-tight">
        <Link href={`/courses/${course.id}`} className="hover:underline underline-offset-4">
          {course.title}
        </Link>
      </h2>
      <p className="ef-muted mt-3 line-clamp-3 text-sm leading-6">{course.description}</p>
      <dl className="ef-meta mt-6 grid grid-cols-2 gap-x-4 gap-y-3">
        <div><dt className="text-xs">Level</dt><dd className="font-medium text-ink">{course.level}</dd></div>
        <div><dt className="text-xs">Lessons</dt><dd className="font-medium text-ink">{course.lessonCount ?? '—'}</dd></div>
        {course.avgRating != null && <div className="col-span-2"><dt className="sr-only">Rating</dt><dd>{course.avgRating}/5 · {course.reviewCount || 0} reviews</dd></div>}
      </dl><div className="h-6" aria-hidden />
      {(course.tutor?.name || course.instructor?.name) && <p className="ef-meta mt-4">With {course.tutor?.name || course.instructor?.name}</p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
        <span className="text-sm font-semibold">{formatPrice(course.priceCents)}</span>
        <Link href={`/courses/${course.id}`} className="ef-btn-ghost" aria-label={`${course.enrolled ? 'Continue' : 'View'} ${course.title}`}>
          {course.enrolled ? 'Continue learning' : 'View course'}
        </Link>
      </div>
    </article>
  )
}
