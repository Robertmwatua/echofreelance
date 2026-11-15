import Link from 'next/link'
import { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export function SectionLabel({children}:{children:ReactNode}) { return <p className="ef-section-label">{children}</p> }
export function Button({className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={`ef-btn ${className}`} {...props}/> }
export function TextLink({href,children,className=''}:{href:string;children:ReactNode;className?:string}) { return <Link href={href} className={`ef-btn-ghost ${className}`}>{children}</Link> }
export function Card({children,className='',...props}:HTMLAttributes<HTMLElement>) { return <section className={`ef-panel ${className}`} {...props}>{children}</section> }
export function Badge({children,accent=false}:{children:ReactNode;accent?:boolean}) { return <span className={accent?'ef-stamp':'ef-pill'}>{children}</span> }
export function Toast({children,error=false}:{children:ReactNode;error?:boolean}) { return <div className="ef-toast" role={error?'alert':'status'} aria-live={error?'assertive':'polite'}>{children}</div> }
export function EmptyNote({title,children,action}:{title:string;children:ReactNode;action?:ReactNode}) { return <section className="ef-feedback" role="status"><SectionLabel>Notebook / next step</SectionLabel><h2 className="mt-3 text-3xl">{title}</h2><div className="ef-muted mt-3 max-w-xl text-sm leading-7">{children}</div>{action&&<div className="mt-5 flex flex-wrap items-center gap-4">{action}</div>}</section> }
export function PageHeading({label,title,description,children}:{label:string;title:string;description:string;children?:ReactNode}) { return <header className="ef-hero"><SectionLabel>{label}</SectionLabel><h1 className="ef-title mt-4 ef-title">{title}</h1><p className="ef-muted mt-5 text-base leading-7">{description}</p>{children&&<div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}</header> }
export function RedirectNote({href,label='Taking you to the right room.'}:{href:string;label?:string}) { return <main className="ef-redirect"><SectionLabel>Navigation / one moment</SectionLabel><h1 className="ef-title mt-4 ef-title">{label}</h1><Link className="ef-btn-ghost mt-6" href={href}>Continue →</Link></main> }
