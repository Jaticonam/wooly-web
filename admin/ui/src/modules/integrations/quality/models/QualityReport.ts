import type { QualityGate } from "./QualityGate";
import type { QualityIssue } from "./QualityIssue";
import type { QualityScore } from "./QualityScore";
import type { QualitySummary } from "./QualitySummary";

export interface QualityReport {
  total: number;
  passed: number;
  warnings: number;
  errors: number;
  exportable: boolean;
  score: QualityScore;
  summary: QualitySummary;
  gates: QualityGate[];
  issues: QualityIssue[];
}
