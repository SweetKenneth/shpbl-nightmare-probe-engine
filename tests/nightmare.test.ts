import test from "node:test";
import assert from "node:assert/strict";
import { EventMemory, compileProbe, crossPollinate, evaluateProbe, generateNightmares, refineHypothesis, runInquiry } from "../src";
import type { FleetAsset, NightmareHypothesis, ProbeExecutor, ProbeResult, SignalObservation } from "../src";

const assets: FleetAsset[] = [
  { id: "web-1", cohort: "web", criticality: 5 },
  { id: "web-2", cohort: "web", criticality: 4 },
  { id: "web-3", cohort: "web", criticality: 3 },
  { id: "db-1", cohort: "db", criticality: 5 },
  { id: "batch-1", cohort: "batch", criticality: 2 },
];
const history: SignalObservation[] = [
  { assetId: "web-1", signals: ["tls-old", "weak-cipher"], severity: 8 },
  { assetId: "web-2", signals: ["weak-cipher", "tls-old"], severity: 7 },
  { assetId: "web-3", signals: ["tls-old"], severity: 5 },
  { assetId: "db-1", signals: ["db-banner"], severity: 4 },
];

function first(): NightmareHypothesis {
  const out = generateNightmares(assets, history, { minSupport: 2 });
  assert.ok(out.length > 0);
  return out[0]!;
}

test("generates a supported pair hypothesis", () => {
  const h = first();
  assert.deepEqual(h.signals, ["tls-old", "weak-cipher"]);
  assert.deepEqual(h.cohorts, ["web"]);
});

test("generation is deterministic", () => assert.deepEqual(generateNightmares(assets, history), generateNightmares(assets, history)));

test("generation does not mutate inputs", () => {
  const beforeA = JSON.stringify(assets); const beforeH = JSON.stringify(history); generateNightmares(assets, history); assert.equal(JSON.stringify(assets), beforeA); assert.equal(JSON.stringify(history), beforeH);
});

test("unknown asset in observation is rejected", () => assert.throws(() => generateNightmares(assets, [{ assetId: "missing", signals: ["x"], severity: 5 }]), /unknown asset/));

test("invalid severity is rejected", () => assert.throws(() => generateNightmares(assets, [{ assetId: "web-1", signals: ["x"], severity: 11 }]), /severity/));

test("single high-severity signal can seed fallback nightmare", () => {
  const out = generateNightmares(assets, [{ assetId: "db-1", signals: ["kernel-ghost"], severity: 9 }], { minSupport: 3 });
  assert.equal(out.length, 1); assert.deepEqual(out[0]!.signals, ["kernel-ghost"]);
});

test("cross pollination combines distinct hypotheses", () => {
  const a = first();
  const b: NightmareHypothesis = { id: "b", title: "b", signals: ["route-drift"], cohorts: ["db"], confidence: .7, source: "generated" };
  const c = crossPollinate(a, b);
  assert.deepEqual(c.signals, ["route-drift", "tls-old", "weak-cipher"]);
  assert.deepEqual(c.parentIds, [a.id, b.id].sort());
});

test("cross pollinating same hypothesis is rejected", () => { const h = first(); assert.throws(() => crossPollinate(h, h), /itself/); });

test("probe respects budget", () => { const p = compileProbe(first(), assets, history, 3); assert.ok(p.budget <= 3); assert.ok(p.targetAssetIds.length >= 1); });

test("probe targets hypothesis cohort first", () => { const p = compileProbe(first(), assets, history, 2); assert.ok(p.targetAssetIds.every((id) => id.startsWith("web-"))); });

test("probe includes a control when budget allows", () => { const p = compileProbe(first(), assets, history, 4); assert.equal(p.controlAssetIds.length, 1); assert.ok(["db-1", "batch-1"].includes(p.controlAssetIds[0]!)); });

