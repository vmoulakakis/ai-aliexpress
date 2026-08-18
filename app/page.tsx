"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Card={solution_id:string;pain_title:string;solution_title:string;image_url:string|null;price_eur:number|null;old_price_eur:number|null;discount_pct:number|null;warehouse_country:string|null;delivery_days:number|null;merchant_name:string|null;merchant_score:number|null;survivor_score:number|null;affiliate_url:string|null;express?:boolean;quality_score?:number|null;gap_type?:string|null};
type Pain={id:string;slug:string;title_el:string;keywords?:string[];demand_score?:number|null};
type Notification={id:string;title_el:string;reason_el:string|null;priority:number;solution?:{id:string;title_el:string;pain?:{title_el:string}};offer?:{id:string;price_eur:number|null;old_price_eur:number|null;discount_pct:number|null;warehouse_country:string|null;delivery_days:number|null;affiliate_url:string|null;express?:boolean;product?:{image_url:string|null;quality_score:number|null};merchant?:{name:string|null;merchant_score:number|null}}};
type Status={latest_run:any;counts?:{core:number;lab:number;watch:number;products:number;merchants:number;eu_offers:number};model_usage?:{input:number;output:number;cost:number}};

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
const money=(v:number|null)=>v?new Intl.NumberFormat("el-GR",{style:"currency",currency:"EUR"}).format(v):"Δες τιμή";

