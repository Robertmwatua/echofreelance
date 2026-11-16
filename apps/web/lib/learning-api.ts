import {request} from './api'
export type Question={prompt:string;options:string[];correctIndex?:number;explanation?:string}
export type Quiz={id:string;lessonId:string;lessonTitle:string;title:string;passPercent:number;requiredForCertificate:boolean;published:boolean;revision:number;questions:Question[];passed:boolean;lastAttempt:{score:number;passed:boolean}|null}
export type QuizDraft={title:string;passPercent:number;requiredForCertificate:boolean;published:boolean;questions:Question[]}
export type QuizResult={score:number;passed:boolean;results:{prompt:string;correct:boolean;correctAnswer:string;explanation:string}[];certificate?:{code:string}|null}
export type Attendance={id:string;title:string;courseTitle:string;startsAt:string;status:string;enteredAt:string|null}
const send=(method:string,body:unknown)=>({method,body:JSON.stringify(body)})
export const learning={
 quizzes:(courseId:string)=>request<Quiz[]>(`/learning/courses/${courseId}/quizzes`),
 saveQuiz:(lessonId:string,body:QuizDraft)=>request(`/learning/lessons/${lessonId}/quiz`,send('PUT',body)),
 attempt:(id:string,revision:number,answers:number[])=>request<QuizResult>(`/learning/quizzes/${id}/attempts`,send('POST',{revision,answers})),
 attendance:()=>request<Attendance[]>('/learning/attendance'),
 mark:(classId:string,userId:string,status:string)=>request(`/learning/classes/${classId}/attendance/${userId}`,send('PUT',{status})),
}
