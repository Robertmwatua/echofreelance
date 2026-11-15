import { request } from './api'
export type Job={id:string;title:string;company:string;location:string;kind:string;description:string;deadline:string|null;published?:boolean;open?:boolean;_count?:{applications:number}}
export type Enquiry={id:string;name:string;email:string;phone:string|null;message:string;status:string;notes:string;createdAt:string;course:{id:string;title:string}|null}
export type Application={id:string;status:string;coverLetter:string;resumeUrl:string;portfolioUrl:string|null;reviewNotes:string;createdAt:string;job:{id:string;title:string;company:string};user:{name:string|null;email:string}}
export type Task={id:string;title:string;details:string;dueAt:string;done:boolean;assigneeId:string|null;assignee:{id:string;name:string|null;email:string}|null}
export type Agenda={tasks:Task[];newEnquiries:number;newApplications:number;classes:Array<{id:string;title:string;startsAt:string;endsAt:string;status:string;host:{name:string|null};course:{title:string}}>;assignments:Array<{id:string;title:string;courseId:string;dueAt:string}>}
export type JobDraft=Omit<Job,'id'|'open'|'_count'> & {published:boolean}
export type TaskDraft={title:string;details:string;dueAt:string;assigneeId:string|null}
const send=(method:string,body:unknown)=>({method,body:JSON.stringify(body)})
export const school={
 myTasks:()=>request<Task[]>('/school/tasks/mine'),
 completeTask:(id:string)=>request(`/school/tasks/${id}/complete`,{method:'POST'}),
 enquire:(body:{name:string;email:string;phone?:string;message:string;courseId?:string;consent:boolean;website:string})=>request<{id:string;message:string}>('/school/enquiries',send('POST',body)),
 jobs:()=>request<Job[]>('/school/jobs'),job:(id:string)=>request<Job>(`/school/jobs/${id}`),
 apply:(id:string,body:{coverLetter:string;resumeUrl:string;portfolioUrl?:string;consent:boolean})=>request<{id:string;status:string}>(`/school/jobs/${id}/apply`,send('POST',body)),
 mine:()=>request<Array<Pick<Application,'id'|'status'|'createdAt'|'job'>>>('/school/applications/mine'),
 adminJobs:()=>request<Job[]>('/school/admin/jobs'),
 saveJob:(body:JobDraft,id?:string)=>request<Job>(id?`/school/admin/jobs/${id}`:'/school/admin/jobs',send(id?'PATCH':'POST',body)),
 enquiries:(offset:number,status:string)=>request<{items:Enquiry[];total:number}>(`/school/admin/enquiries?offset=${offset}&status=${status}`),
 reviewEnquiry:(id:string,status:string,notes:string)=>request(`/school/admin/enquiries/${id}`,send('PATCH',{status,notes})),
 applications:(offset:number,jobId='')=>request<{items:Application[];total:number}>(`/school/admin/applications?offset=${offset}&jobId=${encodeURIComponent(jobId)}`),
 reviewApplication:(id:string,status:string,reviewNotes:string)=>request(`/school/admin/applications/${id}`,send('PATCH',{status,reviewNotes})),
 agenda:()=>request<Agenda>('/school/admin/agenda'),
 saveTask:(body:TaskDraft,id?:string)=>request<Task>(id?`/school/admin/tasks/${id}`:'/school/admin/tasks',send(id?'PATCH':'POST',body)),
 taskDone:(id:string,done:boolean)=>request<Task>(`/school/admin/tasks/${id}/status`,send('PATCH',{done})),
}
export function localDate(value:string){const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
