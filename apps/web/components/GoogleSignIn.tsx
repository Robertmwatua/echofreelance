import {Button} from './Button'
import Script from 'next/script'
import {useEffect,useRef,useState} from 'react'
import {useRouter} from 'next/router'
import {api,homeForRole,safeNext,setAuth} from '../lib/api'
type GoogleSdk={accounts:{id:{initialize:(settings:{client_id:string;nonce:string;callback:(result:{credential:string})=>void})=>void;renderButton:(element:HTMLElement,settings:Record<string,unknown>)=>void}}}
export function GoogleSignIn(){
 const router=useRouter(),host=useRef<HTMLDivElement>(null),[clientId,setClient]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{api.authOptions().then(o=>setClient(o.googleClientId||'')).catch(()=>{})},[])
 useEffect(()=>{let alive=true;if(!ready||!clientId||!host.current)return;api.googleChallenge().then(({challenge})=>{if(!alive||!host.current)return;const google=(window as Window&{google?:GoogleSdk}).google;if(!google)return;google.accounts.id.initialize({client_id:clientId,nonce:challenge,callback:async({credential})=>{setBusy(true);setError('');try{const result=await api.googleLogin(credential,challenge);setAuth(result.accessToken,result.user);router.replace(safeNext(router.query.next,homeForRole(result.user.role)))}catch(e){setError(e instanceof Error?e.message:'Google sign-in failed.');setReady(false)}finally{setBusy(false)}}});google.accounts.id.renderButton(host.current,{theme:'outline',size:'large',text:'continue_with',shape:'rectangular',width:Math.min(330,host.current.clientWidth||280)})}).catch(e=>setError(e.message));return()=>{alive=false}},[ready,clientId])
 if(!clientId)return null
 return <div className="mt-6"><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={()=>setReady(true)} onError={()=>setError('Google could not load. Use your email and password below.')}/><div ref={host} className="min-h-[44px]"/>{busy&&<p role="status" className="ef-meta mt-3">Verifying your Google account…</p>}{error&&<p role="alert" className="ef-toast mt-3">{error} <Button className="ef-btn-ghost" onClick={()=>{setError('');setReady(true)}}>Try again</Button></p>}<p className="ef-meta mt-4">Or use your email and password.</p></div>
}
