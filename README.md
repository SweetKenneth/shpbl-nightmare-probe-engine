# Nightmare Probe Engine

**Turn worst-case fleet hypotheses into the smallest bounded scan that could falsify them.**

Generates falsifiable worst-case fleet hypotheses, compiles each into the smallest bounded targeted-scan probe with a control cohort, and returns a support/falsification verdict that requires discrimination from the controls.

It is an analysis and decision surface, not an actuator: it has no network client, touches no files, spawns no processes, and reads no environment variables.

## Why a practitioner would install this

- **A theory is not a finding.** Every hypothesis carries the observations that suggested it and the exact probe that could kill it, so nobody argues about a hunch.
- **Probes stay small on purpose.** A hypothesis compiles to the fewest targets that can discriminate it, inside an explicit budget, instead of another fleet-wide sweep.
- **Controls are mandatory for a verdict.** Target support alone cannot mark a hypothesis SUPPORTED; the probe must also separate targets from the tested control cohort.
- **Falsification is a first-class result.** A refuted hypothesis is recorded with its evidence, which is the outcome that actually shrinks the search space.
- **Nothing scans on its own.** The engine plans and judges; the operator's own scanner executes and hands back observations.

## Behavioural contract

1. `nightmare_generate` derives deterministic, evidence-seeking hypotheses from supplied assets and observations. No observation, no hypothesis.
2. `nightmare_compile_probe` compiles one hypothesis into a bounded probe plan: exact targets, an optional control cohort, and a budget it may not exceed.
3. `nightmare_evaluate_probe` compares target and control observations against the hypothesis and returns SUPPORTED, REFUTED or INCONCLUSIVE with its reasoning.
4. A SUPPORTED verdict requires both target support and discrimination from any tested controls.
5. Malformed, empty or out-of-range input fails closed rather than returning a confident guess.
6. Every run is a pure function of its inputs: same inputs, same hypotheses, same plan, same verdict.

## Prerequisites

- Node.js 20 or newer (`node --version`). Zero runtime dependencies.
- An MCP client that speaks stdio (Claude Code, Claude Desktop, Cursor), or direct library use from TypeScript.
- No API key, account, network access or Tenable product is required.

## Install and run

```bash
git clone https://github.com/SweetKenneth/shpbl-nightmare-probe-engine.git
cd shpbl-nightmare-probe-engine
npm install      # devDependencies only: typescript
npm run build    # compiles to dist/
npm test         # 29 behavioural, boundary and fail-closed tests
npm start        # starts the MCP server on stdio
```

MCP client configuration:

```json
{
  "mcpServers": {
    "nightmare-probe-engine": {
      "command": "node",
      "args": ["/absolute/path/to/shpbl-nightmare-probe-engine/dist/src/mcp-server.js"]
    }
  }
}
```

## Tools exposed

- `nightmare_generate` — Generate deterministic evidence-seeking security hypotheses from fleet observations.
- `nightmare_compile_probe` — Compile one hypothesis into a bounded targeted probe plan with optional control cohort.
- `nightmare_evaluate_probe` — Evaluate target and control observations against a hypothesis and return a falsification/specificity verdict.

## What it outputs

Hypothesis records with supporting observations, bounded probe plans (targets, controls, budget), and verdict objects with the discrimination reasoning, all returned as MCP `structuredContent` plus text JSON.

## Verification

Reproduce all of it from a clean clone with `npm run check`:

- Strict TypeScript compile and `--noEmit` typecheck: **PASS**
- Behavioural tests: **29/29 PASS**
- Randomised invariant hammer: **30,000 cases / 210,000 invariant checks PASS**
- Static scan for network, filesystem, process and dynamic-eval surfaces in `src/`: **PASS (0 findings)**
- Worked example runs end to end: **PASS**
- Runtime dependencies: **0**

## Known limitations

- No Nessus, cloud or network client is embedded. The scan executor boundary must be supplied by an integration.
- Hypotheses are deterministic structures derived from the observations you supply; this is not autonomous discovery of ground truth and carries no probabilistic calibration.
- A SUPPORTED verdict is evidence of discrimination, not proof of causation.
- Session memory is in process. Exported records are the durable artifact.

## Provenance and lineage

This product exists because two things were put together, and both are credited.

**Upstream capability inspiration — [`conard0-git/targeted-nessus-scan`](https://github.com/conard0-git/targeted-nessus-scan)**, by Isaac Conard (conard0-git), MIT licensed. Its observed behaviour was studied as a capability surface: what a practitioner in that domain actually needs to do. The exact paths and lines that were read are recorded in [`PROVENANCE.json`](./PROVENANCE.json). **No line of upstream implementation code is used in this package.** The upstream licence text is preserved under `THIRD_PARTY_NOTICES/` as provenance; it does not license this implementation.

**SHPBL capability library — [shpbl.com](https://shpbl.com).** SHPBL ([shpbl.com](https://shpbl.com)) is a governed library of reusable software capabilities and a method for composing them: it reads a target repository, identifies what capability it demonstrates, matches that against owned capability records, and writes new software where neither side had it before. The capability parents used here are listed by identifier in `PROVENANCE.json`. **No harvested capability body is embedded in this package.**

**The implementation in this repository was written fresh** from the approved capability contract for this run. The literal composition is 0% upstream code, 0% copied SHPBL capability bodies, 100% new implementation. That is an exact-line and byte-level statement about this source tree, not a legal opinion.

Author and copyright: **Kenneth E. Sweet Jr.**, MIT licensed.

Attribution does not imply endorsement by Isaac Conard (conard0-git), Tenable, or any other party.

## Tenable status

Submitted to the Tenable CyberAgents Exchange for review on September 14, 2026 — [pull request #171](https://github.com/tenable/cyberagents-exchange/pull/171).
Submission does not imply review, approval, certification, validation, endorsement or acceptance by Tenable.

## Files

- `src/` — implementation and the stdio MCP server.
- `tests/` — behavioural, fail-closed and MCP integration tests.
- `scripts/` — randomised invariant hammer and the static security scan.
- `examples/worked-example.ts` — an end-to-end run you can execute.
- `SECURITY.md` — threat boundary and forbidden behaviour.
- `PROVENANCE.json` — upstream and SHPBL capability lineage.
- `MANIFEST.json` / `CHECKSUMS.sha256` — released file inventory and hashes.
- `LICENSE` — MIT.

## License

MIT © 2026 Kenneth E. Sweet Jr.. See [`LICENSE`](./LICENSE).
