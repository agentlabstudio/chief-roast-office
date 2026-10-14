const ORIGIN = 'https://agentlabstudio.github.io';
const SITES = new Set(['office','personnel','quiet','handover']);
const ACTIONS = new Set(['visit','stats','feedback']);
const TOPICS = new Set(['useful','confusing','bug','idea']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED = new Set(['action','site','session','request_id','topic','text','office_extension','preview']);
const cors = {'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'authorization, content-type, apikey','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin','Cache-Control':'no-store','Content-Type':'application/json'};
const STATS = ['office_total','game_total','feedback_total','office_today','game_today','feedback_today'];
function reply(status,body) { return new Response(JSON.stringify(body),{status,headers:cors}); }
export async function boundedBody(req) {
 const reader=req.body?.getReader(); if(!reader)throw Error('invalid_request');
 const parts=[];let length=0;
 while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>8192){await reader.cancel();throw Error('too_large');}parts.push(part.value);}
 const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export function validate(data) {
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!ALLOWED.has(k))||!ACTIONS.has(data.action)||!SITES.has(data.site))return 'invalid_request';
 if(data.preview!==undefined&&typeof data.preview!=='boolean')return 'invalid_request';
 if(data.action!=='stats'&&!UUID.test(data.session??''))return 'invalid_request';
 if(data.office_extension)return 'invalid_feedback';
 if(data.action==='feedback'){
  if(!UUID.test(data.request_id??'')||!TOPICS.has(data.topic)||typeof data.text!=='string'||data.text.trim().length<3||data.text.trim().length>1200||data.text.includes('\u0000'))return 'invalid_feedback';
  if(/-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-(?:proj-)?[a-zA-Z0-9_-]{24,}|eyJ[a-zA-Z0-9_-]{24,}\.[a-zA-Z0-9_-]{20,}/.test(data.text))return 'private_details';
 }
 return null;
}
export function publicResult(value) {
 if(!value||typeof value!=='object')return null;
 if(value.ok!==true){const error=['invalid_request','invalid_feedback','feedback_limit'].includes(value.error)?value.error:'unavailable';return {ok:false,error};}
 const stats=value.stats;
 if(!stats||stats.started_at!=='2026-10-14'||typeof stats.checked_at!=='string'||!Number.isFinite(Date.parse(stats.checked_at))||!STATS.every(k=>Number.isSafeInteger(stats[k])&&stats[k]>=0))return null;
 const result={ok:true,stats:{started_at:stats.started_at,checked_at:stats.checked_at}};
 for(const k of STATS)result.stats[k]=stats[k];
 for(const k of ['counted','feedback_saved','duplicate','preview','intake_limit'])if(typeof value[k]==='boolean')result[k]=value[k];
 return result;
}
export function makeHandler({env,fetcher=fetch,cryptoAPI=crypto,now=()=>new Date()}) {
 return async(req)=>{
  if(req.headers.get('origin')!==ORIGIN)return reply(403,{ok:false,error:'origin_denied'});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(req.method!=='POST')return reply(405,{ok:false,error:'method_not_allowed'});
  const anon=env('SUPABASE_ANON_KEY'),secret=env('SUPABASE_SERVICE_ROLE_KEY'),url=env('SUPABASE_URL');
  if(!anon||!secret||!url)return reply(503,{ok:false,error:'unavailable'});
  // Deployment must retain verify_jwt:true: the gateway verifies the signature.
  // Accept only an already verified project-scoped anonymous JWT, including key rotations.
  const auth=req.headers.get('authorization')?.match(/^Bearer\s+([^\s]+)$/i);
  let claims=null;try{const part=auth?.[1]?.split('.')[1];if(part)claims=JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));}catch(_){}
  if(!claims||claims.ref!=='piltqqaxevmkswklbyms'||claims.role!=='anon'||claims.iss!=='supabase'||!Number.isFinite(claims.exp)||claims.exp<=Math.floor(now().getTime()/1000))return reply(401,{ok:false,error:'unauthorized'});
  if(!req.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return reply(415,{ok:false,error:'invalid_request'});
  let body;try{body=await boundedBody(req);}catch(e){return reply(e?.message==='too_large'?413:400,{ok:false,error:'invalid_request'});}
  const invalid=validate(body);if(invalid)return reply(400,{ok:false,error:invalid});
  try{
   let hash='';
   if(body.action!=='stats'){
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Helsinki',year:'numeric',month:'2-digit',day:'2-digit'}).format(now());
    const key=await cryptoAPI.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const bytes=await cryptoAPI.subtle.sign('HMAC',key,new TextEncoder().encode(day+'|'+body.session));
    hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
   }
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),5000);
   let response;try{
    response=await fetcher(url+'/rest/v1/rpc/chief_site_signal_v1',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+secret,'apikey':secret},signal:controller.signal,
     body:JSON.stringify({p_action:body.action,p_site:body.site,p_session_hash:hash,p_request_id:body.action==='feedback'?body.request_id:null,p_topic:body.action==='feedback'?body.topic:'',p_text:body.action==='feedback'?body.text.trim():'',p_preview:body.preview===true})});
   }finally{clearTimeout(timeout);}
   if(!response.ok)return reply(503,{ok:false,error:'unavailable'});
   const result=publicResult(await response.json());if(!result)return reply(503,{ok:false,error:'unavailable'});
   return reply(result.ok?200:result.error==='feedback_limit'?429:400,result);
  }catch(_){return reply(503,{ok:false,error:'unavailable'});}
 };
}
