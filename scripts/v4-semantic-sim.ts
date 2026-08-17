import { DEMAND_CASES, resolveDemandCase } from "../lib/demand";

let seed = 4172026;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const prefixes = ["", "θέλω ", "χρειάζομαι ", "βρες μου ", "ψάχνω ", "θελω κατι για ", "AI βρες "];
const suffixes = ["", " μέχρι 200 ευρώ", " για Ελλάδα", " με καλή ποιότητα", " από EU αποθήκη", " premium", " γρήγορα", " χωρίς άσχετα προϊόντα"];
const noise = ["", " !!!", " τώρα", " παρακαλώ", " 2026", " για το σπίτι"];

let total = 0;
let exact = 0;
const misses: string[] = [];
const perCase = new Map<string, { total: number; exact: number }>();

function record(expected: string, input: string) {
  total += 1;
  const got = resolveDemandCase(input)?.item.slug ?? null;
  const state = perCase.get(expected) || { total: 0, exact: 0 };
  state.total += 1;
  if (got === expected) { exact += 1; state.exact += 1; }
  else if (misses.length < 25) misses.push(`${expected} <= ${JSON.stringify(input)} => ${got}`);
  perCase.set(expected, state);
}

for (const item of DEMAND_CASES) {
  for (let i = 0; i < 80; i++) {
    const alias = item.aliases[i % item.aliases.length];
    const prefix = prefixes[Math.floor(rnd() * prefixes.length)];
    const suffix = suffixes[Math.floor(rnd() * suffixes.length)];
    const extra = noise[Math.floor(rnd() * noise.length)];
    const variant = `${prefix}${alias}${suffix}${extra}`.replace(/\s+/g, " ").trim();
    record(item.slug, variant);
  }
}

for (let i = 0; i < 40; i++) {
  const item = DEMAND_CASES[i % DEMAND_CASES.length];
  const path = item.solutionPaths[i % item.solutionPaths.length];
  record(item.slug, `${item.title} — ${path} ${i % 2 ? "μέχρι 350 ευρώ" : "EU only"}`);
}

if (total !== 1000) throw new Error(`Expected 1000 simulations, got ${total}`);
const accuracy = exact / total;
console.log(`Semantic user simulations: ${exact}/${total} exact (${(accuracy * 100).toFixed(2)}%)`);
for (const [slug, state] of perCase) console.log(`${slug}: ${state.exact}/${state.total}`);
if (misses.length) console.log("Sample misses:\n" + misses.map((x) => `- ${x}`).join("\n"));
if (accuracy < 0.97) {
  console.error(`Accuracy gate failed: ${(accuracy * 100).toFixed(2)}% < 97%`);
  process.exit(1);
}
console.log("1000-user semantic simulation gate passed.");
