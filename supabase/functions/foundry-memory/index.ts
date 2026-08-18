const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
async function db(path:string,init:RequestInit={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE_KEY,authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",prefer:"return=representation",...(init.headers||{})}});}
async function authorized(req:Request){const token=req.headers.get("x-foundry-token")||"";if(!token)return false;const r=await db("sf_internal_config?select=value&key=eq.job_token&limit=1");const rows=await r.json().catch(()=>[]);return Array.isArray(rows)&&token===rows[0]?.value;}
async function upsertMemory(row:any){await db("sf_memory_items?on_conflict=kind,subject_key,content",{method:"POST",headers:{prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(row)});}
Deno.serve(async req=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  if(!(await authorized(req)))return Response.json({error:"unauthorized"},{status:401});
  const since=new Date(Date.now()-26*3600_000).toISOString();
  const er=await db(`sf_agent_events?select=agent_role,subject_type,subject_key,decision,reason_code,confidence,evidence,created_at&created_at=gte.${encodeURIComponent(since)}&order=created_at.asc&limit=5000`);const events=er.ok?await er.json():[];
  const groups=new Map<string,{count:number;role:string;reason:string;decision:string;examples:string[]}>();
  for(const e of (Array.isArray(events)?events:[])){const key=`${e.agent_role}:${e.reason_code||"none"}:${e.decision}`;if(!groups.has(key))groups.set(key,{count:0,role:e.agent_role,reason:e.reason_code||"none",decision:e.decision,examples:[]});const g=groups.get(key)!;g.count++;if(g.examples.length<5)g.examples.push(e.subject_key);}
  let memories=0;
  for(const [key,g] of groups){if(g.count<2)continue;await upsertMemory({kind:"lesson",subject_key:key,content:`Ο agent ${g.role} κατέγραψε ${g.count} περιπτώσεις '${g.decision}' με reason '${g.reason}' στο τελευταίο NightShift.`,tags:["nightshift",g.role,g.reason,g.decision],confidence:Math.min(98,65+g.count*2),source:"memory-curator",updated_at:new Date().toISOString()});memories++;}
  const mr=await db("sf_merchants?select=id,ali_shop_id,merchant_score,product_survival_rate,outcome_success_rate&active=eq.true&limit=500");const merchants=mr.ok?await mr.json():[];let updatedMerchants=0;
  for(const m of (Array.isArray(merchants)?merchants:[])){
    const or=await db(`sf_merchant_observations?select=evaluate_rate,recent_volume,eu_offer_count,observed_at&merchant_id=eq.${m.id}&observed_at=gte.${encodeURIComponent(new Date(Date.now()-30*86400_000).toISOString())}&limit=500`);const obs=or.ok?await or.json():[];
    if(!Array.isArray(obs)||!obs.length)continue;
    const euReliability=Math.min(100,obs.reduce((a:number,x:any)=>a+(Number(x.eu_offer_count)>0?1:0),0)/obs.length*100);
    const sr=await db(`sf_offers?select=solution:sf_solutions(stage)&merchant_id=eq.${m.id}&limit=500`);const linked=sr.ok?await sr.json():[];const eligible=Array.isArray(linked)?linked:[];const survived=eligible.filter((x:any)=>x.solution?.stage==="core").length;const survival=eligible.length?survived/eligible.length*100:null;
    await db(`sf_merchants?id=eq.${m.id}`,{method:"PATCH",body:JSON.stringify({eu_stock_reliability:Math.round(euReliability*10)/10,product_survival_rate:survival===null?m.product_survival_rate:Math.round(survival*10)/10,last_seen_at:new Date().toISOString()})});
    await upsertMemory({kind:"merchant",subject_key:m.ali_shop_id,content:`Merchant ${m.ali_shop_id}: EU stock reliability ${Math.round(euReliability)}%${survival===null?"":`, CORE survival ${Math.round(survival)}%`}.`,tags:["merchant","eu-stock"],confidence:Math.min(95,60+obs.length),source:"memory-curator",updated_at:new Date().toISOString()});updatedMerchants++;
  }
  return Response.json({ok:true,events:Array.isArray(events)?events.length:0,memories,updated_merchants:updatedMerchants});
});
