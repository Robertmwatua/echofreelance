import { TechPhoto } from '../components/TechPhoto'
import { AskAnything } from '../components/AskAnything'
import { Sparkle } from '../components/Sparkle'
import { LiveDot } from '../components/LiveDot'
import { CardSkeletons, FeedbackCard } from '../components/PageFeedback'
import Link from 'next/link';
import { CourseCard } from '../components/CourseCard';
import { useEffect, useState } from 'react';
import DocumentHead from '../components/DocumentHead';
import { api, Course, VirtualClass } from '../lib/api';
import { SITE_NAME } from '../lib/brand';
export default function Home() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [sessions, setSessions] = useState<VirtualClass[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        api.courses().then(c => { if (active)
            setCourses(c); }).catch(() => { if (active)
            setError(true); }).finally(() => { if (active)
            setLoading(false); });
        api.classes().then(list => { if (active) setSessions(list) }).catch(() => { if (active) setSessions(null) });
        return () => { active = false; };
    }, [attempt]);
    const rated = courses.filter(c => c.avgRating != null && (c.reviewCount || 0) > 0);
    const reviews = rated.reduce((sum, c) => sum + (c.reviewCount || 0), 0);
    const rating = reviews ? (rated.reduce((sum, c) => sum + c.avgRating! * (c.reviewCount || 0), 0) / reviews).toFixed(1) : null;
    const live = sessions?.filter(c => c.status === 'Live') || [];
    const tutors = new Set(live.map(c => c.host?.id).filter(Boolean)).size;
    return <>
    <DocumentHead title={SITE_NAME}/>
    <main>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="ef-orb" aria-hidden />
        <div className="ef-grid" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2 lg:gap-16 lg:py-32">
          <div>
            <p className="ef-ai-pill"><Sparkle /> AI-powered learning</p>
            <h1 className="mt-7 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.03em] min-[400px]:text-5xl sm:text-6xl lg:text-[4.25rem]">
              Find your<br /><span className="ef-gradient-text">direction</span> in tech.
            </h1>
            <p className="ef-muted mt-7 max-w-md text-lg leading-relaxed">
              Cybersecurity, software and cloud — practical courses and live classes with tutors who answer.
            </p>
            <div className="mt-9 max-w-xl"><AskAnything /></div>

            <dl className="ef-stat-strip mt-10">
              <div>
                <dt>Course rating</dt>
                <dd>{rating ? <>{rating} <span className="text-moss" aria-hidden>★</span></> : 'Student reviews'}</dd>
              </div>
              <div>
                <dt>Learn by doing</dt>
                <dd>{!loading && !error ? `${courses.length} course${courses.length === 1 ? '' : 's'}` : 'Interactive labs'}</dd>
              </div>
              <div>
                <dt>Live classroom</dt>
                <dd className="flex items-center gap-2">
                  {live.length > 0 && <LiveDot />}
                  {sessions === null ? 'Tutor-led sessions' : tutors ? `${tutors} tutor${tutors === 1 ? '' : 's'} live` : 'View schedule'}
                </dd>
              </div>
            </dl>
          </div>
          <TechPhoto />
        </div>
      </section>

      {/* ── what you get ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-4">
        <ul className="grid gap-5 sm:grid-cols-3">
          {[
            ['01', 'Learn by doing', 'Put new skills to work with assignments and challenges.'],
            ['02', 'Meet your tutors', 'Ask questions and learn together in live classes.'],
            ['03', 'See your progress', 'Track lessons and collect course certificates.'],
          ].map(([n, title, body]) => (
            <li key={n} className="ef-feature-card">
              <span className="ef-feature-num" aria-hidden>{n}</span>
              <h2 className="mt-5 font-display text-xl tracking-tight">{title}</h2>
              <p className="ef-muted mt-2.5 text-sm leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── catalogue ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ef-eyebrow">Find your starting point</p>
            <h2 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Explore courses</h2>
          </div>
          <Link href="/courses" className="ef-link text-sm">View all courses →</Link>
        </div>
        {loading ? (
          <CardSkeletons label="Loading courses" />
        ) : error ? (
          <FeedbackCard error title="Unable to load courses" description="We couldn’t connect to the catalog. Please try again in a moment." retry={() => setAttempt(a => a + 1)} />
        ) : courses.length ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 3).map(course => <li key={course.id}><CourseCard course={course} /></li>)}
          </ul>
        ) : (
          <div className="ef-panel mt-10 text-center">
            <h3 className="font-display text-2xl tracking-tight">New courses are on the way</h3>
            <p className="ef-muted mx-auto mt-3 max-w-sm">Create an account and you’ll be ready the moment the first one opens.</p>
            <Link href="/register" className="ef-btn mt-7">Create account</Link>
          </div>
        )}
      </section>
    </main>
  </>;
}
