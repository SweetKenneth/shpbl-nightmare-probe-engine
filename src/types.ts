export interface FleetAsset {
  id: string;
  cohort: string;
  manager?: string;
  criticality?: number;
  tags?: Record<string, string>;
}

export interface SignalObservation {
  assetId: string;
  signals: string[];
  severity: number;
  at?: number;
}

export interface NightmareHypothesis {
  id: string;
  title: string;
  signals: string[];
  cohorts: string[];
  confidence: number;
  source: "generated" | "pollinated" | "refined";
  parentIds?: string[];
}

export interface ProbePlan {
  id: string;
  hypothesisId: string;
  targetAssetIds: string[];
  controlAssetIds: string[];
  expectedSignals: string[];
  budget: number;
  falsificationThreshold: number;
  rationale: string[];
}

export interface ProbeResult {
  planId: string;
  observations: SignalObservation[];
}

export interface HypothesisVerdict {
  hypothesisId: string;
  status: "SUPPORTED" | "FALSIFIED" | "UNCERTAIN";
  priorConfidence: number;
  posteriorConfidence: number;
  testedTargets: number;
  matchedTargets: number;
  matchRate: number;
  testedControls: number;
  matchedControls: number;
  controlMatchRate: number;
  discrimination: number;
  nextBudget: number;
}

export interface MemoryEvent {
  seq: number;
  type: "HYPOTHESIS" | "PROBE_PLANNED" | "PROBE_OBSERVED" | "VERDICT";
  payload: unknown;
}

export interface ProbeExecutor {
  execute(plan: ProbePlan): Promise<ProbeResult>;
}

export interface InquiryResult {
  hypothesis: NightmareHypothesis;
  plan: ProbePlan;
  result: ProbeResult;
  verdict: HypothesisVerdict;
  refined: NightmareHypothesis;
  memory: MemoryEvent[];
}
