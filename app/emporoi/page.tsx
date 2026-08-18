"use client";

import { useEffect, useState } from "react";

type Opportunity = {
  id: string;
  pain_title: string;
  solution_title: string;
  demand_score: number | null;
  local_gap_score: number | null;
  merchant_score: number | null;
  margin_pct: number | null;
  warehouse_country: string | null;
  delivery_days: number | null;
  price_eur: number | null;
  affiliate_url: string | null;
};

export default function MerchantsPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/search?b2b=1").then((r) => r.json()).then((d) => setItems(d.items ?? [])).catch(() => undefined);
  }, []);

  const visible = items.filter((x) => !q || `${x.pain_title} ${x.solution_title}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="/">Λύσεις <span>ΕΕ</span></a>
        <nav><a href="/">Για καταναλωτές</a><a href="#radar">Ευκαιρίες</a></nav>
        <div className="euBadge">B2B · Ελλάδα</div>
      </header>

      <section className="merchantHero shell">
        <div>
          <div className="eyebrow">AI SOURCING ΓΙΑ ΕΛΛΗΝΕΣ ΕΜΠΟΡΟΥΣ</div>
          <h1>Βρες τι αξίζει<br/><span>να πουλήσεις.</span></h1>
          <p>Το NightShift εντοπίζει λύσεις με ελληνική ζήτηση, πραγματικό κενό αγοράς, EU stock και δυνατούς merchants — πριν γίνουν commodity.</p>
          <div className="merchantSearch"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="π.χ. λύσεις για παλιά αυτοκίνητα, κατοικίδια, μικρούς χώρους"/><button>AI Radar</button></div>
        </div>
        <div className="b2bPanel">
          <small>ΤΙ ΒΑΘΜΟΛΟΓΟΥΜΕ</small>
          <div className="scoreRows"><span>Ζήτηση στην Ελλάδα</span><b>Demand Score</b><span>Έλλειψη αντίστοιχης λύσης</span><b>Gap Score</b><span>Ποιότητα εμπόρου</span><b>Merchant Score</b><span>Εμπορική ευκαιρία</span><b>Margin Signal</b></div>
        </div>
      </section>

      <section className="shell b2bTableWrap" id="radar">
        <div className="sectionTitle"><div><small>OPPORTUNITY RADAR</small><h2>Ευκαιρίες που περνούν τα gates μας</h2></div></div>
        {!visible.length ? <div className="b2bEmpty">Το NightShift δεν έχει δημοσιεύσει ακόμη ελεγμένες B2B ευκαιρίες. Δεν εμφανίζουμε placeholder ή μη επαληθευμένα προϊόντα.</div> :
          <div className="b2bGrid">{visible.map((x) => <article className="oppCard" key={x.id}>
            <div className="oppTop"><span>🔥 Ευκαιρία</span><span>🇪🇺 {x.warehouse_country ?? "ΕΕ"}</span></div>
            <h3>{x.solution_title}</h3><p>{x.pain_title}</p>
            <div className="metrics"><div><small>Ζήτηση</small><b>{x.demand_score ? Math.round(x.demand_score) : "—"}</b></div><div><small>Gap</small><b>{x.local_gap_score ? Math.round(x.local_gap_score) : "—"}</b></div><div><small>Merchant</small><b>{x.merchant_score ? Math.round(x.merchant_score) : "—"}</b></div><div><small>Margin</small><b>{x.margin_pct ? `${Math.round(x.margin_pct)}%` : "—"}</b></div></div>
            <div className="oppFoot"><span>{x.price_eur ? `Από €${x.price_eur.toFixed(2)}` : "Τιμή live"}</span><span>{x.delivery_days ? `${x.delivery_days} ημέρες` : "EU delivery"}</span></div>
            {x.affiliate_url ? <a href={x.affiliate_url} target="_blank" rel="sponsored noopener noreferrer">Δες sourcing offer →</a> : null}
          </article>)}</div>}
      </section>
    </main>
  );
}
