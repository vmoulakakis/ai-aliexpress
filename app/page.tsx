"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Card={solution_id:string;pain_title:string;solution_title:string;image_url:string|null;price_eur:number|null;old_price_eur:number|null;discount_pct:number|null;warehouse_country:string|null;delivery_days:number|null;merchant_name:string|null;merchant_score:number|null;survivor_score:number|null;affiliate_url:string|null;express?:boolean;quality_score?:number|null;gap_type?:string|null};
type Pain={id:string;slug:string;title_el:string;keywords?:string[];demand_score?:number|null};
type Notification={id:string;title_el:string;reason_el:string|null;priority:number;solution?:{id:string;title_el:string;pain?:{title_el:string}};offer?:{id:string;price_eur:number|null;old_price_eur:number|null;discount_pct:number|null;warehouse_country:string|null;delivery_days:number|null;affiliate_url:string|null;express?:boolean;product?:{image_url:string|null;quality_score:number|null};merchant?:{name:string|null;merchant_score:number|null}}};
type Status={counts?:{core:number;lab:number;watch:number;products:number;merchants:number;eu_offers:number}};

const FALLBACK_PAINS:Pain[]=[
{id:"1",slug:"old-car-carplay",title_el:"Θέλω CarPlay στο παλιό μου αυτοκίνητο χωρίς να αλλάξω radio"},
{id:"2",slug:"weak-bedroom-wifi",title_el:"Το Wi‑Fi δεν πιάνει καλά στο υπνοδωμάτιο"},
{id:"3",slug:"renter-night-heat",title_el:"Ζεσταίνομαι το βράδυ αλλά δεν μπορώ να βάλω A/C"},
{id:"4",slug:"pet-hair-sofa",title_el:"Έχω τρίχες σκύλου παντού στον καναπέ"},
{id:"5",slug:"laptop-neck",title_el:"Πονάει ο αυχένας μου όταν δουλεύω στο laptop"},
{id:"6",slug:"small-kitchen-no-drill",title_el:"Θέλω να οργανώσω μικρή κουζίνα χωρίς τρύπες"}
];
const ICONS:Record<string,string>={"old-car-carplay":"🚗","weak-bedroom-wifi":"📶","renter-night-heat":"🌙","pet-hair-sofa":"🐕","laptop-neck":"💻","small-kitchen-no-drill":"🏠"};
const country=(v:string|null)=>v?({ES:"Ισπανία",PL:"Πολωνία",FR:"Γαλλία",DE:"Γερμανία",IT:"Ιταλία",CZ:"Τσεχία",NL:"Ολλανδία",GR:"Ελλάδα"}[v]||v):"ΕΕ";
const money=(v:number|null)=>v&&v>0?new Intl.NumberFormat("el-GR",{style:"currency",currency:"EUR"}).format(v):"Δες τιμή";
const isLab=(x:Card)=>!x.gap_type;

