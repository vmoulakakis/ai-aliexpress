import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMAND_CASES, findDemandCase } from "@/lib/demand";

export function generateStaticParams() { return DEMAND_CASES.map((item) => ({ slug: item.slug })); }

export default async function NeedDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = findDemandCase(slug);
  if (!item) notFound();
  return (
    <main className="catalog-page need-detail">
      <header className="catalog-header"><Link href="/" className="catalog-brand">◒ <b>ΒρεςΜου</b></Link><Link href="/needs">← Όλες οι ανάγκες</Link></header>
      <section className="need-hero"><span className="need-icon-large">{item.icon}</span><p className="eyebrow">{item.world.toUpperCase()} · {item.signalLabel}</p><h1>{item.title}</h1><p>{item.subtitle}</p><Link className="primary-link" href={`/?q=${encodeURIComponent(item.searchQuery)}`}>Ξεκίνα AI έρευνα →</Link></section>
      <section className="solution-panel"><div><p className="eyebrow">SEMANTIC SOLUTION PATHS</p><h2>Πώς μπορεί να λυθεί</h2></div><div className="solution-grid">{item.solutionPaths.map((solution) => <Link key={solution} href={`/?q=${encodeURIComponent(`${item.searchQuery} ${solution}`)}`}><b>{solution}</b><span>AI search →</span></Link>)}</div></section>
      <section className="transparency-note"><b>Δεν είναι category page.</b><p>Η επιλογή σου μετατρέπεται σε semantic intent και η τελική λίστα προϊόντων δημιουργείται live. Αν δεν υπάρχει αξιόπιστο EU αποτέλεσμα, δεν γεμίζουμε τη σελίδα με άσχετα προϊόντα.</p></section>
    </main>
  );
}
