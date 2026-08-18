"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Card = {
  solution_id: string;
  pain_title: string;
  solution_title: string;
  image_url: string | null;
  price_eur: number | null;
  old_price_eur: number | null;
  discount_pct: number | null;
  warehouse_country: string | null;
  delivery_days: number | null;
  merchant_name: string | null;
  merchant_score: number | null;
  survivor_score: number | null;
  affiliate_url: string | null;
};

const painIdeas = [
  "Θέλω CarPlay στο παλιό μου αυτοκίνητο χωρίς να αλλάξω radio",
  "Το Wi‑Fi δεν πιάνει καλά στο υπνοδωμάτιο",
  "Ζεσταίνομαι το βράδυ αλλά δεν μπορώ να βάλω A/C",
  "Έχω τρίχες σκύλου παντού στον καναπέ",
  "Πονάει ο αυχένας μου όταν δουλεύω στο laptop",
  "Θέλω να οργανώσω μικρή κουζίνα χωρίς τρύπες"
];

export default function HomePage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Card[]>([]);
  const [featured, setFeatured] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);

  const trimmed = q.trim();
  const showDropdown = trimmed.length >= 2;

  useEffect(() => {
    let live = true;
    const timer = setTimeout(async () => {
      if (trimmed.length < 2) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (live) setItems(Array.isArray(data.items) ? data.items : []);
      } finally {
        if (live) setLoading(false);
      }
    }, 220);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [trimmed]);

  useEffect(() => {
    fetch("/api/search?featured=1")
      .then((r) => r.json())
      .then((d) => setFeatured(d.items?.[0] ?? null))
      .catch(() => undefined);
  }, []);

  const status = useMemo(() => {
    if (!showDropdown) return "Γράψε προϊόν ή περιέγραψε το πρόβλημά σου";
    if (loading) return "Το AI ψάχνει τις ελεγμένες λύσεις…";
    if (!items.length) return "Δεν βρήκα ακόμη ελεγμένη λύση — δοκίμασε να περιγράψεις το πρόβλημα αλλιώς.";
    return `${items.length} ελεγμένες επιλογές`;
  }, [showDropdown, loading, items.length]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (items[0]?.affiliate_url) window.open(items[0].affiliate_url, "_blank", "noopener,noreferrer");
  }

  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="/">Λύσεις <span>ΕΕ</span></a>
        <nav>
          <a href="#problems">Προβλήματα</a>
          <a href="#offers">Ευκαιρίες</a>
          <a href="/emporoi">Για εμπόρους</a>
        </nav>
        <div className="euBadge">🇪🇺 Μόνο αποθήκες ΕΕ</div>
      </header>

      <section className="hero shell">
        <div className="heroCopy">
          <div className="eyebrow">AI SOURCING ΓΙΑ ΤΗΝ ΕΛΛΑΔΑ</div>
          <h1>Πες τι θέλεις να λύσεις.<br/><span>Εμείς βρίσκουμε τι αξίζει.</span></h1>
          <p>Έξυπνη αναζήτηση σε λύσεις από αποθήκες ΕΕ, με έλεγχο ποιότητας, εμπόρου, τιμής και πραγματικού κενού στην ελληνική αγορά.</p>

          <form className="searchBox" onSubmit={submit}>
            <div className="searchRow">
              <span className="searchIcon">⌕</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="π.χ. CarPlay για Yaris 2012 μέχρι 100€ ή το Wi‑Fi δεν πιάνει στο δωμάτιο" aria-label="Έξυπνη αναζήτηση" />
              <button aria-label="Αναζήτηση">→</button>
            </div>
            {showDropdown && (
              <div className="dropdown">
                <div className="dropdownStatus">{status}</div>
                {items.slice(0, 6).map((item) => (
                  <a className="dropItem" key={item.solution_id} href={item.affiliate_url ?? "#"} target={item.affiliate_url ? "_blank" : undefined} rel="sponsored noopener noreferrer">
                    <div className="dropThumb">{item.image_url ? <img src={item.image_url} alt=""/> : "✦"}</div>
                    <div className="dropText">
                      <strong>{item.solution_title}</strong>
                      <small>{item.warehouse_country ? `Αποθήκη ${item.warehouse_country}` : "ΕΕ"} · {item.delivery_days ? `${item.delivery_days} ημέρες` : "ελεγμένη αποστολή"} · {item.merchant_score ? `έμπορος ${Math.round(item.merchant_score)}/100` : "ελεγμένος έμπορος"}</small>
                    </div>
                    <div className="dropPrice">{item.price_eur ? `€${item.price_eur.toFixed(2)}` : "Δες τιμή"}</div>
                  </a>
                ))}
              </div>
            )}
          </form>

          <div className="quickPills">
            <span>Χωρίς τελωνείο από Κίνα</span><span>Express όπου υπάρχει</span><span>Έλεγχος ελληνικής τιμής</span>
          </div>
        </div>

        <aside className="smartCard" id="offers">
          <div className="smartHead"><span>🔥 Έξυπνη ευκαιρία για Ελλάδα</span><span className="live">● LIVE</span></div>
          {featured ? (
            <>
              <div className="featuredProduct">
                <div className="featuredImage">{featured.image_url ? <img src={featured.image_url} alt=""/> : "✦"}</div>
                <div>
                  <h3>{featured.solution_title}</h3>
                  <div className="priceLine"><b>{featured.price_eur ? `€${featured.price_eur.toFixed(2)}` : "Δες τιμή"}</b>{featured.discount_pct ? <em>-{Math.round(featured.discount_pct)}%</em> : null}</div>
                </div>
              </div>
              <ul className="proofList">
                <li>🇪🇺 {featured.warehouse_country ? `Αποθήκη ${featured.warehouse_country}` : "Αποθήκη ΕΕ"}</li>
                <li>🚚 {featured.delivery_days ? `περίπου ${featured.delivery_days} ημέρες` : "γρήγορη αποστολή όπου επιβεβαιώνεται"}</li>
                <li>🛡️ {featured.merchant_score ? `Merchant Score ${Math.round(featured.merchant_score)}/100` : "ελεγμένος merchant"}</li>
              </ul>
              <a className="primaryCta" href={featured.affiliate_url ?? "#"} target="_blank" rel="sponsored noopener noreferrer">Δες την προσφορά →</a>
              <small className="affiliateNote">Σύνδεσμος συνεργάτη · η κατάταξη δεν βασίζεται στην προμήθεια.</small>
            </>
          ) : (
            <div className="emptyFeatured"><strong>Το NightShift ετοιμάζει τις ευκαιρίες.</strong><span>Εδώ θα εμφανίζεται μόνο προϊόν που περνά EU, ποιότητα, merchant και ελληνικό gap gate.</span></div>
          )}
        </aside>
      </section>

      <section className="painSection shell" id="problems">
        <div className="sectionTitle"><div><small>ΠΡΑΓΜΑΤΙΚΕΣ ΑΝΑΓΚΕΣ</small><h2>Προβλήματα που ψάχνουν λύση στην Ελλάδα</h2></div><a href="#">Δες όλες τις λύσεις →</a></div>
        <div className="painGrid">
          {painIdeas.map((pain, i) => (
            <button className="painCard" key={pain} onClick={() => setQ(pain)}>
              <div className="painVisual">{["🚗","📶","🌡️","🐕","💻","🏠"][i]}</div>
              <strong>{pain}</strong>
              <span>Βρες ελεγμένες λύσεις →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="b2bStrip shell">
        <div><small>ΓΙΑ ΕΛΛΗΝΕΣ ΕΜΠΟΡΟΥΣ</small><h2>Βρες τι αξίζει να πουλήσεις πριν γίνει commodity.</h2><p>AI sourcing, top merchants, περιθώριο, ζήτηση Ελλάδας και EU-stock προϊόντα σε ένα απλό opportunity feed.</p></div>
        <a href="/emporoi">Άνοιξε το B2B Radar →</a>
      </section>
    </main>
  );
}
