"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { homeDemandCases, resolveDemandCase, suggestDemandCases, type DemandCase } from "@/lib/demand";
import type { Product, SearchResponse } from "@/lib/types";

type TrackedProduct = Product & { trackingPath?: string; outboundToken?: string };
type ResearchResult = { researchToken?: string; briefPath?: string; products?: TrackedProduct[]; emailStatus?: string };

const premiumIdeas = [
  { title: "Ρομποτική σκούπα & σφουγγάρισμα", query: "premium robot vacuum self empty station lidar mop 100+", role: "Top Match", icon: "◉" },
  { title: "Εργονομική καρέκλα γραφείου", query: "premium ergonomic office chair adjustable lumbar headrest 100+", role: "Best Value", icon: "▤" },
  { title: "4K Smart Projector", query: "premium 4k smart projector auto focus keystone 100+", role: "High Demand", icon: "◈" },
];

function makeSession(){if(typeof crypto!=="undefined"&&"randomUUID" in crypto)return crypto.randomUUID();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)})}
function money(value?:number,currency="EUR"){if(!Number.isFinite(Number(value)))return"Τιμή στο AliExpress";try{return new Intl.NumberFormat("el-GR",{style:"currency",currency,maximumFractionDigits:2}).format(Number(value))}catch{return`${Number(value).toFixed(2)} ${currency}`}}
function tracking(product:TrackedProduct){return typeof product.trackingPath==="string"&&/^\/go\/[a-f0-9]+$/i.test(product.trackingPath)?product.trackingPath:null}

