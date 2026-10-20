import type { QualityScore } from "../models";

export const getQualityGrade = (percentage: number): QualityScore["grade"] => {
  if (percentage >= 95) return "A+";
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  return "D";
};
