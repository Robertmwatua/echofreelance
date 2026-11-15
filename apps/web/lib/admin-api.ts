import {request} from './api'
import {Enquiry} from './school-api'
export type Activity={id:string;at:string;who:string;action:string;detail:string;href:string}
export type AdminClass={id:string;title:string;courseId:string;startsAt:string;endsAt:string;status:string;host:{name:string|null};_count:{attendances:number}}
export type Overview={newEnquiries:number;oldestEnquiryAt:string|null;inbox:Enquiry[];newApplications:number;classes:AdminClass[];classes24h:number;courses:number;drafts:number;students:number;tutors:number;admins:number;unpaidAccounts:number;outstandingCents:number;posts:number;activity:Activity[]}
export type SearchItem={id:string;label:string;detail:string;href:string}
export const admin={learningSearch:(q:string)=>request<SearchItem[]>(`/school/search?q=${encodeURIComponent(q)}`),overview:()=>request<Overview>('/school/admin/overview'),activity:(offset=0)=>request<{items:Activity[];hasMore:boolean}>(`/school/admin/activity?offset=${offset}`),search:(q:string)=>request<SearchItem[]>(`/school/admin/search?q=${encodeURIComponent(q)}`),community:()=>request<Array<{id:string;body:string;createdAt:string;course:{id:string;title:string};author:{name:string|null;email:string}}>>('/school/admin/community')}
export function ago(value:string){const m=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));return m<1?'just now':m<60?`${m}m ago`:m<1440?`${Math.floor(m/60)}h ago`:`${Math.floor(m/1440)}d ago`}
