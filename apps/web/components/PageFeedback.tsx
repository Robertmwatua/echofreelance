import {NavigationLink} from './Button'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Button, EmptyNote, PageHeading, SectionLabel } from './ui'
export function PageHero({eyebrow,title,description,children}:{eyebrow:string;title:string;description:string;children?:ReactNode}) {
 return <PageHeading label={eyebrow} title={title} description={description}>{children}</PageHeading>
}
export function FeedbackCard({title,description,retry,action,error=false}:{title:string;description:string;retry?:()=>void;action?:{href:string;label:string};error?:boolean}) {
 if(!error)return <EmptyNote title={title} action={action&&<NavigationLink href={action.href} className="ef-btn-ghost">{action.label} →</NavigationLink>}>{description}</EmptyNote>
 return <section className="ef-feedback" role="alert"><SectionLabel>Connection / interrupted</SectionLabel><h2 className="mt-3 text-3xl">{title}</h2><p className="ef-muted mt-3 max-w-xl text-sm leading-7">{description}</p><div className="mt-5 flex flex-wrap gap-4">{retry&&<Button onClick={retry}>Try again ↻</Button>}{action&&<NavigationLink className="ef-btn-ghost" href={action.href}>{action.label} →</NavigationLink>}</div></section>
}
export function CardSkeletons({label='Loading content',count=3}:{label?:string;count?:number}) {
 return <div role="status" aria-live="polite" className="mt-8"><span className="sr-only">{label}</span><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{Array.from({length:count},(_,i)=><div key={i} className="ef-panel space-y-6"><div className="ef-skeleton h-4 w-24"/><div className="space-y-3"><div className="ef-skeleton h-8 w-4/5"/><div className="ef-skeleton h-4 w-full"/><div className="ef-skeleton h-4 w-2/3"/></div><div className="flex justify-between border-t border-line pt-5"><div className="ef-skeleton h-10 w-24"/><div className="ef-skeleton h-5 w-20"/></div></div>)}</div></div>
}
