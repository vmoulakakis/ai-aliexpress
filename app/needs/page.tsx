import Link from "next/link";
import { DEMAND_CASES } from "@/lib/demand";

export const metadata = { title: "Ανάγκες & Pain Gaps" };

export default function NeedsPage() {
  const items = [...DEMAND_CASES].sort((a,b) => b.homePriority - a.homePriority);
  return (
    <main className="catalog-page">
      <header className="catalog-header"><Link href="/" className="catalog-brand">◒ <b>ΒρεςΜου</b></Link><Link href="/premium">Premium 100€+ →</Link></header>
      <section className="catalog-hero"><p className="eyebrow">DEMAND LIBRARY</p><h1>Ανάγκες πριν από προϊόντα.</h1><p>Κάθε pain case είναι semantic entry point: context → solution paths → live AI έρευνα από EU-first προϊόντα.</p></section>
      <section className="catalog-grid">
        {items.map((item) => <Link href={`/needs/${item.slug}`} className="catalog-card" key={item.slug}><span>{item.icon}</span><small>{item.signalLabel}</small><h2>{item.title}</h2><p>{item.subtitle}</p><b>Δες τις λύσεις →</b></Link>)}
      </section>
    </main>
  );
}
