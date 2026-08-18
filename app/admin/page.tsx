"use client";

import { useEffect, useState } from "react";

type Status={latest_run:any;counts?:{core:number;lab:number;watch:number;products:number;merchants:number;eu_offers:number};model_usage?:{input:number;output:number;cost:number}};

export default function AdminPage(){
  const [status,setStatus]=useState<Status|null>(null);const [merchants,setMerchants]=useState<any[]>([]);const [loading,setLoading]=useState(true);
  async function load(){setLoading(true);try{const [s,m]=await Promise.all([fetch("/api/search?mode=status",{cache:"no-store"}).then(r=>r.json()),fetch("/api/search?mode=merchants").then(r=>r.json())]);setStatus(s);setMerchants(Array.isArray(m.items)?m.items:[]);}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  const stats=status?.latest_run?.stats||{};
  return <main className="adminPage">
    <header className="topbar"><div className="shell nav"><a className="brand" href="/"><span className="brandMark">Λ</span><span>Λύσεις <b>ΕΕ</b></span></a><nav><a href="/">Καταναλωτές</a><a href="/emporoi">B2B</a></nav><div className="euBadge">Foundry Control</div></div></header>
    <section className="shell adminHero"><div><div className="eyebrow"><span className="dot"/> ΚΑΤΑΣΤΑΣΗ ΣΥΣΤΗΜΑΤΟΣ</div><h1>Το εργοστάσιο <span>πίσω από το απλό UI.</span></h1><p>Μόνο συγκεντρωτικά στοιχεία — χωρίς secrets, raw credentials ή εσωτερικά prompts.</p></div><button className="refreshBtn" onClick={load} disabled={loading}>{loading?"Ανανέωση…":"↻ Ανανέωση"}</button></section>

    <section className="shell adminStats">
      <div><small>CORE</small><b>{status?.counts?.core??0}</b><span>δημοσιεύσιμες λύσεις</span></div><div><small>LAB</small><b>{status?.counts?.lab??0}</b><span>σε ελληνικό gap check</span></div><div><small>ΠΡΟΪΟΝΤΑ</small><b>{status?.counts?.products??0}</b><span>canonical records</span></div><div><small>ΕΜΠΟΡΟΙ</small><b>{status?.counts?.merchants??0}</b><span>merchant graph</span></div><div><small>EU OFFERS</small><b>{status?.counts?.eu_offers??0}</b><span>με stored evidence</span></div><div><small>AI COST</small><b>${(status?.model_usage?.cost??0).toFixed(4)}</b><span>τελευταία usage rows</span></div>
    </section>

    <section className="shell adminGrid">
      <article className="adminPanel"><div className="panelHead"><div><small>ΤΕΛΕΥΤΑΙΟ NIGHTSHIFT</small><h2>{status?.latest_run?.status||"Δεν έχει τρέξει"}</h2></div>{status?.latest_run?.created_at&&<span>{new Date(status.latest_run.created_at).toLocaleString("el-GR")}</span>}</div><div className="pipelineRows"><div><span>Sourcing queries</span><b>{stats.queries??"—"}</b></div><div><span>Discovered candidates</span><b>{stats.discovered??"—"}</b></div><div><span>EU verified</span><b>{stats.eu_verify?.verified_candidates??"—"}</b></div><div><span>Enriched</span><b>{stats.enrich?.enriched??"—"}</b></div><div><span>Quality pass</span><b>{stats.curate?.accepted??"—"}</b></div><div><span>Rejected</span><b>{stats.curate?.rejected??"—"}</b></div></div></article>
      <article className="adminPanel"><div className="panelHead"><div><small>MODEL ROUTER</small><h2>Κόστος πρώτα</h2></div></div><div className="modelStack"><div><b>0</b><span><strong>SQL / Rules / Cache</strong><small>Χωρίς LLM</small></span></div><div><b>1</b><span><strong>Qwen μέσω free tier</strong><small>Intent / extraction όταν υπάρχει GROQ key</small></span></div><div><b>2</b><span><strong>DeepSeek V4 Flash</strong><small>Thinking OFF</small></span></div><div><b>3</b><span><strong>DeepSeek V4 Pro</strong><small>Thinking ON μόνο στα δύσκολα</small></span></div></div><div className="tokenLine"><span>Input tokens</span><b>{status?.model_usage?.input??0}</b><span>Output tokens</span><b>{status?.model_usage?.output??0}</b></div></article>
    </section>

    <section className="shell adminPanel fullPanel"><div className="panelHead"><div><small>TOP MERCHANTS</small><h2>Supplier intelligence</h2></div><span>Δεν είναι απλό AliExpress rating</span></div>{merchants.length?<div className="merchantTable compact"><div className="merchantRow merchantHeader"><span>Έμπορος</span><span>Score</span><span>EU reliability</span><span>Survival</span><span>Τελευταίο σήμα</span></div>{merchants.slice(0,10).map((m,i)=><div className="merchantRow" key={m.id}><span><b>#{i+1}</b><strong>{m.name}</strong></span><span className="scorePill">{m.merchant_score?Math.round(m.merchant_score):"—"}</span><span>{m.eu_stock_reliability!=null?`${Math.round(m.eu_stock_reliability)}%`:"—"}</span><span>{m.product_survival_rate!=null?`${Math.round(m.product_survival_rate)}%`:"—"}</span><span>{m.last_seen_at?new Date(m.last_seen_at).toLocaleString("el-GR"):"—"}</span></div>)}</div>:<div className="adminEmpty">Το Merchant Graph θα εμφανιστεί όταν περάσουν πραγματικές offers από το pipeline.</div>}</section>

    <section className="shell systemRules"><small>ΜΗ ΔΙΑΠΡΑΓΜΑΤΕΥΣΙΜΟΙ ΚΑΝΟΝΕΣ</small><div><span>EU warehouse claim μόνο με proof.</span><span>Άσχετο προϊόν κόβεται πριν το merchant score.</span><span>LAB δεν εμφανίζεται ως consumer affiliate offer.</span><span>Commission μόνο μετά το Survivor Gate.</span><span>OpenAI: 0 by design.</span></div></section>
  </main>;
}
