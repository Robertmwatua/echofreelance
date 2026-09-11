import Link from 'next/link'
import { useEffect, useState } from 'react'
import DocumentHead from '../components/DocumentHead'
import { FloatingLaptop } from '../components/FloatingLaptop'
import { FloatingPhone } from '../components/FloatingPhone'
import { api, Course, formatWhen, VirtualClass } from '../lib/api'
import { SITE_NAME } from '../lib/brand'

const HERO_WALLS = [
  '/wallpapers/campus.jpg',
  '/wallpapers/collab.jpg',
  '/wallpapers/night.jpg',
  '/wallpapers/code.jpg',
]

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([])
  const [classes, setClasses] = useState<VirtualClass[]>([])
  const [wallIdx, setWallIdx] = useState(0)

  useEffect(() => {
    api.courses().then((c) => setCourses(c.slice(0, 3))).catch(() => {})
    api.classes().then((c) => setClasses(c.slice(0, 2))).catch(() => {})
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      setWallIdx((i) => (i + 1) % HERO_WALLS.length)
    }, 8000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <>
      <DocumentHead title={SITE_NAME} />
      <main>
        <section className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
          {HERO_WALLS.map((src, i) => (
            <div
              key={src}
              className={`ef-hero-crossfade absolute inset-0 scale-105 bg-cover bg-center transition-opacity duration-[1600ms] ${
                i === wallIdx ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(2,6,23,0.84) 0%, rgba(2,6,23,0.58) 48%, rgba(2,6,23,0.32) 100%)',
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

          <div className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-center gap-10 px-5 py-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-10">
            <div className="ef-rise max-w-xl shrink-0 lg:max-w-[46%]">
              <p className="font-display text-4xl leading-[0.95] tracking-tight text-sand drop-shadow-sm sm:text-5xl lg:text-7xl">
                EchoFreelance
                <span className="mt-1 block text-[0.55em] font-medium tracking-wide text-sand/90 sm:mt-2">
                  Tech School
                </span>
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

            <div className="ef-rise ef-rise-delay relative flex shrink-0 items-end justify-center gap-4 lg:justify-end">
              <FloatingLaptop />
              <div className="lg:absolute lg:-bottom-6 lg:-right-2 lg:z-10">
                <FloatingPhone />
              </div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto max-w-6xl px-5 py-20">
          <div className="ef-section-wash pointer-events-none absolute inset-x-0 top-0 h-40" aria-hidden />
          <h2 className="ef-rise font-display text-3xl text-moss sm:text-4xl">Featured programs</h2>
          <p className="ef-muted mt-3 max-w-2xl text-base">
            Explore published courses from campus tutors — enroll and join live sessions.
          </p>
          {courses.length === 0 ? (
            <div className="ef-panel mt-10 max-w-xl">
              <p className="text-ink/85">New courses are on the way.</p>
              <p className="mt-2 text-sm text-ink/55">
                Check back soon, or{' '}
                <Link href="/register" className="ef-link">
                  join as a student
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="mt-10 space-y-8">
              {courses.map((course, i) => (
                <li
                  key={course.id}
                  className="ef-stagger border-t border-line/35 pt-8 first:border-t-0 first:pt-0"
                  style={{ animationDelay: `${0.08 * i}s` }}
                >
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

        <section className="relative overflow-hidden border-t border-line/25 px-5 py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: 'url(/wallpapers/learn.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-panel/90 backdrop-blur-sm" aria-hidden />
          <div className="relative mx-auto max-w-6xl">
            <h2 className="font-display text-3xl text-moss sm:text-4xl">Learn anywhere</h2>
            <p className="ef-muted mt-3 max-w-xl">
              Join live classrooms from your phone or laptop — progress, notes, and discussions stay
              with you.
            </p>
          </div>
        </section>

        {classes.length > 0 && (
          <section className="relative overflow-hidden border-t border-line/25 px-5 py-20">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.2]"
              style={{
                backgroundImage: 'url(/wallpapers/collab.jpg)',
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
