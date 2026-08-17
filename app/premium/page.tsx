import Link from "next/link";
import { DEMAND_CASES } from "@/lib/demand";

export const metadata = { title: "Premium λύσεις 100€+" };

export default function PremiumPage() {
  const items = DEMAND_CASES.filter((item) => item.premium).sort((a,b) => b.homePriority - a.homePriority);
  return (
    <main className="catalog-page">
      <header className="catalog-header"><Link href="/" className="catalog-brand"><span className="brand-mark">AI</span> <b>AIgora</b></Link><Link href="/needs">Ανάγκες →</Link></header>
      <section className="catalog-hero premium-hero"><p className="eyebrow">HIGH-VALUE BUYING DECISIONS</p><h1>Premium 100€+ — εκεί που η λάθος αγορά κοστίζει.</h1><p>Δεν προβάλλουμε προϊόντα επειδή είναι ακριβά. Προβάλλουμε pain cases όπου χρειάζεται περισσότερη έρευνα, evidence και σύγκριση.</p></section>
      <section className="catalog-grid">
        {items.map((item) => <Link href={`/?q=${encodeURIComponent(`${item.searchQuery} minimum 100 euro`)}`} className="catalog-card premium-catalog-card" key={item.slug}><span>{item.icon}</span><small>Premium AI research</small><h2>{item.title}</h2><p>{item.subtitle}</p><b>Βρες premium επιλογές →</b></Link>)}
      </section>
    </main>
  );
}