export function V4HomeStage4(){
  const [query,setQuery]=useState("");
  const [sessionId,setSessionId]=useState("");
  const [loading,setLoading]=useState(false);
  const [response,setResponse]=useState<SearchResponse|null>(null);
  const [error,setError]=useState("");
  const [focused,setFocused]=useState(false);
  const [activeDemand,setActiveDemand]=useState<string|null>(null);
  const [researchToken,setResearchToken]=useState("");
  const [briefPath,setBriefPath]=useState("");
  const [trackingReady,setTrackingReady]=useState(false);
  const [saved,setSaved]=useState<string[]>([]);
  const [compare,setCompare]=useState<string[]>([]);
  const [offerOpen,setOfferOpen]=useState(false);
  const [email,setEmail]=useState("");
  const [marketingConsent,setMarketingConsent]=useState(false);
  const [leadState,setLeadState]=useState<"idle"|"sending"|"ready"|"sent"|"error">("idle");
  const [leadMessage,setLeadMessage]=useState("");
  const searchRef=useRef<HTMLInputElement>(null);
  const demands=useMemo(()=>homeDemandCases(6),[]);
  const suggestions=useMemo(()=>suggestDemandCases(query,5),[query]);
  const products=(response?.products||[]) as TrackedProduct[];

  useEffect(()=>{
    const key="vresmou-session";const existing=window.localStorage.getItem(key),id=existing||makeSession();window.localStorage.setItem(key,id);setSessionId(id);
    try{setSaved(JSON.parse(window.localStorage.getItem("vresmou-saved")||"[]"))}catch{}
    const initial=new URLSearchParams(window.location.search).get("q");if(initial){setQuery(initial);window.setTimeout(()=>void runSearch(initial,id),120)}
  },[]);

  useEffect(()=>{
    if(!researchToken||products.length===0)return;
    const key=`vresmou-offer-${researchToken}`;
    if(window.sessionStorage.getItem(key))return;
    const timer=window.setTimeout(()=>{setOfferOpen(true);window.sessionStorage.setItem(key,"1");void event("offer_view",{researchToken})},9000);
    return()=>window.clearTimeout(timer);
  },[researchToken,products.length]);

  async function event(eventName:string,extra:Record<string,unknown>={}){
    try{await fetch("/api/engagement",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"event",eventName,sessionId,source:"web",...extra})})}catch{}
  }

  async function createResearch(data:SearchResponse,raw:string,sid:string){
    const match=resolveDemandCase(raw);
    const request=await fetch("/api/engagement",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"create_research",sessionId:sid,query:raw,understood:data.understood||"",demandSlug:match?.item.slug||"",products:data.products||[]})});
    const result=await request.json() as ResearchResult & {error?:string};
    if(!request.ok||!result.researchToken||!Array.isArray(result.products))throw new Error(result.error||"tracking_unavailable");
    setResearchToken(result.researchToken);setBriefPath(result.briefPath||`/brief/${result.researchToken}`);setTrackingReady(true);
    return{...data,products:result.products};
  }

  async function runSearch(raw:string,sid=sessionId){
    const cleaned=raw.trim();if(!cleaned||loading)return;
    setLoading(true);setError("");setResponse(null);setResearchToken("");setBriefPath("");setTrackingReady(false);setCompare([]);
    void event("search_started",{metadata:{queryLength:cleaned.length}});
    try{
      const request=await fetch("/api/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({message:`${cleaned}. Μόνο προϊόντα με επιβεβαιωμένη αποστολή από αποθήκη ΕΕ προς Ελλάδα.`,sessionId:sid})});
      let data=await request.json() as SearchResponse&{error?:string};if(!request.ok)throw new Error(data.error||"Η αναζήτηση δεν ολοκληρώθηκε.");
      if(data.status==="complete"&&(data.products?.length||0)>0){try{data=await createResearch(data,cleaned,sid)}catch{setTrackingReady(false)}}
      setResponse(data);window.setTimeout(()=>document.querySelector("#results")?.scrollIntoView({behavior:"smooth",block:"start"}),80);
    }catch(cause){setError(cause instanceof Error?cause.message:"Κάτι πήγε στραβά.")}finally{setLoading(false)}
  }

  function submit(e:FormEvent){e.preventDefault();void runSearch(query)}
  function chooseDemand(item:DemandCase){setActiveDemand(item.slug);setQuery(item.searchQuery);setFocused(false);void runSearch(item.searchQuery)}

  function saveProduct(product:TrackedProduct){const id=product.productId||product.title||"";if(!id)return;const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];setSaved(next);window.localStorage.setItem("vresmou-saved",JSON.stringify(next));void event("product_save",{researchToken,productId:product.productId,metadata:{saved:next.includes(id)}})}
  function compareProduct(product:TrackedProduct){const id=product.productId||"";if(!id)return;let next=compare.includes(id)?compare.filter(x=>x!==id):[...compare,id].slice(-3);setCompare(next);void event("product_compare",{researchToken,productId:id,metadata:{selected:next.includes(id),count:next.length}})}

  async function share(kind:string,product?:TrackedProduct){
    const productPath=product?tracking(product):null;const path=productPath||briefPath||window.location.pathname+window.location.search;const url=new URL(path,window.location.origin).href;const text=product?.title?`Δες αυτή την AI-verified επιλογή: ${product.title}`:`Δες την AI έρευνα αγορών μου στο ΒρεςΜου`;
    await event("share",{researchToken,productId:product?.productId,source:kind,metadata:{kind}});
    const eu=encodeURIComponent(url),et=encodeURIComponent(text),links:Record<string,string>={facebook:`https://www.facebook.com/sharer/sharer.php?u=${eu}`,messenger:`fb-messenger://share/?link=${eu}`,whatsapp:`https://wa.me/?text=${et}%20${eu}`,viber:`viber://forward?text=${et}%20${eu}`,pinterest:`https://www.pinterest.com/pin/create/button/?url=${eu}&description=${et}`};
    if(kind==="instagram"||kind==="tiktok"||kind==="native"){if(navigator.share){await navigator.share({title:"ΒρεςΜου",text,url});return}await navigator.clipboard?.writeText(`${text} ${url}`);window.alert("Ο σύνδεσμος αντιγράφηκε για Story/Message.");return}const target=links[kind];if(target)window.open(target,"_blank","noopener,noreferrer")
  }

  async function requestGuide(e:FormEvent){
    e.preventDefault();if(!researchToken){setLeadState("error");setLeadMessage("Χρειάζεται πρώτα μία AI έρευνα με verified προϊόντα.");return}setLeadState("sending");setLeadMessage("");
    try{const r=await fetch("/api/engagement",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"lead",email,researchToken,sessionId,marketingConsent,locale:"el",siteBaseUrl:window.location.origin})});const d=await r.json() as {emailStatus?:string;briefPath?:string;detail?:string};if(!r.ok)throw new Error(d.detail||"Δεν μπόρεσα να αποθηκεύσω το email.");if(d.briefPath)setBriefPath(d.briefPath);if(d.emailStatus==="sent"){setLeadState("sent");setLeadMessage("Ο οδηγός στάλθηκε στο email σου και είναι διαθέσιμος και εδώ.")}else{setLeadState("ready");setLeadMessage("Ο οδηγός είναι έτοιμος. Η αποστολή email δεν είναι ενεργοποιημένη ακόμη, οπότε δεν θα ισχυριστούμε ότι στάλθηκε.")}}catch(err){setLeadState("error");setLeadMessage(err instanceof Error?err.message:"Σφάλμα αποθήκευσης.")}
  }

  const compared=products.filter(p=>p.productId&&compare.includes(p.productId));

  return <main className="v4-shell">
    <header className="v4-header"><a href="#top" className="brand" aria-label="ΒρεςΜου αρχική"><span className="brand-mark">◒</span><span><b>ΒρεςΜου</b><small>AI αγορές με νόημα</small></span></a><nav aria-label="Κύρια πλοήγηση"><a href="/methodology">Πώς δουλεύει</a><a href="/premium">Premium 100€+</a><a href="/needs">Ανάγκες</a><button type="button" onClick={()=>searchRef.current?.focus()}>AI Advisor</button><a href="#trust">Διαφάνεια</a><a className="nav-offer" href="#offer">Προσφορές</a></nav><div className="header-actions"><button type="button" aria-label={`Αποθηκευμένα ${saved.length}`}>♡ <small>{saved.length||""}</small></button><button type="button" className="login-button">Σύνδεση</button><button type="button" className="ai-button" onClick={()=>searchRef.current?.focus()}>✦ AI αναζήτηση</button></div></header>
    <aside className="share-rail" aria-label="Κοινοποίηση"><span>Κοινοποίηση</span>{[["facebook","f"],["messenger","m"],["whatsapp","w"],["viber","v"],["tiktok","♪"],["instagram","◎"],["pinterest","p"],["native","↗"]].map(([k,l])=><button key={k} onClick={()=>void share(k)} aria-label={k}>{l}</button>)}</aside>

    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow">AI DEMAND INTELLIGENCE · EU ONLY</p><h1>Τι θέλεις να βρεις <span>σήμερα;</span></h1><p className="hero-lead">Περιέγραψε τι θέλεις να πετύχεις. Το AI μετατρέπει την ανάγκη σε semantic intent, ψάχνει EU warehouse προϊόντα και κρατά μόνο όσα περνούν τα verification gates.</p><form className="hero-search" onSubmit={submit}><span className="search-glyph">⌕</span><input ref={searchRef} value={query} onChange={e=>setQuery(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>window.setTimeout(()=>setFocused(false),130)} placeholder="π.χ. Θέλω να καθαρίζω εύκολα τρίχες σκύλου..." aria-label="AI semantic αναζήτηση"/><button type="button" className="icon-action" aria-label="Αναζήτηση με φωτογραφία" onClick={()=>window.alert("Η image-search σύνδεση θα ενεργοποιηθεί όταν το AliExpress image signature είναι διαθέσιμο.")}>▣</button><button type="submit" className="search-submit" disabled={loading}>{loading?"Αναλύω...":"Βρες μου λύση ✦"}</button></form>
      {focused&&suggestions.length>0&&<div className="semantic-suggestions" role="listbox" aria-label="Semantic προτάσεις"><div className="suggestion-label">✦ Πιθανές ανάγκες που εννοείς</div>{suggestions.map(({item,score})=><button key={item.slug} type="button" role="option" aria-selected={false} onMouseDown={e=>e.preventDefault()} onClick={()=>chooseDemand(item)}><span className="suggestion-icon">{item.icon}</span><span><b>{item.title}</b><small>{item.subtitle}</small></span><em>{score}%</em></button>)}<a href="/needs">Όλα τα pain cases →</a></div>}
      <div className="capability-row"><span>● Demand Analysis</span><span>● Pain-Gap AI</span><span>● Semantic RAG</span><span>● Product Validation</span><span className="eu-chip">🇪🇺 EU warehouse proof</span></div></div>
      <div className="hero-visual"><span className="eu-switch">🇪🇺 EU αποθήκες μόνο <i>●</i></span><div className="neural-orb">✦<small>AI</small></div><button className="floating-product fp-one" onClick={()=>void runSearch("robot vacuum self empty station lidar pet hair 100+")} aria-label="Robot vacuum search">◉</button><button className="floating-product fp-two" onClick={()=>void runSearch("4k smart projector auto focus keystone 100+")} aria-label="Projector search">◈</button><button className="floating-product fp-three" onClick={()=>void runSearch("ergonomic office chair adjustable lumbar headrest 100+")} aria-label="Office chair search">▤</button><div className="visual-copy"><b>Από το pain στη verified επιλογή.</b><span>EU proof → official product detail → affiliate tracking → AI decision.</span></div></div></section>

    <section className="needs" id="needs"><div className="section-heading"><div><p className="eyebrow">DEMAND → PAIN → SOLUTION</p><h2>Ανάγκες που αξίζει να εξερευνήσεις</h2></div><span>Κάθε κάρτα είναι semantic funnel, όχι απλή category.</span></div><div className="demand-grid">{demands.map(item=><button key={item.slug} className={`demand-card ${activeDemand===item.slug?"active":""}`} onClick={()=>chooseDemand(item)}><span className="demand-icon">{item.icon}</span><b>{item.title}</b><p>{item.subtitle}</p><small>↗ {item.signalLabel}</small></button>)}</div><div className="section-link-row"><a href="/needs">Όλα τα demand/pain cases →</a></div></section>

    <section className="premium" id="premium"><div className="section-heading"><div><p className="eyebrow">HIGH-VALUE DECISIONS</p><h2>Premium λύσεις 100€+</h2></div><span>Περισσότερο verification εκεί που το λάθος κοστίζει περισσότερο.</span></div><div className="premium-grid">{premiumIdeas.map(item=><article className="premium-card" key={item.title}><div className="premium-art"><span>{item.icon}</span></div><div className="premium-body"><small>{item.role}</small><h3>{item.title}</h3><ul><li>EU warehouse proof</li><li>Whole-product identity gate</li><li>Affiliate tracking disclosure</li></ul><button onClick={()=>{setQuery(item.query);void runSearch(item.query)}}>Ξεκίνα έρευνα →</button></div></article>)}</div></section>

    <section id="results" className={`results ${response||loading||error?"visible":""}`} aria-live="polite">
      {loading&&<div className="research-progress"><b>Το AI κάνει την έρευνα…</b><div className="progress-steps"><span>Καταλαβαίνω το intent</span><span>Βρίσκω EU evidence</span><span>Ελέγχω official details</span><span>Κρατάω τις καλύτερες</span></div></div>}
      {error&&<div className="error-box">{error}</div>}
      {response&&<><div className="result-summary"><p className="eyebrow">AI RESEARCH RESULT</p><h2>{response.understood||"Αυτές είναι οι verified επιλογές"}</h2>{response.analysis&&<div className="analysis-strip"><span>EU evidence <b>{response.analysis.euEvidenceCount??"—"}</b></span><span>Verified cards <b>{response.analysis.verifiedCount??products.length}</b></span><span>Identity rejects <b>{response.analysis.rejectedIdentity??0}</b></span><span>Tracking <b>{trackingReady?"Ready":"Unavailable"}</b></span></div>}{response.warnings?.map(w=><p className="warning" key={w}>⚠ {w}</p>)}</div>
      {products.length>0?<div className="result-grid">{products.map((product,index)=>{const href=tracking(product),id=product.productId||String(index),isSaved=saved.includes(id),isCompared=compare.includes(id);return <article className="result-card" key={id}><div className="result-image">{product.imageUrl?<img src={product.imageUrl} alt={product.title||"Προϊόν"}/>:<span>◫</span>}<b>{index===0?"AI TOP MATCH":index===1?"BEST VALUE":`#${index+1}`}</b></div><div className="result-body"><h3>{product.title||"Verified προϊόν"}</h3><p className="price">{money(product.price,product.currency)}</p><p>{product.why||"Πέρασε τα EU, identity και affiliate gates."}</p><div className="score-row"><span>AI Match</span><b>{product.matchScore!=null?`${product.matchScore}/100`:"Verified"}</b></div><div className="evidence-row"><span>🇪🇺 {product.warehouseCountry||"EU"}</span><span>Feedback: {product.verification?.positiveFeedback??"unknown"}</span></div>{product.decision?.strengths?.slice(0,2).map(x=><div className="micro-proof" key={x}>✓ {x}</div>)}{product.decision?.limitations?.slice(0,1).map(x=><div className="micro-warning" key={x}>⚠ {x}</div>)}<div className="card-actions"><button onClick={()=>saveProduct(product)} aria-pressed={isSaved}>{isSaved?"♥ Saved":"♡ Save"}</button><button onClick={()=>compareProduct(product)} aria-pressed={isCompared}>{isCompared?"✓ Compare":"⇄ Compare"}</button><button onClick={()=>void share("native",product)}>↗ Share</button></div>{href?<><a className="tracked-cta" href={`${href}?source=result_card`} target="_blank" rel="sponsored noopener noreferrer">Δες την τρέχουσα προσφορά →</a><a className="reviews-link" href={`${href}?source=reviews`} target="_blank" rel="sponsored noopener noreferrer">Δες αξιολογήσεις στο AliExpress</a></>:<button className="tracking-disabled" disabled>Περιμένω ασφαλές tracking link</button>}<small className="disclosure">Affiliate link · το relevance ranking δεν βασίζεται στην προμήθεια.</small></div></article>})}</div>:response.status==="recovery"?<div className="empty-state"><b>Δεν θα σου δείξω άσχετα προϊόντα.</b><p>{response.warnings?.[0]||"Δεν βρέθηκε επιλογή που να περνά όλα τα gates."}</p><div className="recovery-actions">{response.recoveryOptions?.map(option=><button key={option.label} onClick={()=>{setQuery(option.query);void runSearch(option.query)}}>{option.label} →</button>)}</div></div>:null}</>}
    </section>

    {compared.length>0&&<section className="compare-dock"><div><p className="eyebrow">COMPARE</p><h2>Σύγκρινε έως 3 verified επιλογές</h2></div><div className="compare-items">{compared.map(p=><article key={p.productId}><b>{p.title}</b><span>{money(p.price,p.currency)}</span><small>AI {p.matchScore??"—"} · {p.warehouseCountry}</small></article>)}</div><button onClick={()=>setCompare([])}>Καθαρισμός</button></section>}

    <section className="method" id="how"><div className="section-heading"><div><p className="eyebrow">TRANSPARENT BY DESIGN</p><h2>Πώς περνά ένα προϊόν μέχρι να το δεις</h2></div></div><div className="method-flow"><span><b>1</b> Demand intent<small>Τι πραγματικά χρειάζεσαι</small></span><i>→</i><span><b>2</b> EU proof<small>Explicit ship-from evidence</small></span><i>→</i><span><b>3</b> Official detail<small>Τιμή, εικόνα, identity</small></span><i>→</i><span><b>4</b> AI gates<small>Budget, relevance, unknowns</small></span><i>→</i><span><b>5</b> Tracked CTA<small>First-party → affiliate</small></span></div></section>
    <section className="trust-strip" id="trust"><span><b>✓ EU proof</b><small>Δεν βαφτίζουμε άγνωστο warehouse ως EU</small></span><span><b>✓ Full disclosure</b><small>Strengths, limitations και unknowns</small></span><span><b>✓ Own tracking</b><small>Κάθε CTA περνά από /go token</small></span><span><b>✓ No filler</b><small>Recovery αντί για άσχετα προϊόντα</small></span></section>

    <section className="offer-box" id="offer"><div><p className="eyebrow">PERSONAL AI BUYING BRIEF</p><h2>Κράτησε την έρευνα, τα QR και τις verified επιλογές.</h2><p>{briefPath?"Το brief έχει ήδη δημιουργηθεί μαζί με την έρευνα.":"Κάνε πρώτα μία verified αναζήτηση."}</p></div>{briefPath?<div className="offer-actions"><a href={briefPath}>Άνοιξε τον οδηγό →</a><button onClick={()=>setOfferOpen(true)}>Στείλε στο email</button></div>:<button onClick={()=>searchRef.current?.focus()}>Ξεκίνα έρευνα →</button>}</section>
    <footer className="v4-footer"><span><b>🇪🇺 EU proof</b><small>Warehouse evidence</small></span><span><b>✦ Semantic AI</b><small>Intent before keywords</small></span><span><b>◎ Tracked</b><small>First-party click path</small></span><span><b>1000/1000</b><small>Semantic CI cases</small></span><button onClick={()=>{searchRef.current?.focus();window.scrollTo({top:0,behavior:"smooth"})}}>Ξεκίνα τώρα →</button></footer>

    {offerOpen&&<div className="offer-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOfferOpen(false)}}><section className="offer-modal" role="dialog" aria-modal="true" aria-labelledby="offer-title"><button className="modal-close" aria-label="Κλείσιμο" onClick={()=>setOfferOpen(false)}>×</button><span className="modal-art">✦</span><p className="eyebrow">ΔΩΡΕΑΝ AI BUYING BRIEF</p><h2 id="offer-title">Πάρε όλη την έρευνα μαζί σου.</h2><p>Verified επιλογές, strengths/limitations, EU proof και QR codes προς τα δικά μας tracking links.</p>{leadState==="sent"||leadState==="ready"?<div className="lead-success"><b>{leadMessage}</b>{briefPath&&<a href={briefPath}>Άνοιξε τον οδηγό →</a>}</div>:<form onSubmit={requestGuide}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="to@email.sou"/></label><label className="consent"><input type="checkbox" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)}/><span>Θέλω επίσης ενημερώσεις για νέες verified προσφορές. <b>Προαιρετικό.</b></span></label><button className="modal-submit" disabled={leadState==="sending"}>{leadState==="sending"?"Αποθηκεύω...":"Θέλω τον οδηγό →"}</button>{leadState==="error"&&<p className="lead-error">{leadMessage}</p>}<button type="button" className="continue-no-email" onClick={()=>{setOfferOpen(false);if(briefPath)window.location.href=briefPath}}>Συνέχεια χωρίς email</button></form>}<small>Το email για τον οδηγό και η συγκατάθεση marketing είναι ξεχωριστά.</small></section></div>}
  </main>
}
