export function normalizeCategory(value: string) { return value.trim().replace(/animaion/ig,'animation').replace(/\s+/g,' ').toLowerCase() }
export function categoryLabel(value: string) { return normalizeCategory(value).replace(/\b\w/g,c=>c.toUpperCase()).replace(/\bAi\b/g,'AI').replace(/\bIt\b/g,'IT').replace(/Web3/g,'Web3') }
export function CategoryTabs({categories,value,total,onChange}:{categories:Record<string,number>;value:string;total:number;onChange:(v:string)=>void}) {
  return <nav className="catalogue-tabs" aria-label="Course categories"><button aria-current={!value?'page':undefined} onClick={()=>onChange('')}>All courses <span>{total}</span></button>{Object.entries(categories).sort(([a],[b])=>a.localeCompare(b)).map(([c,n])=><button key={c} aria-current={normalizeCategory(value)===c?'page':undefined} onClick={()=>onChange(c)}>{categoryLabel(c)} <span>{n}</span></button>)}</nav>
}
