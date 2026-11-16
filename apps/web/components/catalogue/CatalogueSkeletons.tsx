/** Same three zones and the same heights as a real card, so nothing jumps on load. */
export function CatalogueSkeletons({count=6}:{count?:number}){
 return <ul className="courses-grid" role="status" aria-label="Loading courses" aria-busy="true">
  {Array.from({length:count},(_,i)=><li key={i}>
   <div className="course-skeleton" aria-hidden="true">
    <div className="course-skeleton-head">
     <div className="flex items-center gap-2"><div className="ef-skeleton h-8 w-8 rounded"/><div className="ef-skeleton h-3 w-24"/></div>
     <div className="ef-skeleton h-6 w-20 rounded-full"/>
    </div>
    <div className="course-skeleton-body">
     <div className="ef-skeleton h-5 w-11/12"/>
     <div className="ef-skeleton h-5 w-2/3"/>
     <div className="ef-skeleton h-3 w-full"/>
     <div className="ef-skeleton h-3 w-4/5"/>
    </div>
    <div className="course-skeleton-foot"><div className="ef-skeleton h-5 w-28"/><div className="ef-skeleton h-8 w-8 rounded"/></div>
   </div>
  </li>)}
 </ul>
}
