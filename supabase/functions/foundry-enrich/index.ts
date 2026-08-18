import CryptoJS from "npm:crypto-js@4.2.0";

const ENDPOINT="https://eco.taobao.com/router/rest";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function ts(){const d=new Date(Date.now()+8*3600_000),p=(n:number)=>String(n).padStart(2,"0");return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;}
function sign(params:Record<string,string>,secret:string){const c=Object.keys(params).filter(k=>k!=="sign"&&params[k]!=="").sort().map(k=>`${k}${params[k]}`).join("");return CryptoJS.HmacMD5(c,secret).toString(CryptoJS.enc.Hex).toUpperCase();}
async function db(path:string,init:RequestInit={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE_KEY,authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",prefer:"return=representation",...(init.headers||{})}});}
async function authorized(req:Request){const token=req.headers.get("x-foundry-token")||"";if(!token)return false;const r=await db("sf_internal_config?select=value&key=eq.job_token&limit=1");const rows=await r.json().catch(()=>[]);return Array.isArray(rows)&&token===rows[0]?.value;}
async function details(ids:string[]){
  const appKey=Deno.env.get("ALIEXPRESS_APP_KEY"),secret=Deno.env.get("ALIEXPRESS_APP_SECRET"),tracking=Deno.env.get("ALIEXPRESS_TRACKING_ID");
  if(!appKey||!secret||!tracking)throw new Error("AliExpress credentials missing");
  const params:Record<string,string>={method:"aliexpress.affiliate.productdetail.get",app_key:appKey,sign_method:"hmac",timestamp:ts(),format:"json",v:"2.0",product_ids:ids.join(","),target_currency:"EUR",target_language:"EN",tracking_id:tracking,country:"GR",fields:"product_id,product_title,product_main_image_url,target_sale_price,target_original_price,discount,commission_rate,lastest_volume,evaluate_rate,promotion_link,product_detail_url,shop_id,shop_url,first_level_category_name,second_level_category_name"};
  const body=new URLSearchParams({...params,sign:sign(params,secret)});const c=new AbortController(),t=setTimeout(()=>c.abort(),14000);
  try{const r=await fetch(ENDPOINT,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded;charset=utf-8"},body,signal:c.signal});const j=await r.json();if(!r.ok||j?.error_response)throw new Error("AliExpress detail failed");const raw=j?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product;return Array.isArray(raw)?raw:raw?[raw]:[];}finally{clearTimeout(t);}
}

Deno.serve(async req=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  if(!(await authorized(req)))return Response.json({error:"unauthorized"},{status:401});
  const body=await req.json().catch(()=>({}));let runId=String(body.run_id||"").trim();
  if(!runId){const rr=await db("sf_sourcing_runs?select=id&status=in.(completed,partial)&order=created_at.desc&limit=1");runId=(await rr.json())?.[0]?.id||"";}
  if(!runId)return Response.json({ok:false,error:"no_sourcing_run"},{status:404});
  const cr=await db(`sf_candidates?select=id,ali_product_id,source_payload&run_id=eq.${runId}&stage=eq.eu_verified&limit=2000`);const rows=await cr.json();
  const candidates=Array.isArray(rows)?rows:[];const unique=[...new Set(candidates.map((x:any)=>String(x.ali_product_id)).filter((x:string)=>/^\d+$/.test(x)))];
  let enriched=0,batches=0,errors=0;
  for(let i=0;i<unique.length;i+=20){
    const ids=unique.slice(i,i+20);let found:any[]=[];try{found=await details(ids);batches++;}catch(e){errors++;console.error("detail_batch_failed",String(e));continue;}
    const byId=new Map(found.map((p:any)=>[String(p?.product_id||""),p]));
    for(const row of candidates.filter((x:any)=>ids.includes(String(x.ali_product_id)))){const detail=byId.get(String(row.ali_product_id));if(!detail)continue;const nextPayload={...(row.source_payload||{}),detail};await db(`sf_candidates?id=eq.${row.id}`,{method:"PATCH",body:JSON.stringify({stage:"enriched",source_payload:nextPayload,updated_at:new Date().toISOString()})});enriched++;}
  }
  const rr=await db(`sf_sourcing_runs?select=stats&id=eq.${runId}&limit=1`);const run=(await rr.json())?.[0];const stats={...(run?.stats||{}),enrich:{eu_unique:unique.length,batches,enriched,errors}};
  await db(`sf_sourcing_runs?id=eq.${runId}`,{method:"PATCH",body:JSON.stringify({stats})});
  return Response.json({ok:true,run_id:runId,stats:stats.enrich});
});
