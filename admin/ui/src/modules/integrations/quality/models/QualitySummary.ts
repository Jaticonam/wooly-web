export interface QualitySummary {
  totalItems: number;
  exportableItems: number;
  blockedItems: number;
  warningItems: number;
  averageScore: number;
  globalGrade: "A+" | "A" | "B" | "C" | "D";
  exportable: boolean;
}
