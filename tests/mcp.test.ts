import test from "node:test";
import assert from "node:assert/strict";
import { generateNightmares } from "../src";

test("public engine can be called with JSON-shaped inputs", () => {
  const out = generateNightmares([{ id: "a", cohort: "x" }, { id: "b", cohort: "x" }], [
    { assetId: "a", signals: ["s1", "s2"], severity: 8 },
    { assetId: "b", signals: ["s1", "s2"], severity: 7 },
  ]);
  assert.equal(JSON.parse(JSON.stringify(out))[0].source, "generated");
});
