import {useEffect,useState} from 'react'
import {AdminWorkspace} from '../../components/AdminWorkspace'
import {RequireRole} from '../../components/RequireRole'
import {DataTable} from '../../components/admin/DataTable'
import {admin,Overview} from '../../lib/admin-api'
export default function Reports(){return <RequireRole roles={['Admin']}>{()=> <Desk/>}</RequireRole>}
function Desk(){const [data,setData]=useState<Overview|null>(null),[error,setError]=useState('');useEffect(()=>{admin.overview().then(setData).catch(e=>setError(e.message))},[]);const rows=data?[['Courses',data.courses],['Draft courses',data.drafts],['Students',data.students],['Tutors',data.tutors],['Administrators',data.admins],['Unpaid quoted accounts',data.unpaidAccounts],['Outstanding tuition / KES',data.outstandingCents/100],['New admissions',data.newEnquiries],['Received job applications',data.newApplications]].map(([label,value],i)=>({id:String(i),label:String(label),value:Number(value)})):[];return <AdminWorkspace title="Reports" description="Current totals, not a historical accounting report. Export detailed records from the people, courses and payment desks.">{error&&<p role="alert">{error}</p>}<DataTable name="school-summary" rows={rows} columns={[{key:'metric',title:'Metric',value:r=>r.label},{key:'value',title:'Current total',numeric:true,value:r=>r.value}]}/></AdminWorkspace>}
