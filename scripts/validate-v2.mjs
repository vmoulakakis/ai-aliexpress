import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const htmlPath = path.join(root, 'index.html');
const evalPath = path.join(root, 'evals', 'shopping-regressions.json');
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];
const checks = [];

function check(name, ok, detail='') {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(`${name}${detail ? `: ${detail}` : ''}`);
}

check('doctype', /^<!doctype html>/i.test(html));
check('Greek language', /<html\s+lang="el"/i.test(html));
check('viewport', /name="viewport"/i.test(html));
check('interpreted-intent panel', html.includes('id="intentPanel"'));
check('qualitative match labels', html.includes('Πολύ καλή αντιστοίχιση') && !html.includes('% match'));
check('compare flow', html.includes('id="compareDialog"') && html.includes('id="compareBtn"'));
check('saved shortlist', html.includes('id="savedDialog"') && html.includes('nhma_saved_v2'));
check('new chat control', html.includes('id="newChat"'));
check('affiliate disclosure', html.includes('Ορισμένοι σύνδεσμοι είναι συνεργαζόμενοι'));
check('affiliate rel attribute', html.includes("sponsored noopener noreferrer"));
check('no mock product fixtures', !/mock\s*product|demo\s*product|fake\s*product/i.test(html));
check('search/chat endpoints separate', html.includes("apiFetch('nhma-search'") && html.includes("apiFetch('nhma-chat'"));
check('camera input', /accept="image\/\*"[^>]*capture="environment"/i.test(html));
check('dialogs use native dialog', html.includes('<dialog id="compareDialog"') && html.includes('<dialog id="savedDialog"'));

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
check('no duplicate DOM ids', dupes.length === 0, dupes.length ? [...new Set(dupes)].join(', ') : '');

const scriptMatches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
check('inline application script found', scriptMatches.length >= 1, `found ${scriptMatches.length}`);
if (scriptMatches.length) {
  const js = scriptMatches.map(m => m[1]).join('\n');
  const temp = path.join(os.tmpdir(), `nhma-v2-${process.pid}.js`);
  fs.writeFileSync(temp, js);
  const result = spawnSync(process.execPath, ['--check', temp], { encoding: 'utf8' });
  fs.unlinkSync(temp);
  check('JavaScript syntax', result.status === 0, (result.stderr || result.stdout || '').trim());
}

let evals = [];
try {
  evals = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
  check('eval JSON parses', Array.isArray(evals));
} catch (error) {
  check('eval JSON parses', false, String(error));
}
if (Array.isArray(evals)) {
  check('minimum regression coverage', evals.length >= 12, `${evals.length} cases`);
  const uniqueIds = new Set(evals.map(x => x?.id).filter(Boolean));
  check('unique eval ids', uniqueIds.size === evals.length, `${uniqueIds.size}/${evals.length}`);
  check('multi-turn coverage', evals.some(x => Array.isArray(x.turns) && x.turns.length > 1));
  check('zero-result safety coverage', evals.some(x => x?.expect?.zeroResultsAllowed === true));
  check('hard budget coverage', evals.some(x => Number.isFinite(Number(x?.expect?.maxProductPrice))));
  check('photo fallback coverage', evals.some(x => x?.id === 'photo-fallback'));
}

for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
if (failures.length) {
  console.error(`\n${failures.length} validation failure(s).`);
  process.exit(1);
}
console.log(`\nAll ${checks.length} NHMA v2 static release checks passed.`);
