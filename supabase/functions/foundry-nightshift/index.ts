import CryptoJS from "npm:crypto-js@4.2.0";

const endpoint = "https://eco.taobao.com/router/rest";
const EU = new Set(["AT","BE","BG","HR","CY","CZ","DE","DK","EE","ES","FI","FR","GR","HU","IE","IT","LT","LU","LV","MT","NL","PL","PT","RO","SE","SI","SK"]);

function timestamp() {
  const d = new Date(Date.now() + 8 * 3600_000); const p=(n:number)=>String(n).padStart(2,"0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
function sign(params:Record<string,string>, secret:string) {
  const canonical=Object.keys(params).filter(k=>k!=="sign"&&params[k]!=="").sort().map(k=>`${k}${params[k]}`).join("");
  return CryptoJS.HmacMD5(canonical,secret).toString(CryptoJS.enc.Hex).toUpperCase();
}
async function aliSearch(query:string) {
  const appKey=Deno.env.get("ALIEXPRESS_APP_KEY"), secret=Deno.env.get("ALIEXPRESS_APP_SECRET"), tracking=Deno.env.get("ALIEXPRESS_TRACKING_ID");
  if(!appKey||!secret||!tracking) throw new Error("AliExpress credentials missing");
  const params:Record<string,string>={method:"aliexpress.affiliate.product.query",app_key:appKey,sign_method:"hmac",timestamp:timestamp(),format:"json",v:"2.0",keywords:query,target_currency:"EUR",target_language:"EN",tracking_id:tracking,ship_to_country:"GR",page_no:"1",page_size:"50",delivery_days:"15",sort:"LAST_VOLUME_DESC",fields:"product_id,product_title,product_main_image_url,target_sale_price,target_original_price,discount,commission_rate,lastest_volume,evaluate_rate,promotion_link,shop_id,shop_url"};
  const body=new URLSearchParams({...params,sign:sign(params,secret)});
  const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded;charset=utf-8"},body});
  const j=await r.json(); if(!r.ok||j?.error_response) throw new Error("AliExpress request failed");
  const products=j?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;
  return Array.isArray(products)?products:[];
}
async function db(path:string, init:RequestInit={}) {
  const u=Deno.env.get("SUPABASE_URL")!, k=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return fetch(`${u}/rest/v1/${path}`,{...init,headers:{apikey:k,authorization:`Bearer ${k}`,"content-type":"application/json",prefer:"return=representation",...(init.headers||{})}});
}

Deno.serve(async(req)=>{
  if(req.method!=="POST") return new Response("method",{status:405});
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
  const auth=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const body=await req.json().catch(()=>({}));
  const force=body?.force===true && auth===service;
  if(!force){
    const since=new Date(Date.now()-20*3600_000).toISOString();
    const lock=await db(`sf_sourcing_runs?select=id,status&created_at=gte.${encodeURIComponent(since)}&status=in.(running,completed)&limit=1`);
    const existing=await lock.json(); if(Array.isArray(existing)&&existing.length) return Response.json({ok:true,skipped:true,reason:"nightshift_already_ran",run:existing[0]});
  }
  const runRes=await db("sf_sourcing_runs",{method:"POST",body:JSON.stringify({status:"running",started_at:new Date().toISOString(),stats:{source:"aliexpress",market:"GR",eu_only_target:true}})});
  const run=(await runRes.json())?.[0]; if(!run?.id) return Response.json({error:"run_create_failed"},{status:500});
  try{
    const painsRes=await db("sf_pains?select=id,title_el,keywords&active=eq.true&order=demand_score.desc.nullslast&limit=20");
    const pains=await painsRes.json(); let discovered=0,euSignals=0,queries=0;
    for(const pain of (Array.isArray(pains)?pains:[])){
      const terms=Array.isArray(pain.keywords)&&pain.keywords.length?pain.keywords.slice(0,3).join(" "):pain.title_el;
      const products=await aliSearch(terms); queries++;
      const rows=products.map((p:any)=>{
        const ship=String(p?.ship_from_country??p?.ship_from_code??p?.warehouse_country??"").toUpperCase();
        if(EU.has(ship)) euSignals++;
        return {run_id:run.id,ali_product_id:String(p?.product_id??""),stage:EU.has(ship)?"eu_candidate":"discovered",source_payload:{pain_id:pain.id,query:terms,product:p,ship_from:ship||null},scores:{volume:Number(p?.lastest_volume)||0,evaluate_rate:p?.evaluate_rate??null}};
      }).filter((x:any)=>/^\d+$/.test(x.ali_product_id));
      if(rows.length){await db("sf_candidates",{method:"POST",body:JSON.stringify(rows)});discovered+=rows.length;}
    }
    const stats={queries,discovered,eu_signals:euSignals};
    await db(`sf_sourcing_runs?id=eq.${run.id}`,{method:"PATCH",body:JSON.stringify({status:"completed",finished_at:new Date().toISOString(),stats})});
    return Response.json({ok:true,run_id:run.id,stats});
  }catch(e){
    await db(`sf_sourcing_runs?id=eq.${run.id}`,{method:"PATCH",body:JSON.stringify({status:"failed",finished_at:new Date().toISOString(),stats:{error:String(e)}})});
    return Response.json({ok:false,run_id:run.id,error:"nightshift_failed"},{status:500});
  }
});