test("probe never duplicates target/control ids", () => { const p = compileProbe(first(), assets, history, 5); assert.equal(new Set([...p.targetAssetIds, ...p.controlAssetIds]).size, p.targetAssetIds.length + p.controlAssetIds.length); });

test("nonpositive probe budget is rejected", () => assert.throws(() => compileProbe(first(), assets, history, 0), /positive integer/));

test("supported evidence raises confidence", () => {
  const h = first(); const p = compileProbe(h, assets, history, 2);
  const result: ProbeResult = { planId: p.id, observations: p.targetAssetIds.map((id) => ({ assetId: id, signals: [...h.signals], severity: 8 })) };
  const v = evaluateProbe(h, p, result); assert.equal(v.status, "SUPPORTED"); assert.ok(v.posteriorConfidence > h.confidence);
});

test("negative evidence falsifies hypothesis", () => {
  const h = first(); const p = compileProbe(h, assets, history, 2);
  const result: ProbeResult = { planId: p.id, observations: p.targetAssetIds.map((id) => ({ assetId: id, signals: ["other"], severity: 1 })) };
  const v = evaluateProbe(h, p, result); assert.equal(v.status, "FALSIFIED"); assert.ok(v.posteriorConfidence < h.confidence);
});

test("missing evidence remains uncertain and expands next budget", () => {
  const h = first(); const p = compileProbe(h, assets, history, 2); const v = evaluateProbe(h, p, { planId: p.id, observations: [] }); assert.equal(v.status, "UNCERTAIN"); assert.ok(v.nextBudget > p.budget);
});

test("mismatched plan result is rejected", () => { const h = first(); const p = compileProbe(h, assets, history, 2); assert.throws(() => evaluateProbe(h, p, { planId: "wrong", observations: [] }), /does not belong/); });

test("refinement preserves lineage and applies posterior", () => {
  const h = first(); const p = compileProbe(h, assets, history, 2); const r = { planId: p.id, observations: p.targetAssetIds.map((id) => ({ assetId: id, signals: [...h.signals], severity: 7 })) }; const v = evaluateProbe(h, p, r); const refined = refineHypothesis(h, v, r); assert.deepEqual(refined.parentIds, [h.id]); assert.equal(refined.confidence, v.posteriorConfidence);
});

test("event memory is append-only and replay returns a copy", () => {
  const m = new EventMemory(); m.append("HYPOTHESIS", { a: 1 }); m.append("VERDICT", { ok: true }); const r = m.replay(); assert.deepEqual(r.map((e) => e.seq), [1, 2]); r.pop(); assert.equal(m.replay().length, 2);
});

test("closed inquiry asks executor exactly one bounded question", async () => {
  const h = first(); let called = 0; let seen: any;
  const executor: ProbeExecutor = { async execute(plan) { called += 1; seen = plan; return { planId: plan.id, observations: plan.targetAssetIds.map((id) => ({ assetId: id, signals: [...h.signals], severity: 8 })) }; } };
  const out = await runInquiry(h, assets, history, executor, new EventMemory(), 3); assert.equal(called, 1); assert.equal(seen.id, out.plan.id); assert.equal(out.verdict.status, "SUPPORTED"); assert.deepEqual(out.memory.map((e) => e.type), ["HYPOTHESIS", "PROBE_PLANNED", "PROBE_OBSERVED", "VERDICT"]);
});

test("probe prefers incompletely observed in-cohort assets", () => {
  const h = first(); const p = compileProbe(h, assets, history, 1); assert.equal(p.targetAssetIds[0], "web-3");
});

test("confidence always remains within probability bounds", () => {
  const h = { ...first(), confidence: .99 }; const p = compileProbe(h, assets, history, 3); const v = evaluateProbe(h, p, { planId: p.id, observations: p.targetAssetIds.map((id) => ({ assetId: id, signals: h.signals, severity: 10 })) }); assert.ok(v.posteriorConfidence <= 1 && v.posteriorConfidence >= 0);
});
