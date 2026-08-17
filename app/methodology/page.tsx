import Link from "next/link";

export const metadata = { title: "Πώς δουλεύει" };

const steps = [
  ["01","Demand & pain signals","Χαρτογραφούμε ανάγκες, search intent και gaps. Τα labels demand εμφανίζονται μόνο όταν υπάρχει τεκμηριωμένο signal."],
  ["02","Semantic intent","Ελληνικά, Greeklish, typos και context μετατρέπονται σε buying intent — όχι απλό keyword."],
  ["03","RAG solution mapping","Το intent αντιστοιχίζεται σε pain cases, solution strategies, product families και exclusions."],
  ["04","Live commerce retrieval","Η αναζήτηση περνά στο AliExpress backend και εφαρμόζει constraints για Ελλάδα / EU fulfilment."],
  ["05","AI validation","Wrong-product identity, budget breaches και unsupported claims απορρίπτονται πριν παρουσιαστούν."],
  ["06","Transparent ranking","Εξηγούμε γιατί εμφανίζεται ένα προϊόν, ποια στοιχεία είναι γνωστά και ποια παραμένουν άγνωστα."]
];

export default function MethodologyPage() {
  return (
    <main className="catalog-page">
      <header className="catalog-header"><Link href="/" className="catalog-brand"><span className="brand-mark">AI</span> <b>AIgora</b></Link><Link href="/needs">Δες ανάγκες →</Link></header>
      <section className="catalog-hero"><p className="eyebrow">TRUST BY DESIGN</p><h1>Πώς δουλεύει το AIgora.</h1><p>Η προμήθεια affiliate δεν αποτελεί κριτήριο semantic relevance. Πρώτα έρχεται η σωστή αντιστοίχιση και μετά το εμπορικό link.</p></section>
      <section className="methodology-list">{steps.map(([number,title,text]) => <article key={number}><b>{number}</b><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    </main>
  );
}
