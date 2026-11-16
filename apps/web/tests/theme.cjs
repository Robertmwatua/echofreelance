const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript')
const source=fs.readFileSync(path.join(__dirname,'../lib/theme.ts'),'utf8')
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
function environment({systemDark=false,saved,legacy,blocked=false}={}){
 const data=new Map(),events=new Map(),systemListeners=new Set(),classes=new Set(['light'])
 if(saved)data.set('theme',saved);if(legacy)data.set('ef_theme',legacy)
 const root={dataset:{},style:{},classList:{toggle(k,on){on?classes.add(k):classes.delete(k)},remove(k){classes.delete(k)}}}
 const media={matches:systemDark,addEventListener(_,fn){systemListeners.add(fn)},removeEventListener(_,fn){systemListeners.delete(fn)}}
 let meta=null
 const doc={documentElement:root,querySelector(){return meta},createElement(){return {}},head:{appendChild(node){meta=node}},addEventListener(){}}
 const win={matchMedia:()=>media,addEventListener(k,fn){if(!events.has(k))events.set(k,new Set());events.get(k).add(fn)},removeEventListener(k,fn){events.get(k)?.delete(fn)},dispatchEvent(event){events.get(event.type)?.forEach(fn=>fn(event))}}
 const storage={getItem(k){if(blocked)throw Error('blocked');return data.get(k)||null},setItem(k,v){if(blocked)throw Error('blocked');data.set(k,v)},removeItem(k){if(blocked)throw Error('blocked');data.delete(k)}}
 const context={exports:{},window:win,document:doc,localStorage:storage,Event:class{constructor(type){this.type=type}},getComputedStyle(){return {backgroundColor:root.dataset.theme==='dark'?'rgb(25, 26, 22)':'rgb(244, 241, 234)',getPropertyValue(){return 'resolved'}}}}
 vm.runInNewContext(js,context)
 return {api:context.exports,context,root,data,classes,systemListeners,media,win,get meta(){return meta},system(value){media.matches=value;systemListeners.forEach(fn=>fn())},storage(value){value===null?data.delete('theme'):data.set('theme',value);win.dispatchEvent({type:'storage',key:'theme'})}}
}
let checks=0
function check(name,fn){fn();checks++;console.log('PASS '+name)}
check('Automatic mode follows OS without saving a preference',()=>{
 const e=environment({systemDark:true}),seen=[];const stop=e.api.watchTheme(t=>seen.push(t))
 assert.equal(e.root.dataset.theme,'dark');assert.equal(e.data.has('theme'),false);assert.equal(e.systemListeners.size,1)
 e.system(false);assert.equal(e.root.dataset.theme,'light');assert.equal(seen.at(-1),'light');stop();assert.equal(e.systemListeners.size,0)
})
check('Manual selection detaches OS listener and updates browser colour',()=>{
 const e=environment();e.api.watchTheme(()=>{});e.api.toggleTheme()
 assert.equal(e.data.get('theme'),'dark');assert.equal(e.systemListeners.size,0);e.system(true);e.system(false)
 assert.equal(e.root.dataset.theme,'dark');assert.equal(e.meta.content,'rgb(25, 26, 22)');assert(e.classes.has('dark'));assert(!e.classes.has('light'))
})
check('Cross-tab preference updates and clearing restore system mode',()=>{
 const e=environment({saved:'dark'});e.api.watchTheme(()=>{});e.storage('light');assert.equal(e.root.dataset.theme,'light')
 e.storage(null);assert.equal(e.systemListeners.size,1);e.system(true);assert.equal(e.root.dataset.theme,'dark')
})
check('Existing explicit preferences migrate once',()=>{
 const e=environment({systemDark:true,legacy:'light'});assert.equal(e.api.getStoredTheme(),'light');assert.equal(e.data.get('theme'),'light');assert(!e.data.has('ef_theme'))
})
check('Blocked storage remains usable and remembers manual choice in memory',()=>{
 const e=environment({blocked:true});e.api.watchTheme(()=>{});e.api.toggleTheme();assert.equal(e.root.dataset.theme,'dark');assert.equal(e.systemListeners.size,0)
 e.system(false);assert.equal(e.root.dataset.theme,'dark')
})
for(const scenario of [{systemDark:true},{systemDark:false},{systemDark:true,saved:'light'},{systemDark:false,saved:'dark'},{systemDark:true,blocked:true}]){
 check('Head bootstrap before paint '+JSON.stringify(scenario),()=>{
  const e=environment(scenario);vm.runInNewContext(e.api.THEME_BOOTSTRAP,e.context)
  assert.equal(e.root.dataset.theme,scenario.saved||(scenario.systemDark?'dark':'light'));assert.equal(e.root.style.colorScheme,e.root.dataset.theme)
  if(!scenario.saved)assert(!e.data.has('theme'))
 })
}
const css=fs.readFileSync(path.join(__dirname,'../styles/tokens.css'),'utf8')
function declarations(block){return Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]))}
const light=declarations(css.match(/:root\s*\{([^}]+)\}/)[1]),dark={...light,...declarations(css.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)[1])}
function colour(tokens,name){
 let v=tokens[name];for(let i=0;i<8&&v.includes('var(');i++)v=v.replace(/var\((--[\w-]+)\)/g,(_,key)=>tokens[key])
 if(v[0]==='#')return v.slice(1).match(/../g).map(x=>parseInt(x,16))
 return v.match(/[\d.]+/g).map(Number).slice(0,3)
}
function luminance(rgb){return rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0)}
function ratio(tokens,a,b){const x=luminance(colour(tokens,a)),y=luminance(colour(tokens,b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
const results=[]
for(const [theme,tokens]of [['light',light],['dark',dark]]){
 const pairs=[...['--bg','--surface','--surface-raised','--bg-footer'].map(bg=>['--muted',bg,4.5]),...['--bg','--surface'].map(bg=>['--accent-text',bg,4.5]),['--on-accent','--accent',4.5],...['success','warning','danger'].map(s=>['--'+s,'--'+s+'-bg',4.5]),...['--bg','--surface'].map(bg=>['--line',bg,3])]
 for(const [text,bg,min]of pairs){const value=ratio(tokens,text,bg);assert(value>=min,theme+' '+text+'/'+bg+' contrast '+value.toFixed(2));results.push({theme,text,background:bg,ratio:Number(value.toFixed(2)),minimum:min})}
}
console.log(JSON.stringify({behaviourChecks:checks,contrast:results},null,2))
if(process.argv.includes('--report')){const target=path.join(__dirname,'../../../docs/audits/theme-contrast.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({behaviourChecks:checks,contrast:results},null,2)+'\n')}
