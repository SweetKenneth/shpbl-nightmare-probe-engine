# Security boundary — Nightmare Probe Engine

This package is a local deterministic reasoning component. It contains no network client, cloud credential loader, Nessus credential handling, shell/process execution, filesystem write path, or live remediation transport. Its MCP surface communicates only over stdin/stdout.

The source project describes real Nessus/AWS integration behavior; this artifact deliberately does **not** copy or embed those clients. Production execution must be supplied by an authorized integration at the explicit adapter/plan boundary.

- No Nessus, AWS or network client is embedded. The executor boundary must be supplied by an integration.
- Hypotheses are deterministic structures derived from supplied observations; this package does not claim machine consciousness, autonomous discovery of ground truth, or probabilistic calibration.
- A SUPPORTED verdict means the bounded probe matched the declared signals; it is not proof of causation.

## Reporting

To report a vulnerability in this package, open a GitHub issue on this repository, or contact the author through https://shpbl.com. There is no embedded network, filesystem or process surface to exploit remotely; the highest-value reports are logic flaws that let a gate pass without its evidence.
