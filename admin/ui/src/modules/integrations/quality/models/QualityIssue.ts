export type QualityLevel =
  | "error"
  | "warning"
  | "info";

export interface QualityIssue {

  level: QualityLevel;

  code: string;

  field: string;

  message: string;

}
