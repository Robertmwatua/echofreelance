import PDFDocument = require('pdfkit')
import { resolve } from 'path'
export async function receiptPdf(data:{reference:string;receipt:string;student:string;email:string;course:string;amountCents:number;totalCents:number;paidCents:number;balanceCents:number;settledAt:Date}) {
 const doc=new PDFDocument({size:'A4',margin:48,info:{Title:'EchoFreelance payment receipt',Author:'EchoFreelance Tech School'}})
 doc.registerFont('School',resolve(__dirname,'../../../assets/DejaVuSans.ttf')).font('School')
 const chunks:Buffer[]=[]
 const done=new Promise<Buffer>((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject)})
 const money=(cents:number)=>`KES ${(cents/100).toLocaleString('en-KE',{maximumFractionDigits:2})}`
 doc.rect(0,0,595,14).fill('#FF4F1F');doc.fillColor('#14130F').fontSize(21).text('EchoFreelance.',48,48).fontSize(10).text('Tech School / Malindi, Kenya',48,82)
 doc.fontSize(30).text('Payment receipt',48,126).fontSize(10).fillColor('#625F55').text('Verified online instalment',48,169)
 let y=209
 const row=(label:string,value:string)=>{doc.fillColor('#625F55').fontSize(9).text(label,48,y,{width:130});doc.fillColor('#14130F').fontSize(11).text(value,190,y,{width:350});y=Math.max(y+35,doc.y+15)}
 row('School reference',data.reference);row('M-Pesa receipt',data.receipt);row('Verified / Nairobi',data.settledAt.toLocaleString('en-GB',{timeZone:'Africa/Nairobi'}));row('Student',data.student);row('Email',data.email);row('Course',data.course)
 doc.moveTo(48,y).lineTo(547,y).lineWidth(1).strokeColor('#14130F').stroke();y+=22
 row('This instalment',money(data.amountCents));row('Quoted tuition total',money(data.totalCents));row('Tuition paid to this point',money(data.paidCents));row('Tuition balance after payment',money(data.balanceCents))
 doc.fontSize(9).fillColor('#625F55').text('Registration and certification fees, if listed for your programme, are separate. This receipt covers only the verified tuition instalment above.',48,y+10,{width:499})
 doc.fontSize(8).text('ecofreelancetechnologyplus@gmail.com | echofreelancetechschool.com',48,765,{width:499,align:'center'})
 doc.end();return done
}
