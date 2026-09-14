import { EventMemory, generateNightmares, runInquiry } from "../src";

async function main() {
  const assets = [
    { id: "web-01", cohort: "internet", criticality: 5 }, { id: "web-02", cohort: "internet", criticality: 4 },
    { id: "web-03", cohort: "internet", criticality: 3 }, { id: "db-01", cohort: "database", criticality: 5 },
  ];
  const history = [
    { assetId: "web-01", signals: ["tls-old", "header-drift"], severity: 8 },
    { assetId: "web-02", signals: ["tls-old", "header-drift"], severity: 7 },
    { assetId: "web-03", signals: ["tls-old"], severity: 5 },
  ];
  const hypothesis = generateNightmares(assets, history, { minSupport: 2 })[0]!;
  const result = await runInquiry(hypothesis, assets, history, {
    async execute(plan) { return { planId: plan.id, observations: plan.targetAssetIds.map((assetId) => ({ assetId, signals: ["tls-old", "header-drift"], severity: 8 })) }; },
  }, new EventMemory(), 3);
  console.log(JSON.stringify({ hypothesis, probe: result.plan, verdict: result.verdict, memoryEvents: result.memory.length }, null, 2));
}
void main();
