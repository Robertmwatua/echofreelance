import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { FloatingPhone } from '../components/FloatingPhone'
import { api, Course, formatWhen, VirtualClass } from '../lib/api'

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<VirtualClass[]>([])

  useEffect(() => {
    api.courses().then((c) => setCourses(c.slice(0, 3))).catch(() => {})
    api.classes().then((c) => setClasses(c.slice(0, 2))).catch(() => {})
  }, [])

  return (
    <>
      <DocumentHead title="EchoFreelance — Online tech school" />
      <main>
        <section className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
          <div
            className="ef-hero-bg absolute inset-0 scale-105 bg-cover bg-center"
            style={{ backgroundImage: 'url(/wallpapers/campus.jpg)' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(2,6,23,0.82) 0%, rgba(2,6,23,0.55) 48%, rgba(2,6,23,0.28) 100%)',
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 55% 50% at 85% 45%, rgba(45,212,191,0.18), transparent 60%)',
            }}
            aria-hidden
          />
          <div className="ef-hero-grain pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-center gap-10 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-10">
            <div className="ef-rise max-w-xl shrink-0 sm:max-w-[50%]">
              <p className="font-display text-5xl leading-[0.92] tracking-tight text-sand drop-shadow-sm sm:text-6xl lg:text-8xl">
                EchoFreelance
              </p>
              <h1 className="mt-5 max-w-md font-display text-xl font-medium leading-snug text-sand sm:text-2xl lg:text-3xl">
                Learn tech live — courses, labs, and classrooms in one campus.
              </h1>
              <p className="mt-3 max-w-md text-sm text-sand/85 sm:text-base lg:text-lg">
                Cybersecurity, software, and cloud with tutors who teach in real time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/courses" className="ef-btn !bg-citrus !px-5 !py-3 !text-slate-950">
                  Course catalog
                </Link>
                <Link
                  href="/classes"
                  className="rounded-lg border border-sand/40 bg-sand/15 px-5 py-3 text-sm font-semibold text-sand backdrop-blur-md transition hover:bg-sand/25"
                >
                  Live classes
                </Link>
              </div>
            </div>

            <div className="ef-rise ef-rise-delay flex shrink-0 justify-center sm:justify-end">
              <FloatingPhone />
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 py-20">
          <div className="ef-section-wash pointer-events-none absolute inset-x-0 top-0 h-40" aria-hidden />
          <h2 className="font-display text-3xl text-moss sm:text-4xl">Published programs</h2>
          <p className="ef-muted mt-3 max-w-2xl text-base">
            Courses appear when tutors publish them — built on campus, not hard-coded.
          </p>
          {courses.length === 0 ? (
            <div className="ef-panel mt-10 max-w-xl">
              <p className="text-ink/85">No published courses yet.</p>
              <p className="mt-2 text-sm text-ink/55">
                Tutors: open the{' '}
                <Link href="/tutor" className="text-fern hover:underline">
                  Tutor desk
                </Link>{' '}
                to create your first course.
              </p>
            </div>
          ) : (
            <ul className="mt-10 space-y-8">
              {courses.map((course) => (
                <li key={course.id} className="border-t border-line/35 pt-8 first:border-t-0 first:pt-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fern">
                    {course.category} · {course.level}
                  </p>
                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-1 block font-display text-2xl text-ink transition hover:text-moss sm:text-3xl"
                  >
                    {course.title}
                  </Link>
                  <p className="ef-muted mt-2 max-w-2xl">{course.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {classes.length > 0 && (
          <section className="relative overflow-hidden border-t border-line/25 px-5 py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.2]"
              style={{
                backgroundImage: 'url(/wallpapers/campus.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center 40%',
              }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-panel/88 backdrop-blur-sm" aria-hidden />
            <div className="relative mx-auto max-w-6xl">
              <h2 className="font-display text-3xl text-moss sm:text-4xl">Upcoming live sessions</h2>
              <ul className="mt-10 space-y-6">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/classes/${c.id}`}
                      className="font-display text-xl text-ink transition hover:text-moss sm:text-2xl"
                    >
                      {c.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink/55">{formatWhen(c.startsAt)}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </>
  )
}
