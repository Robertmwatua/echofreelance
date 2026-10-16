import { TechPhoto } from '../components/TechPhoto'
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
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-16">
        <div><p className="ef-eyebrow">EchoFreelance Tech School</p><h1 className="mt-5 font-display text-4xl leading-[1.08] tracking-tight min-[400px]:text-5xl sm:text-6xl">Build skills.<br /><span className="text-moss">Open new doors.</span></h1><p className="ef-muted mt-6 max-w-md text-lg leading-relaxed">Learn cybersecurity, software, and cloud through practical courses and live classes with tutors.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/courses" className="ef-btn">Explore courses <span className="ml-3" aria-hidden>→</span></Link><Link href="/classes" className="ef-btn-ghost">View live classes</Link></div><dl className="ef-micro-stats mt-8 grid grid-cols-3 border-t border-line pt-6">
          <div><dt className="ef-meta text-xs">Course rating</dt><dd className="mt-1 text-sm font-semibold sm:text-base">{rating ? `${rating} ★` : 'Student reviews'}</dd></div>
          <div><dt className="ef-meta text-xs">Learn by doing</dt><dd className="mt-1 text-sm font-semibold sm:text-base">{!loading && !error ? `${courses.length} courses` : 'Interactive labs'}</dd></div>
          <div><dt className="ef-meta text-xs">Live classroom</dt><dd className="mt-1 flex items-center gap-2 text-sm font-semibold sm:text-base">{live.length > 0 && <LiveDot />}{sessions === null ? 'Tutor-led sessions' : tutors ? `${tutors} tutors live` : 'View schedule'}</dd></div>
        </dl></div>
        <TechPhoto />
      </section>
      <section className="border-y border-line bg-panel"><div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3">{[['01', 'Learn by doing', 'Put new skills to work with assignments and challenges.'], ['02', 'Meet your tutors', 'Ask questions and learn together in live classes.'], ['03', 'See your progress', 'Track lessons and collect course certificates.']].map(([n, title, body]) => <div key={n}><span className="ef-eyebrow">{n}</span><h2 className="mt-2 font-display text-xl">{title}</h2><p className="ef-muted mt-2 text-sm leading-relaxed">{body}</p></div>)}</div></section>
      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="ef-eyebrow">Find your starting point</p><h2 className="mt-3 font-display text-3xl tracking-tight">Explore courses</h2></div><Link href="/courses" className="ef-link text-sm">View all courses →</Link></div>
      {loading ? <CardSkeletons label="Loading courses" /> : error ? <FeedbackCard error title="Unable to load courses" description="We couldn’t connect to the catalog. Please try again in a moment." retry={() => setAttempt(a => a + 1)} /> : courses.length ? <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{courses.slice(0, 3).map(course => <li key={course.id}><CourseCard course={course} /></li>)}</ul> : <div className="ef-panel mt-8"><h3 className="font-display text-xl">New courses are on the way</h3><p className="ef-muted mt-2">Create an account to get ready for your first course.</p><Link href="/register" className="ef-btn mt-5">Create account</Link></div>}
      </section>
    </main>
  </>;
}