export default function HomePage(){
  const inputRef=useRef<HTMLInputElement>(null);
  const [q,setQ]=useState("");const [items,setItems]=useState<Card[]>([]);const [suggestions,setSuggestions]=useState<Pain[]>([]);const [pains,setPains]=useState<Pain[]>(FALLBACK_PAINS);const [featured,setFeatured]=useState<Card[]>([]);const [notifications,setNotifications]=useState<Notification[]>([]);const [status,setStatus]=useState<Status|null>(null);const [loading,setLoading]=useState(false);const [model,setModel]=useState<string|null>(null);
  const query=q.trim(),dropdown=query.length>=2;

  useEffect(()=>{Promise.all([
    fetch("/api/search?mode=pains").then(r=>r.json()).catch(()=>({items:[]})),
    fetch("/api/search?mode=featured&limit=6").then(r=>r.json()).catch(()=>({items:[]})),
    fetch("/api/search?mode=notifications").then(r=>r.json()).catch(()=>({items:[]})),
    fetch("/api/search?mode=status").then(r=>r.json()).catch(()=>null)
  ]).then(([p,f,n,s])=>{if(Array.isArray(p?.items)&&p.items.length)setPains(p.items);setFeatured(Array.isArray(f?.items)?f.items:[]);setNotifications(Array.isArray(n?.items)?n.items:[]);setStatus(s);});},[]);

  useEffect(()=>{let active=true;const t=setTimeout(async()=>{if(query.length<2){setItems([]);setSuggestions([]);return;}setLoading(true);try{const r=await fetch(`/api/search?q=${encodeURIComponent(query)}`);const d=await r.json();if(active){setItems(Array.isArray(d.items)?d.items:[]);setSuggestions(Array.isArray(d.pains)?d.pains:[]);setModel(d.model||null);}}finally{if(active)setLoading(false);}},240);return()=>{active=false;clearTimeout(t);};},[query]);

  const signal=notifications[0];
  const dropdownText=useMemo(()=>loading?"Το AI ελέγχει τις ήδη επιβεβαιωμένες λύσεις…":items.length?`${items.length} λύσεις που έχουν περάσει τα gates μας`:suggestions.length?"Δεν έχουμε ακόμη CORE προϊόν — βρήκα όμως σχετικά προβλήματα που παρακολουθεί το NightShift.":"Δεν υπάρχει ακόμη αρκετά αξιόπιστη λύση για δημοσίευση.",[loading,items.length,suggestions.length]);
  function choosePain(p:Pain){setQ(p.title_el);setTimeout(()=>inputRef.current?.focus(),0);window.scrollTo({top:110,behavior:"smooth"});}
  function submit(e:FormEvent){e.preventDefault();if(items[0]?.affiliate_url)window.open(items[0].affiliate_url,"_blank","noopener,noreferrer");else inputRef.current?.focus();}

  return <main>
    <header className="topbar"><div className="shell nav">
      <a className="brand" href="/"><span className="brandMark">Λ</span><span>Λύσεις <b>ΕΕ</b></span></a>
      <nav><a href="#provlimata">Προβλήματα</a><a href="#eukairies">Προσφορές</a><a href="/emporoi">Για εμπόρους</a></nav>
      <div className="euBadge"><span>🇪🇺</span> Μόνο επαληθευμένες αποθήκες ΕΕ</div>
    </div></header>

    <section className="hero shell">
      <div className="heroCopy">
        <div className="eyebrow"><span className="dot"/> AI SOURCING ΓΙΑ ΤΗΝ ΕΛΛΗΝΙΚΗ ΑΓΟΡΑ</div>
        <h1>Τι θέλεις να <span>λύσεις;</span></h1>
        <p className="heroLead">Περιέγραψε το πρόβλημα ή γράψε το προϊόν. Ψάχνουμε μόνο λύσεις από αποθήκες ΕΕ, ελέγχουμε τον έμπορο και δεν δημοσιεύουμε ό,τι έχει ήδη γίνει εύκολα commodity στην Ελλάδα.</p>
        <form className="searchBox" onSubmit={submit}>
          <div className="searchRow"><span className="searchIcon">⌕</span><input id="smart-search" ref={inputRef} value={q} onChange={e=>setQ(e.target.value)} autoComplete="off" placeholder="π.χ. Θέλω CarPlay στο Yaris 2012 χωρίς αλλαγή radio, μέχρι 100€" aria-label="Έξυπνη αναζήτηση προϊόντων και προβλημάτων"/><button type="submit">Βρες λύση</button></div>
          {dropdown&&<div className="dropdown">
            <div className="dropdownStatus"><span>{loading?"◌":"✦"}</span>{dropdownText}{model&&<em> · AI ενεργό</em>}</div>
            {items.slice(0,6).map(x=><a className="dropItem" key={`${x.solution_id}-${x.warehouse_country}`} href={x.affiliate_url||"#"} target={x.affiliate_url?"_blank":undefined} rel="sponsored noopener noreferrer">
              <div className="dropThumb">{x.image_url?<img src={x.image_url} alt=""/>:<span>✦</span>}</div>
              <div className="dropText"><strong>{x.solution_title}</strong><small><span>🇪🇺 {country(x.warehouse_country)}</span>{x.express&&<span>⚡ Express</span>}<span>🛡️ Έμπορος {x.merchant_score?Math.round(x.merchant_score):"—"}/100</span></small><p>{x.pain_title}</p></div>
              <div className="dropMoney">{x.discount_pct&&x.discount_pct>=5?<b>-{Math.round(x.discount_pct)}%</b>:null}<strong>{money(x.price_eur)}</strong></div>
            </a>)}
            {!items.length&&suggestions.map(p=><button className="painSuggestion" key={p.id} type="button" onClick={()=>choosePain(p)}><span>{ICONS[p.slug]||"✦"}</span><div><strong>{p.title_el}</strong><small>Το NightShift το παρακολουθεί · χωρίς μη επαληθευμένη affiliate πρόταση</small></div><i>→</i></button>)}
          </div>}
        </form>
        <div className="trustRail"><span>✓ Απόδειξη EU warehouse</span><span>✓ Ελληνικό gap check</span><span>✓ Ranking εμπόρου</span><span>✓ Η προμήθεια δεν ανεβάζει προϊόν</span></div>
      </div>

      <aside className="signalPanel">
        <div className="signalHead"><div><small>ΕΞΥΠΝΟ ΣΗΜΑ</small><strong>{signal?"Αξίζει να το δεις τώρα":"Το NightShift δουλεύει"}</strong></div><span className={signal?"liveDot":"nightDot"}>{signal?"● LIVE":"☾ ΝΥΧΤΑ"}</span></div>
        {signal&&signal.offer?<>
          <div className="miniProduct"><div className="miniImage">{signal.offer.product?.image_url?<img src={signal.offer.product.image_url} alt=""/>:"✦"}</div><div><span className="signalReason">{signal.title_el}</span><h3>{signal.solution?.title_el}</h3><div className="priceBig">{money(signal.offer.price_eur)} {signal.offer.discount_pct&&signal.offer.discount_pct>=5?<b>-{Math.round(signal.offer.discount_pct)}%</b>:null}</div></div></div>
          <p className="reasonText">{signal.reason_el}</p>
          <div className="proofChips"><span>🇪🇺 {country(signal.offer.warehouse_country)}</span>{signal.offer.express&&<span>⚡ Express</span>}<span>🛡️ {Math.round(signal.offer.merchant?.merchant_score||0)}/100</span></div>
          {signal.offer.affiliate_url&&<a className="signalCta" href={signal.offer.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Δες την προσφορά <span>→</span></a>}
          <small className="affiliateNote">Affiliate σύνδεσμος. Η κατάταξη γίνεται πριν από την εμπορική βελτιστοποίηση.</small>
        </>:<div className="nightState"><div className="moon">☾</div><h3>Δεν θα σου δείξουμε placeholder προϊόν.</h3><p>Οι agents ψάχνουν, επαληθεύουν EU warehouse, πετάνε άσχετες επιλογές και κρατούν τις λύσεις σε LAB μέχρι να περάσουν τον ελληνικό έλεγχο.</p><div className="nightStats"><span><b>{status?.counts?.lab??0}</b> σε έλεγχο</span><span><b>{status?.counts?.core??0}</b> έτοιμες</span><span><b>{status?.counts?.merchants??0}</b> έμποροι</span></div></div>}
      </aside>
    </section>

    <section className="compactProof"><div className="shell compactProofInner"><b>Αποστολή από ΕΕ, όχι “βαφτισμένη” ως ΕΕ.</b><span>Δεν θεωρούμε το “στέλνει προς Ελλάδα” απόδειξη αποθήκης Ευρώπης. Κρατάμε proof χώρας και χρόνο επαλήθευσης.</span><i>🇪🇸 🇵🇱 🇫🇷 🇩🇪 🇮🇹</i></div></section>

    <section className="section shell" id="provlimata">
      <div className="sectionTitle"><div><small>ΑΝΘΡΩΠΙΝΑ ΠΡΟΒΛΗΜΑΤΑ — ΟΧΙ ΚΑΤΗΓΟΡΙΕΣ</small><h2>Τι θέλουν να λύσουν οι Έλληνες;</h2></div><span className="sectionHint">Πάτησε ένα πρόβλημα και το AI Search το αναλαμβάνει.</span></div>
      <div className="painGrid">{pains.slice(0,6).map(p=><button className="painCard" key={p.id} onClick={()=>choosePain(p)}><span className="painIcon">{ICONS[p.slug]||"✦"}</span><strong>{p.title_el}</strong><span className="painAction">Ψάξε τη λύση <i>→</i></span></button>)}</div>
    </section>

    <section className="offersSection" id="eukairies"><div className="section shell">
      <div className="sectionTitle"><div><small>ΕΥΚΑΙΡΙΕΣ ΠΟΥ ΠΕΡΑΣΑΝ ΟΛΑ ΤΑ GATES</small><h2>Μεγάλη έκπτωση μόνο όταν υπάρχει και λόγος να αγοράσεις.</h2></div><span className="sectionHint">Προτεραιότητα: ελληνικό gap + ποιότητα + EU proof.</span></div>
      {featured.length?<div className="offerGrid">{featured.map(x=><article className="offerCard" key={`${x.solution_id}-${x.warehouse_country}`}>
        <div className="offerImage">{x.image_url?<img src={x.image_url} alt=""/>:<span>✦</span>}{x.discount_pct&&x.discount_pct>=5?<b className="discountBadge">-{Math.round(x.discount_pct)}%</b>:null}</div>
        <div className="offerBody"><span className="offerPain">{x.pain_title}</span><h3>{x.solution_title}</h3><div className="offerMeta"><span>🇪🇺 {country(x.warehouse_country)}</span>{x.express&&<span>⚡ Express</span>}<span>🛡️ {x.merchant_score?Math.round(x.merchant_score):"—"}/100</span></div><div className="offerFoot"><div>{x.old_price_eur&&x.old_price_eur>x.price_eur!?<del>{money(x.old_price_eur)}</del>:null}<strong>{money(x.price_eur)}</strong></div>{x.affiliate_url?<a href={x.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Προσφορά →</a>:<span>Υπό έλεγχο</span>}</div></div>
      </article>)}</div>:<div className="honestEmpty"><span>🔎</span><div><strong>Δεν έχουμε ακόμη CORE προσφορές για δημοσίευση.</strong><p>Αυτό είναι σκόπιμο: LAB προϊόν χωρίς ελληνικό gap proof δεν εμφανίζεται ως “ευκαιρία”.</p></div></div>}
    </div></section>

    <section className="decisionStrip shell"><div><small>ΠΩΣ ΑΠΟΦΑΣΙΖΟΥΜΕ</small><h2>Χιλιάδες listings μέσα. Λίγες αποφάσεις έξω.</h2></div><div className="decisionSteps"><span><b>1</b> Πραγματικό πρόβλημα</span><span><b>2</b> EU warehouse proof</span><span><b>3</b> Top merchant + ποιότητα</span><span><b>4</b> Ελληνικό gap</span></div></section>

    <section className="b2bStrip shell"><div><span className="b2bTag">ΓΙΑ ΕΛΛΗΝΕΣ ΕΜΠΟΡΟΥΣ</span><h2>Το ίδιο sourcing intelligence, με εμπορικό φακό.</h2><p>Δες νέα προϊόντα πριν γίνουν commodity, top AliExpress merchants με EU stock και ευκαιρίες που το σύστημα ακόμη αξιολογεί.</p></div><a href="/emporoi">Άνοιξε το B2B Radar <span>→</span></a></section>

    <footer><div className="shell footerInner"><div className="brand"><span className="brandMark">Λ</span><span>Λύσεις <b>ΕΕ</b></span></div><p>AI sourcing για την ελληνική αγορά · EU Solution Foundry</p><a href="/admin">Κατάσταση συστήματος</a></div></footer>
  </main>;
}
