const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEEPSEEK_KEY=Deno.env.get("DEEPSEEK_API_KEY");
const GROQ_KEY=Deno.env.get("GROQ_API_KEY");

function cors(origin:string|null){return {"access-control-allow-origin":origin||"*","access-control-allow-methods":"POST,OPTIONS","access-control-allow-headers":"content-type,authorization,apikey","vary":"Origin"};}
async function db(path:string,init:RequestInit={}){return fetch(`${SUPABASE_URL}/rest/v1/${path}`,{...init,headers:{apikey:SERVICE_KEY,authorization:`Bearer ${SERVICE_KEY}`,"content-type":"application/json",...(init.headers||{})}});}
async function rpc(name:string,body:any){const r=await db(`rpc/${name}`,{method:"POST",body:JSON.stringify(body)});if(!r.ok)return[];return r.json();}
async function logUsage(provider:string,model:string,task:string,usage:any){if(!usage)return;await db("sf_model_usage",{method:"POST",body:JSON.stringify({provider,model,task,input_tokens:Number(usage.prompt_tokens)||0,output_tokens:Number(usage.completion_tokens)||0})}).catch(()=>{});}
const systemPrompt="Είσαι parser ελληνικής αγοραστικής πρόθεσης για αγορά Ελλάδας. Απάντησε ΜΟΝΟ JSON: normalized_query, mode(product|pain|merchant), budget_eur προαιρετικό, keywords έως 6. Μετέτρεψε Greeklish σε ελληνική/αγγλική σημασία όταν χρειάζεται. Μην προτείνεις προϊόντα.";
async function groqIntent(q:string){if(!GROQ_KEY)return null;const c=new AbortController(),t=setTimeout(()=>c.abort(),3000);try{const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{authorization:`Bearer ${GROQ_KEY}`,"content-type":"application/json"},body:JSON.stringify({model:"qwen/qwen3.6-27b",temperature:0,max_tokens:180,response_format:{type:"json_object"},messages:[{role:"system",content:systemPrompt},{role:"user",content:q.slice(0,700)}]}),signal:c.signal});if(!r.ok)return null;const j=await r.json();await logUsage("groq","qwen/qwen3.6-27b","search_intent_free",j.usage);return JSON.parse(j?.choices?.[0]?.message?.content||"null");}catch{return null;}finally{clearTimeout(t);}}
async function deepseekIntent(q:string,pro=false){if(!DEEPSEEK_KEY)return null;const model=pro?"deepseek-v4-pro":"deepseek-v4-flash",c=new AbortController(),t=setTimeout(()=>c.abort(),pro?9000:3500);try{const request:any={model,temperature:0,max_tokens:220,response_format:{type:"json_object"},messages:[{role:"system",content:systemPrompt},{role:"user",content:q.slice(0,700)}]};if(pro){request.thinking={type:"enabled"};request.reasoning_effort="high";}else request.thinking={type:"disabled"};const r=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",headers:{authorization:`Bearer ${DEEPSEEK_KEY}`,"content-type":"application/json"},body:JSON.stringify(request),signal:c.signal});if(!r.ok)return null;const j=await r.json();await logUsage("deepseek",model,pro?"search_intent_pro_reasoning":"search_intent_flash_no_thinking",j.usage);return JSON.parse(j?.choices?.[0]?.message?.content||"null");}catch{return null;}finally{clearTimeout(t);}}
async function intent(q:string,complex=false){return await groqIntent(q)||await deepseekIntent(q,complex);}
async function pains(){const r=await db("sf_pains?select=id,slug,title_el,keywords,demand_score&active=eq.true&order=demand_score.desc.nullslast,slug.asc&limit=30");return r.ok?await r.json():[];}
function painSuggestions(all:any[],q:string){const z=q.toLowerCase();const words=z.split(/\s+/).filter(x=>x.length>2);return all.filter((p:any)=>{const hay=`${p.title_el} ${(p.keywords||[]).join(" ")}`.toLowerCase();return hay.includes(z)||words.some(w=>hay.includes(w));}).slice(0,5);}

Deno.serve(async req=>{
  const origin=req.headers.get("origin");if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(origin)});if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405,headers:cors(origin)});
  const ip=(req.headers.get("x-forwarded-for")?.split(",")[0]||req.headers.get("x-real-ip")||"unknown").trim();const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip));const rateKey=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,"0")).join("");const allowed=await rpc("sf_claim_rate_limit",{p_key:rateKey,p_limit:45,p_window_seconds:60});if(allowed!==true)return Response.json({error:"rate_limit"},{status:429,headers:cors(origin)});
  const b=await req.json().catch(()=>({}));const mode=String(b.mode||"search");

  if(mode==="featured")return Response.json({items:await rpc("sf_featured_cards",{p_limit:Math.min(8,Number(b.limit)||6)})},{headers:{...cors(origin),"cache-control":"public,max-age=60"}});
  if(mode==="b2b")return Response.json({items:await rpc("sf_b2b_feed",{p_limit:Math.min(40,Number(b.limit)||24)})},{headers:{...cors(origin),"cache-control":"public,max-age=120"}});
  if(mode==="pains")return Response.json({items:await pains()},{headers:{...cors(origin),"cache-control":"public,max-age=300"}});
  if(mode==="notifications"){
    const audience=b.audience==="b2b"?"b2b":"b2c";const r=await db(`sf_notifications?select=id,title_el,reason_el,priority,created_at,solution:sf_solutions(id,title_el,pain:sf_pains(title_el)),offer:sf_offers(id,price_eur,old_price_eur,discount_pct,warehouse_country,delivery_days,affiliate_url,express,product:sf_products(image_url,quality_score),merchant:sf_merchants(name,merchant_score))&audience=eq.${audience}&active=eq.true&or=(expires_at.is.null,expires_at.gt.${encodeURIComponent(new Date().toISOString())})&order=priority.desc,created_at.desc&limit=8`);return Response.json({items:r.ok?await r.json():[]},{headers:{...cors(origin),"cache-control":"public,max-age=60"}});
  }
  if(mode==="merchants"){
    const r=await db("sf_merchants?select=id,ali_shop_id,name,merchant_score,eu_stock_reliability,product_survival_rate,outcome_success_rate,specializations,last_seen_at&active=eq.true&order=merchant_score.desc.nullslast&limit=20");return Response.json({items:r.ok?await r.json():[]},{headers:{...cors(origin),"cache-control":"public,max-age=180"}});
  }
  if(mode==="status"){
    const [runs,sols,products,merchants,offers,models]=await Promise.all([
      db("sf_sourcing_runs?select=id,status,stats,ai_cost_usd,started_at,finished_at,created_at&order=created_at.desc&limit=1"),
      db("sf_solutions?select=stage&active=eq.true"),db("sf_products?select=id"),db("sf_merchants?select=id&active=eq.true"),db("sf_offers?select=id&active=eq.true&eu_verified=eq.true"),db("sf_model_usage?select=provider,model,input_tokens,output_tokens,estimated_cost_usd,created_at&order=created_at.desc&limit=100")
    ]);const runRows=runs.ok?await runs.json():[],solutionRows=sols.ok?await sols.json():[],modelRows=models.ok?await models.json():[];const counts={core:solutionRows.filter((x:any)=>x.stage==="core").length,lab:solutionRows.filter((x:any)=>x.stage==="lab").length,watch:solutionRows.filter((x:any)=>x.stage==="watch").length,products:products.ok?(await products.json()).length:0,merchants:merchants.ok?(await merchants.json()).length:0,eu_offers:offers.ok?(await offers.json()).length:0};const usage=modelRows.reduce((a:any,x:any)=>{a.input+=Number(x.input_tokens)||0;a.output+=Number(x.output_tokens)||0;a.cost+=Number(x.estimated_cost_usd)||0;return a;},{input:0,output:0,cost:0});return Response.json({latest_run:runRows[0]||null,counts,model_usage:usage},{headers:{...cors(origin),"cache-control":"no-store"}});
  }

  const q=String(b.q||"").trim().slice(0,700);if(q.length<2)return Response.json({items:[],pains:[]},{headers:cors(origin)});
  let items=await rpc("sf_search_cards",{p_query:q,p_limit:8});let parsed:any=null,modelUsed:string|null=null;
  if(!Array.isArray(items)||items.length<3){parsed=await intent(q,false);if(parsed)modelUsed=GROQ_KEY?"qwen-free":"deepseek-v4-flash";if(parsed?.normalized_query){const expanded=[parsed.normalized_query,...(Array.isArray(parsed.keywords)?parsed.keywords:[])].join(" ");const next=await rpc("sf_search_cards",{p_query:expanded,p_limit:8});if(Array.isArray(next)&&next.length)items=next;}}
  const complex=q.length>180||/(συμβατ|τεχνικ|ασφαλ|ποιο από|σύγκριν|εναλλακ|compatib|compare)/i.test(q);if((!Array.isArray(items)||!items.length)&&complex){const pro=await deepseekIntent(q,true);if(pro){parsed=pro;modelUsed="deepseek-v4-pro";if(pro.normalized_query)items=await rpc("sf_search_cards",{p_query:[pro.normalized_query,...(pro.keywords||[])].join(" "),p_limit:8});}}
  const allPains=await pains();const suggestions=painSuggestions(allPains,parsed?.normalized_query||q);
  await db("sf_search_events",{method:"POST",body:JSON.stringify({query:q,normalized_query:parsed?.normalized_query||null,result_count:Array.isArray(items)?items.length:0,ai_model:modelUsed})}).catch(()=>{});
  return Response.json({items:Array.isArray(items)?items:[],pains:suggestions,ai_used:Boolean(parsed),model:modelUsed},{headers:{...cors(origin),"cache-control":"no-store"}});
});
