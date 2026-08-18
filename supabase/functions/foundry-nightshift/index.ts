import CryptoJS from "npm:crypto-js@4.2.0";

const endpoint = "https://eco.taobao.com/router/rest";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function topTimestamp() {
  const d = new Date(Date.now() + 8 * 3600_000);
  const p = (n:number) => String(n).padStart(2,"0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth()+1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
function signTop(params:Record<string,string>, secret:string) {
  const canonical = Object.keys(params).filter(k=>k!=="sign"&&params[k]!=="").sort().map(k=>`${k}${params[k]}`).join("");
  return CryptoJS.HmacMD5(canonical,secret).toString(CryptoJS.enc.Hex).toUpperCase();
}
async function db(path:string, init:RequestInit={}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers:{apikey:SERVICE_KEY,authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",prefer:"return=representation",...(init.headers||{})}
  });
}
async function aliSearch(query:string, pageSize=35) {
  const appKey=Deno.env.get("ALIEXPRESS_APP_KEY"), secret=Deno.env.get("ALIEXPRESS_APP_SECRET"), tracking=Deno.env.get("ALIEXPRESS_TRACKING_ID");
  if(!appKey||!secret||!tracking) throw new Error("AliExpress credentials missing");
  const params:Record<string,string>={
    method:"aliexpress.affiliate.product.query",app_key:appKey,sign_method:"hmac",timestamp:topTimestamp(),format:"json",v:"2.0",
    keywords:query,target_currency:"EUR",target_language:"EN",tracking_id:tracking,ship_to_country:"GR",page_no:"1",page_size:String(pageSize),
    delivery_days:"15",sort:"LAST_VOLUME_DESC",
    fields:"product_id,product_title,product_main_image_url,target_sale_price,target_original_price,discount,commission_rate,lastest_volume,evaluate_rate,promotion_link,product_detail_url,shop_id,shop_url"
  };
  const body=new URLSearchParams({...params,sign:signTop(params,secret)});
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded;charset=utf-8"},body,signal:controller.signal});
    const j=await r.json();
    if(!r.ok||j?.error_response) throw new Error(`AliExpress request failed: ${j?.error_response?.msg||r.status}`);
    const products=j?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product;
    return Array.isArray(products)?products:[];
  } finally { clearTimeout(timer); }
}

Deno.serve(async(req)=>{
  if(req.method!=="POST") return Response.json({error:"method_not_allowed"},{status:405});
  const auth=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const body=await req.json().catch(()=>({}));
  const force=body?.force===true && auth===SERVICE_KEY;

  if(!force){
    const since=new Date(Date.now()-20*3600_000).toISOString();
    const lock=await db(`sf_sourcing_runs?select=id,status,created_at&created_at=gte.${encodeURIComponent(since)}&status=in.(running,completed)&order=created_at.desc&limit=1`);
    const existing=await lock.json();
    if(Array.isArray(existing)&&existing.length) return Response.json({ok:true,skipped:true,reason:"nightshift_already_ran",run:existing[0]});
  }

  const runRes=await db("sf_sourcing_runs",{method:"POST",body:JSON.stringify({status:"running",started_at:new Date().toISOString(),stats:{source:"aliexpress_affiliate",market:"GR",warehouse_policy:"explicit_eu_proof_required"}})});
  const run=(await runRes.json())?.[0];
  if(!run?.id) return Response.json({error:"run_create_failed"},{status:500});

  try{
    const painsRes=await db("sf_pains?select=id,slug,title_el,sourcing_queries_en,sourcing_rules&active=eq.true&order=demand_score.desc.nullslast,slug.asc&limit=20");
    const pains=await painsRes.json();
    let discovered=0, queries=0, errors=0;
    const painStats:Record<string,unknown>={};

    for(const pain of (Array.isArray(pains)?pains:[])){
      const queryList=Array.isArray(pain.sourcing_queries_en)&&pain.sourcing_queries_en.length ? pain.sourcing_queries_en.slice(0,3) : [];
      let painCount=0;
      for(const query of queryList){
        try{
          const products=await aliSearch(String(query),35); queries++;
          const seen=new Set<string>();
          const rows=products.map((p:any)=>{
            const id=String(p?.product_id??"");
            if(!/^\d+$/.test(id)||seen.has(id)) return null;
            seen.add(id);
            return {
              run_id:run.id,ali_product_id:id,stage:"discovered",
              source_payload:{pain_id:pain.id,pain_slug:pain.slug,pain_title:pain.title_el,query:String(query),solution_label_el:pain?.sourcing_rules?.solution_label_el??null,product:p},
              scores:{volume:Number(p?.lastest_volume)||0,evaluate_rate:p?.evaluate_rate??null}
            };
          }).filter(Boolean);
          if(rows.length){await db("sf_candidates",{method:"POST",body:JSON.stringify(rows)}); discovered+=rows.length; painCount+=rows.length;}
        }catch(error){errors++; console.error("sourcing_query_failed",pain.slug,query,String(error));}
      }
      painStats[pain.slug]={queries:queryList.length,candidates:painCount};
    }

    const stats={queries,discovered,errors,pains:Array.isArray(pains)?pains.length:0,pain_stats:painStats};
    await db(`sf_sourcing_runs?id=eq.${run.id}`,{method:"PATCH",body:JSON.stringify({status:errors&&discovered?"partial":errors&&!discovered?"failed":"completed",finished_at:new Date().toISOString(),stats})});
    return Response.json({ok:discovered>0,run_id:run.id,stats});
  }catch(error){
    await db(`sf_sourcing_runs?id=eq.${run.id}`,{method:"PATCH",body:JSON.stringify({status:"failed",finished_at:new Date().toISOString(),stats:{error:String(error)}})});
    return Response.json({ok:false,run_id:run.id,error:"nightshift_failed"},{status:500});
  }
});
