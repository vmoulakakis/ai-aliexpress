"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

type BriefProduct = {
  productId?: string;
  title?: string;
  imageUrl?: string;
  price?: number | null;
  currency?: string;
  matchScore?: number | null;
  why?: string;
  warehouseCountry?: string;
  warehouseProofUrl?: string;
  trackingPath?: string;
  decision?: { role?: string; strengths?: string[]; limitations?: string[]; verifiedFields?: string[]; unknownFields?: string[] } | null;
};

type Research = { token: string; query: string; understood: string; demand_slug?: string; products: BriefProduct[]; created_at: string; expires_at: string };

function price(value?: number | null, currency = "EUR") {
  if (!Number.isFinite(Number(value))) return "Τρέχουσα τιμή στο AliExpress";
  return new Intl.NumberFormat("el-GR", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}

function roleLabel(role?: string, index = 0) {
  if (role === "best_match" || index === 0) return "AI Top Match";
  if (role === "best_value" || index === 1) return "Best Value";
  return `Επιλογή #${index + 1}`;
}

export function V4BriefClient({ research }: { research: Research }) {
  const [qr, setQr] = useState<Record<string, string>>({});
  const products = useMemo(() => Array.isArray(research.products) ? research.products.slice(0, 8) : [], [research.products]);

  useEffect(() => {
    void fetch("/api/engagement", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "event", eventName: "brief_open", researchToken: research.token, demandSlug: research.demand_slug, source: "brief" }) });
    let active = true;
    Promise.all(products.map(async (product) => {
      if (!product.trackingPath) return null;
      const absolute = new URL(product.trackingPath, window.location.origin).href;
      const data = await QRCode.toDataURL(absolute, { margin: 1, width: 190, errorCorrectionLevel: "M" });
      return [product.productId || product.trackingPath, data] as const;
    })).then((entries) => {
      if (!active) return;
      const next: Record<string, string> = {};
      for (const entry of entries) if (entry) next[entry[0]] = entry[1];
      setQr(next);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [products, research.demand_slug, research.token]);

  async function share() {
    const data = { title: "Η AI έρευνα αγορών μου · ΒρεςΜου", text: research.understood, url: window.location.href };
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard?.writeText(window.location.href);
    window.alert("Ο σύνδεσμος της έρευνας αντιγράφηκε.");
  }

  return (
    <main className="brief-page">
      <header className="brief-topbar no-print">
        <a href="/" className="catalog-brand">◒ <b>ΒρεςΜου</b></a>
        <div><button onClick={() => void share()}>Μοιράσου ↗</button><button className="brief-primary" onClick={() => window.print()}>Αποθήκευση ως PDF ↓</button></div>
      </header>
      <section className="brief-cover">
        <p className="eyebrow">PERSONAL AI BUYING BRIEF</p>
        <h1>Η έρευνά σου, χωρίς τον θόρυβο.</h1>
        <p className="brief-understood">{research.understood || research.query}</p>
        <div className="brief-meta"><span>🇪🇺 EU warehouse verified</span><span>✦ Semantic AI selection</span><span>◎ Affiliate disclosure</span></div>
      </section>
      <section className="brief-explainer">
        <div><b>Τι ζητήθηκε</b><p>{research.query}</p></div>
        <div><b>Πώς διαβάζεις τον οδηγό</b><p>Κάθε επιλογή έχει μόνο επαληθευμένο EU warehouse proof και δικό μας tracking QR προς το official AliExpress affiliate URL.</p></div>
      </section>
      <section className="brief-products">
        {products.map((product, index) => {
          const key = product.productId || product.trackingPath || String(index);
          const image = qr[key];
          return <article className="brief-product" key={key}>
            <div className="brief-product-media">
              {product.imageUrl ? <img src={product.imageUrl} alt={product.title || "Προϊόν"} /> : <span className="brief-placeholder">◫</span>}
              <span className="brief-badge">{roleLabel(product.decision?.role, index)}</span>
            </div>
            <div className="brief-product-copy">
              <h2>{product.title || "Επιλεγμένο προϊόν"}</h2>
              <p className="brief-price">{price(product.price, product.currency)}</p>
              <div className="brief-score"><span>AI Match</span><b>{product.matchScore != null ? `${product.matchScore}/100` : "Validated"}</b></div>
              {product.why && <p className="brief-why">{product.why}</p>}
              {!!product.decision?.strengths?.length && <div className="brief-list good"><b>Γιατί ξεχώρισε</b>{product.decision.strengths.map((item) => <span key={item}>✓ {item}</span>)}</div>}
              {!!product.decision?.limitations?.length && <div className="brief-list caution"><b>Τι να προσέξεις</b>{product.decision.limitations.map((item) => <span key={item}>⚠ {item}</span>)}</div>}
              <p className="brief-proof">EU warehouse: <b>{product.warehouseCountry || "verified"}</b> · <a href={product.warehouseProofUrl} target="_blank" rel="noopener noreferrer">proof</a></p>
              {product.trackingPath && <div className="brief-buy-row">
                <a href={`${product.trackingPath}?source=brief`} target="_blank" rel="sponsored noopener noreferrer">Δες την τρέχουσα προσφορά →</a>
                {image ? <img className="brief-qr" src={image} alt="QR προς την προσφορά" /> : <div className="brief-qr-loading">QR</div>}
              </div>}
            </div>
          </article>;
        })}
      </section>
      <section className="brief-disclosure">
        <h2>Διαφάνεια πριν από την αγορά</h2>
        <p>Οι τιμές, το stock και οι χρόνοι παράδοσης μπορούν να αλλάξουν μετά τη δημιουργία αυτής της έρευνας. Οι σύνδεσμοι αγοράς είναι affiliate links και μπορεί να λάβουμε προμήθεια χωρίς επιπλέον κόστος για εσένα. Το ranking δεν βασίζεται στην προμήθεια.</p>
      </section>
      <footer className="brief-footer"><b>ΒρεςΜου</b><span>AI αγορές με νόημα · {new Date(research.created_at).toLocaleDateString("el-GR")}</span></footer>
    </main>
  );
}
