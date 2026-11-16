import {ReactNode} from 'react'
export function statusTone(status:string) {
 if(/^(published|live|paid|confirmed|completed|present|passed|graded|admin|approved|success)$/i.test(status))return 'success'
 if(/^(pending|scheduled|upcoming|submitted|tutor|processing|partially paid|warning)$/i.test(status))return 'warning'
 if(/^(failed|cancelled|absent|rejected|error|overdue)$/i.test(status))return 'danger'
 return 'neutral'
}
export function StatusBadge({status,children}:{status:string;children?:ReactNode}) {
 return <span className={`school-status school-status-${statusTone(status)}`}><span aria-hidden="true" className="school-status-dot"/>{children||status}</span>
}
