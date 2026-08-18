const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_COUNTRIES=["ES","PL","FR"];
const ALLOWED=new Set(["AT","BE","BG","HR","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK"]);

async function db(path:string,init:RequestInit={}){
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE_KEY,authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",prefer:"return=representation",...(init.headers||{})}});
}
function clean(v:unknown){return String(v??"").replace(/\s+/g," ").trim();}
function slugQuery(q:string){return clean(q).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,105)||"products";}
function decode(v:string){return v.replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function absoluteImage(v:string){let x=decode(v).trim();if(x.startsWith("//"))x=`https:${x}`;if(x.startsWith("http://"))x=`https://${x.slice(7)}`;return /^https:\/\//i.test(x)?x:"";}
function extractProducts(html:string){
  const found=new Map<string,{titleHint:string|null,imageHint:string|null}>();
  const re=/<a\b([^>]*)\bhref=["']([^"']*\/item\/(\d{8,})\.html[^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(html))&&found.size<120){
    const raw=decode(m[2]); let decoded=raw; try{decoded=decodeURIComponent(raw);}catch{}
    const objectId=decoded.match(/x_object_id:(\d{8,})/i)?.[1]||raw.match(/x_object_id%3A(\d{8,})/i)?.[1];
    const productId=String(objectId||m[3]);
    const body=String(m[5]||""); const attrs=`${m[1]||""} ${m[4]||""}`;
    const title=(attrs.match(/\b(?:title|aria-label)=["']([^"']+)["']/i)?.[1]||body.match(/<img\b[^>]*\balt=["']([^"']+)["']/i)?.[1]||"").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim().slice(0,320);
    const imgTag=body.match(/<img\b[^>]*>/i)?.[0]||"";
    const img=absoluteImage(imgTag.match(/\b(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i)?.[1]||"");
    if(/^\d+$/.test(productId)) found.set(productId,{titleHint:title||null,imageHint:img||null});
  }
  return found;
}
async function fetchCountry(query:string,country:string){
  const proofUrl=`https://www.aliexpress.com/w/wholesale-${slugQuery(query)}.html?shipFromCountry=${country}&shipTo=GR&currency=EUR`;
  const c=new AbortController(); const t=setTimeout(()=>c.abort(),14000);
  try{
    const r=await fetch(proofUrl,{headers:{"user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36","accept-language":"en-US,en;q=0.9"},signal:c.signal,redirect:"follow"});
    const html=await r.text(); const blocked=/captcha|security verification|unusual traffic|punish/i.test(html);
    return {ok:r.ok&&!blocked,status:r.status,proofUrl,products:r.ok&&!blocked?extractProducts(html):new Map<string,{titleHint:string|null,imageHint:string|null}>(),blocked};
  }catch{return {ok:false,status:0,proofUrl,products:new Map<string,{titleHint:string|null,imageHint:string|null}>(),blocked:false};}
  finally{clearTimeout(t);}
}

Deno.serve(async req=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  const body=await req.json().catch(()=>({}));
  let runId=clean(body.run_id);
  if(!runId){
    const rr=await db("sf_sourcing_runs?select=id,stats&status=in.(completed,partial)&order=created_at.desc&limit=1");
    const rows=await rr.json(); runId=rows?.[0]?.id||"";
  }
  if(!runId)return Response.json({ok:false,error:"no_sourcing_run"},{status:404});

  const countries=(Array.isArray(body.countries)?body.countries:DEFAULT_COUNTRIES).map((x:unknown)=>clean(x).toUpperCase()).filter((x:string)=>ALLOWED.has(x)).slice(0,5);
  const cr=await db(`sf_candidates?select=id,ali_product_id,source_payload&run_id=eq.${runId}&stage=eq.discovered&limit=4000`);
  const candidates=await cr.json();
  const groups=new Map<string,{painId:string;query:string;candidateIds:Set<string>;rowIds:Map<string,number[]>}>();
  for(const row of (Array.isArray(candidates)?candidates:[])){
    const painId=clean(row?.source_payload?.pain_id),query=clean(row?.source_payload?.query),pid=clean(row?.ali_product_id);
    if(!painId||!query||!/^\d+$/.test(pid))continue;
    const key=`${painId}::${query}`;
    if(!groups.has(key))groups.set(key,{painId,query,candidateIds:new Set(),rowIds:new Map()});
    const g=groups.get(key)!; g.candidateIds.add(pid); if(!g.rowIds.has(pid))g.rowIds.set(pid,[]); g.rowIds.get(pid)!.push(Number(row.id));
  }

  let requests=0,successfulRequests=0,proofs=0,verifiedCandidates=0;
  for(const g of groups.values()){
    const results=await Promise.all(countries.map(c=>fetchCountry(g.query,c)));
    requests+=results.length; successfulRequests+=results.filter(x=>x.ok).length;
    const verifiedProductIds=new Set<string>();
    const evidenceRows:any[]=[];
    for(let i=0;i<results.length;i++){
      const result=results[i],country=countries[i];
      if(!result.ok)continue;
      for(const [productId,hints] of result.products){
        if(!g.candidateIds.has(productId))continue;
        verifiedProductIds.add(productId); proofs++;
        evidenceRows.push({run_id:runId,pain_id:g.painId,sourcing_query:g.query,ali_product_id:productId,warehouse_country:country,proof_url:result.proofUrl,verification_source:"aliexpress_explicit_ship_from_filter",title_hint:hints.titleHint,image_hint:hints.imageHint,verified_at:new Date().toISOString(),expires_at:new Date(Date.now()+24*3600_000).toISOString()});
      }
    }
    if(evidenceRows.length)await db("sf_eu_evidence?on_conflict=run_id,pain_id,sourcing_query,ali_product_id,warehouse_country",{method:"POST",headers:{prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(evidenceRows)});
    const rowIds=[...verifiedProductIds].flatMap(pid=>g.rowIds.get(pid)||[]);
    if(rowIds.length){await db(`sf_candidates?id=in.(${rowIds.join(",")})`,{method:"PATCH",body:JSON.stringify({stage:"eu_verified",updated_at:new Date().toISOString()})});verifiedCandidates+=rowIds.length;}
  }

  const runRes=await db(`sf_sourcing_runs?select=stats&id=eq.${runId}&limit=1`); const runRows=await runRes.json();
  const stats={...(runRows?.[0]?.stats||{}),eu_verify:{groups:groups.size,countries,requests,successful_requests:successfulRequests,proof_rows:proofs,verified_candidates:verifiedCandidates}};
  await db(`sf_sourcing_runs?id=eq.${runId}`,{method:"PATCH",body:JSON.stringify({stats})});
  return Response.json({ok:true,run_id:runId,stats:stats.eu_verify});
});