export default function HomePage(){
 const inputRef=useRef<HTMLInputElement>(null);
 const [q,setQ]=useState(""); const [items,setItems]=useState<Card[]>([]); const [suggestions,setSuggestions]=useState<Pain[]>([]);
 const [pains,setPains]=useState<Pain[]>(FALLBACK_PAINS); const [featured,setFeatured]=useState<Card[]>([]); const [notifications,setNotifications]=useState<Notification[]>([]); const [status,setStatus]=useState<Status|null>(null); const [loading,setLoading]=useState(false); const [model,setModel]=useState<string|null>(null);
 const query=q.trim(), dropdown=query.length>=2;

 useEffect(()=>{Promise.all([
   fetch("/api/search?mode=pains").then(r=>r.json()).catch(()=>({items:[]})),
   fetch("/api/search?mode=featured&limit=6").then(r=>r.json()).catch(()=>({items:[]})),
   fetch("/api/search?mode=notifications").then(r=>r.json()).catch(()=>({items:[]})),
   fetch("/api/search?mode=status").then(r=>r.json()).catch(()=>null)
 ]).then(([p,f,n,s])=>{if(Array.isArray(p?.items)&&p.items.length)setPains(p.items);setFeatured(Array.isArray(f?.items)?f.items:[]);setNotifications(Array.isArray(n?.items)?n.items:[]);setStatus(s);});},[]);

 useEffect(()=>{let active=true;const t=setTimeout(async()=>{if(query.length<2){setItems([]);setSuggestions([]);return;}setLoading(true);try{const r=await fetch(`/api/search?q=${encodeURIComponent(query)}`);const d=await r.json();if(active){setItems(Array.isArray(d.items)?d.items:[]);setSuggestions(Array.isArray(d.pains)?d.pains:[]);setModel(d.model||null);}}finally{if(active)setLoading(false);}},220);return()=>{active=false;clearTimeout(t);};},[query]);

 const signal=notifications[0]; const labSignal=!signal?featured[0]:null;
 const dropdownText=useMemo(()=>{if(loading)return"Ψάχνω στις ήδη ελεγμένες EU λύσεις…";if(items.length){const core=items.filter(x=>!isLab(x)).length;return `${items.length} EU λύσεις · ${core} CORE · ${items.length-core} υπό ελληνικό gap check`;}return suggestions.length?"Δεν βρέθηκε verified προϊόν — βρήκα σχετικά προβλήματα που παρακολουθεί το NightShift.":"Δεν υπάρχει ακόμη verified λύση για αυτή την αναζήτηση.";},[loading,items,suggestions]);
 function choosePain(p:Pain){setQ(p.title_el);setTimeout(()=>inputRef.current?.focus(),0);window.scrollTo({top:90,behavior:"smooth"});}
 function submit(e:FormEvent){e.preventDefault();if(items[0]?.affiliate_url)window.open(items[0].affiliate_url,"_blank","noopener,noreferrer");else inputRef.current?.focus();}

 return <main>
  <header className="topbar"><div className="shell nav"><a className="brand" href="/"><span className="brandMark">Λ</span><span>Λύσεις <b>ΕΕ</b></span></a><nav><a href="#provlimata">Προβλήματα</a><a href="#eukairies">EU λύσεις</a><a href="/emporoi">Για εμπόρους</a></nav><div className="euBadge">🇪🇺 Μόνο επαληθευμένες αποθήκες ΕΕ</div></div></header>

  <section className="hero shell">
   <div className="heroCopy"><div className="eyebrow"><span className="dot"/> AI SOURCING · ΕΛΛΗΝΙΚΗ ΑΓΟΡΑ · EU ONLY</div><h1>Τι θέλεις να <span>λύσεις;</span></h1><p className="heroLead">Πες το πρόβλημα όπως θα το έλεγες σε άνθρωπο ή γράψε προϊόν. Οι agents έχουν ήδη κάνει το βαρύ sourcing: EU warehouse proof, relevance, merchant quality και ελληνικό market gap.</p>
    <form className="searchBox" onSubmit={submit}><div className="searchRow"><span className="searchIcon">⌕</span><input ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} autoComplete="off" placeholder="π.χ. Θέλω CarPlay στο Yaris χωρίς αλλαγή radio, μέχρι 100€"/><button type="submit">Βρες λύση</button></div>
     {dropdown&&<div className="dropdown"><div className="dropdownStatus"><span>{loading?"◌":"✦"}</span>{dropdownText}{model&&<em> · AI ενεργό</em>}</div>
      {items.slice(0,6).map(x=><a className="dropItem" key={`${x.solution_id}-${x.warehouse_country}`} href={x.affiliate_url||"#"} target={x.affiliate_url?"_blank":undefined} rel="sponsored noopener noreferrer"><div className="dropThumb">{x.image_url?<img src={x.image_url} alt=""/>:"✦"}</div><div className="dropText"><span className={`stageTag ${isLab(x)?"lab":"core"}`}>{isLab(x)?"◌ EU verified · gap σε έλεγχο":"✓ CORE · ελληνικό gap"}</span><strong>{x.solution_title}</strong><small><span>🇪🇺 {country(x.warehouse_country)}</span><span>🛡️ {x.merchant_score?Math.round(x.merchant_score):"—"}/100</span>{x.express&&<span>⚡ Express</span>}</small><p>{x.pain_title}</p></div><div className="dropMoney">{x.discount_pct&&x.discount_pct>=5?<b>-{Math.round(x.discount_pct)}%</b>:null}<strong>{money(x.price_eur)}</strong></div></a>)}
      {!items.length&&suggestions.map(p=><button className="painSuggestion" key={p.id} type="button" onClick={()=>choosePain(p)}><span>{ICONS[p.slug]||"✦"}</span><div><strong>{p.title_el}</strong><small>Το NightShift ψάχνει verified EU λύσεις γι’ αυτό το πρόβλημα</small></div><i>→</i></button>)}
     </div>}
    </form><div className="trustRail"><span>✓ EU warehouse proof</span><span>✓ Ελληνικό gap check</span><span>✓ Top merchant ranking</span><span>✓ Affiliate μετά το quality gate</span></div>
   </div>

   <aside className="signalPanel"><div className="signalHead"><div><small>{signal?"ΕΞΥΠΝΟ ΣΗΜΑ":labSignal?"ΝΕΑ EU ΛΥΣΗ":"NIGHTSHIFT"}</small><strong>{signal?"Αξίζει να το δεις τώρα":labSignal?"Ο agent την κρατά στο radar":"Το sourcing δουλεύει"}</strong></div><span className={signal?"liveDot":labSignal?"labDot":"nightDot"}>{signal?"● LIVE":labSignal?"● LAB":"☾ ΝΥΧΤΑ"}</span></div>
    {signal&&signal.offer?<><div className="miniProduct"><div className="miniImage">{signal.offer.product?.image_url?<img src={signal.offer.product.image_url} alt=""/>:"✦"}</div><div><span className="signalReason">{signal.title_el}</span><h3>{signal.solution?.title_el}</h3><div className="priceBig">{money(signal.offer.price_eur)} {signal.offer.discount_pct&&signal.offer.discount_pct>=5?<b>-{Math.round(signal.offer.discount_pct)}%</b>:null}</div></div></div><p className="reasonText">{signal.reason_el}</p><div className="proofChips"><span>🇪🇺 {country(signal.offer.warehouse_country)}</span><span>🛡️ {Math.round(signal.offer.merchant?.merchant_score||0)}/100</span></div>{signal.offer.affiliate_url&&<a className="signalCta" href={signal.offer.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Δες την προσφορά <span>→</span></a>}<small className="affiliateNote">Affiliate link · η προμήθεια δεν καθορίζει την κατάταξη.</small></>:
     labSignal?<><div className="miniProduct"><div className="miniImage">{labSignal.image_url?<img src={labSignal.image_url} alt=""/>:"✦"}</div><div><span className="signalReason">{labSignal.pain_title}</span><h3>{labSignal.solution_title}</h3><div className="priceBig">{money(labSignal.price_eur)}</div></div></div><p className="reasonText">Πέρασε relevance, merchant quality και explicit EU warehouse proof. Το ελληνικό gap παραμένει υπό αξιολόγηση.</p><div className="proofChips"><span>🇪🇺 {country(labSignal.warehouse_country)}</span><span>🛡️ {Math.round(labSignal.merchant_score||0)}/100</span></div>{labSignal.affiliate_url&&<a className="signalCta" href={labSignal.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Δες την EU επιλογή <span>→</span></a>}<small className="affiliateNote">LAB ≠ επιβεβαιωμένο ελληνικό gap. Affiliate link.</small></>:
     <div className="nightState"><div className="moon">☾</div><h3>Οι agents ψάχνουν πριν μπεις.</h3><p>Δεν εμφανίζουμε placeholder προϊόντα. Το NightShift χτίζει verified EU candidates και merchant memory.</p><div className="nightStats"><span><b>{status?.counts?.lab??0}</b> LAB</span><span><b>{status?.counts?.core??0}</b> CORE</span><span><b>{status?.counts?.merchants??0}</b> έμποροι</span></div></div>}
   </aside>
  </section>

  <section className="compactProof"><div className="shell compactProofInner"><b>Αποστολή από ΕΕ, όχι “στέλνει προς Ελλάδα”.</b><span>Απαιτούμε explicit ship-from country proof. Έτσι αποφεύγουμε China-shipping εκπλήξεις και μη επαληθευμένες υποσχέσεις.</span><i>🇪🇸 🇵🇱 🇫🇷 🇩🇪 🇮🇹</i></div></section>

  <section className="section shell" id="provlimata"><div className="sectionTitle"><div><small>ΠΡΑΓΜΑΤΙΚΑ ΠΡΟΒΛΗΜΑΤΑ — ΟΧΙ ΚΑΤΗΓΟΡΙΕΣ</small><h2>Τι θέλουν να λύσουν οι Έλληνες;</h2></div><span className="sectionHint">Πάτησε ένα πραγματικό friction. Το AI Search αναλαμβάνει τη μετάφραση σε λύσεις.</span></div><div className="painGrid">{pains.slice(0,6).map(p=><button className="painCard" key={p.id} onClick={()=>choosePain(p)}><span className="painIcon">{ICONS[p.slug]||"✦"}</span><strong>{p.title_el}</strong><span className="painAction">Βρες λύση <i>→</i></span></button>)}</div></section>

  <section className="offersSection" id="eukairies"><div className="section shell"><div className="sectionTitle"><div><small>EU VERIFIED · CORE ΚΑΙ LAB ΞΕΧΩΡΙΣΤΑ</small><h2>Λύσεις που αξίζει να δεις τώρα.</h2></div><span className="sectionHint">CORE έχει περάσει και το ελληνικό gap. LAB έχει ήδη περάσει relevance, merchant και EU proof.</span></div>
   {featured.length?<div className="offerGrid">{featured.map(x=><article className="offerCard" key={`${x.solution_id}-${x.warehouse_country}`}><div className="offerImage">{x.image_url?<img src={x.image_url} alt=""/>:"✦"}{x.discount_pct&&x.discount_pct>=5?<b className="discountBadge">-{Math.round(x.discount_pct)}%</b>:null}</div><div className="offerBody"><span className={`stageTag ${isLab(x)?"lab":"core"}`}>{isLab(x)?"◌ LAB · gap σε έλεγχο":"✓ CORE"}</span><span className="offerPain">{x.pain_title}</span><h3>{x.solution_title}</h3><div className="offerMeta"><span>🇪🇺 {country(x.warehouse_country)}</span><span>🛡️ {x.merchant_score?Math.round(x.merchant_score):"—"}/100</span>{x.express&&<span>⚡ Express</span>}</div><div className="offerFoot"><div>{x.old_price_eur&&x.price_eur&&x.old_price_eur>x.price_eur?<del>{money(x.old_price_eur)}</del>:null}<strong>{money(x.price_eur)}</strong></div>{x.affiliate_url?<a href={x.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">{isLab(x)?"Δες EU επιλογή":"Προσφορά"} →</a>:<span>Υπό έλεγχο</span>}</div><small className="affiliateNote">Affiliate link · ranking independent from commission.</small></div></article>)}</div>:<div className="honestEmpty"><span>🔎</span><div><strong>Δεν υπάρχει ακόμη EU survivor για εμφάνιση.</strong><p>Δεν γεμίζουμε τη λίστα με filler.</p></div></div>}
  </div></section>

  <section className="decisionStrip shell"><div><small>Η ΔΟΥΛΕΙΑ ΓΙΝΕΤΑΙ ΤΗ ΝΥΧΤΑ</small><h2>Χιλιάδες listings μέσα. Λίγες αποφάσεις έξω.</h2></div><div className="decisionSteps"><span><b>1</b> Ελληνικό pain</span><span><b>2</b> EU proof</span><span><b>3</b> Merchant + quality</span><span><b>4</b> Greek gap</span></div></section>
  <section className="b2bStrip shell"><div><span className="b2bTag">ΓΙΑ ΕΛΛΗΝΕΣ ΕΜΠΟΡΟΥΣ</span><h2>Το ίδιο sourcing intelligence, με εμπορικό φακό.</h2><p>LAB προϊόντα, EU-stock offers, top merchants και opportunities πριν γίνουν commodity στην Ελλάδα.</p></div><a href="/emporoi">Άνοιξε το B2B Radar <span>→</span></a></section>
  <footer><div className="shell footerInner"><div className="brand"><span className="brandMark">Λ</span><span>Λύσεις <b>ΕΕ</b></span></div><p>EU Solution Foundry · agentic sourcing για την ελληνική αγορά</p><a href="/admin">Κατάσταση συστήματος</a></div></footer>
 </main>;
}
