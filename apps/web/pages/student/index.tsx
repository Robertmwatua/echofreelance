import { CardSkeletons, FeedbackCard } from '../../components/PageFeedback'
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DocumentHead from '../../components/DocumentHead';
import { ProgressBar } from '../../components/ProgressBar';
import { RequireRole } from '../../components/RequireRole';
import { api, Assignment, formatWhen, VirtualClass } from '../../lib/api';
type Progress = {
    courseId: string;
    title: string;
    category: string;
    total: number;
    completed: number;
    percent: number;
};
export default function StudentHubPage() {
    return <RequireRole roles={['Student', 'Tutor', 'Admin']}>{(user) => <Learning userName={user.name || user.email}/>}</RequireRole>;
}
function Learning({ userName }: {
    userName: string;
}) {
    const [progress, setProgress] = useState<Progress[]>([]);
    const [classes, setClasses] = useState<VirtualClass[]>([]);
    const [deadlines, setDeadlines] = useState<Assignment[]>([]);
    const [deadlineError, setDeadlineError] = useState(false);
    const [deadlinesLoading, setDeadlinesLoading] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        setDeadlineError(false);
        setDeadlinesLoading(true);
        Promise.all([api.myProgress(), api.myClasses()]).then(([p, c]) => {
            if (!active)
                return;
            setProgress(p);
            Promise.all(p.map(course => api.courseAssignments(course.courseId))).then(lists => {
                if (active)
                    setDeadlines(lists.flat().filter(a => a.dueAt && new Date(a.dueAt).getTime() > Date.now() && !a.mySubmission).sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime()).slice(0, 3));
            }).catch(() => { if (active)
                setDeadlineError(true); }).finally(() => { if (active)
                setDeadlinesLoading(false); });
            setClasses(c.filter(item => item.status === 'Live' || (item.status === 'Scheduled' && new Date(item.endsAt).getTime() > Date.now())).sort((a, b) => Number(b.status === 'Live') - Number(a.status === 'Live') || new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).slice(0, 3));
        }).catch((e: Error) => { if (active)
            setError(e.message); }).finally(() => { if (active)
            setLoading(false); });
        return () => { active = false; };
    }, [attempt]);
    const next = progress.find(p => p.completed > 0 && p.percent < 100) || progress.find(p => p.percent < 100);
    return <>
    <DocumentHead title="My learning — EchoFreelance Tech School"/>
    <main className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <p className="ef-eyebrow">Your learning space</p>
      <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Welcome back, {userName}</h1>
      <p className="ef-muted mt-3">A little progress today goes a long way.</p>
      {loading ? <CardSkeletons label="Loading your learning space" /> : error ? <FeedbackCard error title="Unable to load your learning space" description="We couldn’t reach your dashboard right now. Please try again." retry={() => setAttempt(a => a + 1)} /> : <>
        <section className="ef-learning-feature mt-8 rounded-xl border border-line p-6 sm:p-10">
          <p className="ef-eyebrow">{next ? 'Keep your momentum' : progress.length ? 'Well done' : 'Your next chapter'}</p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight sm:text-4xl">{next ? next.title : progress.length ? 'You’ve completed your courses.' : 'Start with something you’re curious about.'}</h2>
          <p className="ef-muted mt-3">{next ? `${next.completed} of ${next.total} lessons complete · ${next.category}` : 'Explore practical courses in cybersecurity, software, and cloud.'}</p>
          {next && <ProgressBar percent={next.percent} className="mt-6 max-w-lg"/>}
          <Link href={next ? `/courses/${next.courseId}` : '/courses'} className="ef-btn mt-6">{next ? 'Continue learning' : 'Explore courses'} <span className="ml-3" aria-hidden>→</span></Link>
        </section>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <section><div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl">My courses</h2><Link href="/courses" className="ef-link text-sm">Explore courses</Link></div>
            {progress.length ? <ul className="mt-5 space-y-3">{progress.map(row => <li key={row.courseId} className="ef-panel !p-5"><p className="ef-eyebrow">{row.category}</p><Link href={`/courses/${row.courseId}`} className="mt-2 block font-display text-xl hover:text-moss">{row.title} <span aria-hidden>↗</span></Link><div className="mt-4 flex justify-between text-sm ef-muted"><span>{row.completed}/{row.total} lessons</span><span>{row.percent}%</span></div><ProgressBar percent={row.percent} className="mt-2"/></li>)}</ul> : <p className="ef-muted mt-5 rounded-xl border border-dashed border-line p-6">Your courses will appear here after you enroll.</p>}
          </section>
          <aside className="space-y-6"><section className="ef-panel"><p className="ef-eyebrow">Make time to connect</p><h2 className="mt-2 font-display text-2xl">Your next classes</h2>{classes.length ? <ul className="mt-5 divide-y divide-line/30">{classes.map(item => <li key={item.id} className="py-4 first:pt-0"><p className="text-sm text-fern">{item.status === 'Live' ? 'Live now' : formatWhen(item.startsAt)}</p><Link href={`/classes/${item.id}`} className="mt-1 block font-semibold hover:text-moss">{item.title} →</Link></li>)}</ul> : <p className="ef-muted mt-4 text-sm">No upcoming classes registered. Find a session that fits your schedule.</p>}<Link href="/classes" className="ef-link mt-4 inline-block text-sm">View live classes</Link></section>
          <section className="ef-panel"><h2 className="font-display text-xl">Upcoming deadlines</h2>{deadlinesLoading ? <p className="ef-muted mt-4 text-sm" role="status">Loading assignments…</p> : deadlineError ? <div className="mt-4 text-sm"><p>Assignments couldn’t load.</p><button className="ef-link mt-2" onClick={() => setAttempt(a => a + 1)}>Try again</button></div> : deadlines.length ? <ul className="mt-4 space-y-4">{deadlines.map(a => <li key={a.id}><Link href={`/courses/${a.courseId}`} className="font-semibold hover:text-moss">{a.title} →</Link><p className="mt-1 text-sm ef-muted">Due {formatWhen(a.dueAt!)}</p></li>)}</ul> : <p className="ef-muted mt-4 text-sm">You’re all caught up. No upcoming assignments to submit.</p>}</section><section className="rounded-xl border border-line p-6"><h2 className="font-display text-xl">Your toolkit</h2><div className="mt-4 flex flex-col gap-4 text-sm"><Link href="/notes" className="hover:text-moss">Notes →</Link><Link href="/discussions" className="hover:text-moss">Community →</Link><Link href="/certificates/mine" className="hover:text-moss">Certificates →</Link></div></section></aside>
        </div>
      </>}
    </main>
  </>;
}
