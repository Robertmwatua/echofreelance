export function ProgressBar({percent,className=''}:{percent:number;className?:string}) {
 const p=Number.isFinite(percent)?Math.max(0,Math.min(100,percent)):0
 return <div role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} className={`ef-progress ${className}`}><div style={{width:`${p}%`}}/></div>
}
