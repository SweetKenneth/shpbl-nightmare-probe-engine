import assert from "node:assert/strict";
import { compileProbe, evaluateProbe, generateNightmares } from "../src";
import type { FleetAsset, SignalObservation } from "../src";

let seed = Number(process.env.HAMMER_SEED ?? 0x51515151) >>> 0;
function rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 0x100000000; }
const CASES = Number(process.env.HAMMER_CASES ?? 30000);
let checks = 0;
for (let c = 0; c < CASES; c += 1) {
  const n = 4 + Math.floor(rnd() * 8);
  const assets: FleetAsset[] = Array.from({ length: n }, (_, i) => ({ id: `a${i}`, cohort: i < Math.ceil(n / 2) ? "alpha" : "beta", criticality: 1 + Math.floor(rnd() * 5) }));
  const pair = [`sig-${c % 13}`, `sig-${(c + 3) % 17}`];
  const obs: SignalObservation[] = assets.slice(0, Math.max(2, Math.floor(n / 2))).map((a, i) => ({ assetId: a.id, signals: i < 2 ? pair : [pair[0]!], severity: 2 + rnd() * 8 }));
  const beforeA = JSON.stringify(assets); const beforeO = JSON.stringify(obs);
  const hs = generateNightmares(assets, obs, { minSupport: 2, limit: 4 });
  assert.equal(JSON.stringify(assets), beforeA); checks++;
  assert.equal(JSON.stringify(obs), beforeO); checks++;
  assert.ok(hs.length >= 1); checks++;
  const h = hs[0]!; const budget = 1 + Math.floor(rnd() * Math.min(5, n)); const plan = compileProbe(h, assets, obs, budget);
  assert.ok(plan.budget <= budget); checks++;
  assert.equal(new Set([...plan.targetAssetIds, ...plan.controlAssetIds]).size, plan.targetAssetIds.length + plan.controlAssetIds.length); checks++;
  const positive = rnd() > 0.5;
  const result = { planId: plan.id, observations: plan.targetAssetIds.map((id) => ({ assetId: id, signals: positive ? [...h.signals] : ["noise"], severity: 5 })) };
  const verdict = evaluateProbe(h, plan, result);
  assert.ok(verdict.posteriorConfidence >= 0 && verdict.posteriorConfidence <= 1); checks++;
  assert.ok(["SUPPORTED", "FALSIFIED", "UNCERTAIN"].includes(verdict.status)); checks++;
}
console.log(JSON.stringify({ hammer: "PASS", cases: CASES, checks, seed }));
