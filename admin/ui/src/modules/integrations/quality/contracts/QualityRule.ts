import type { QualityIssue } from "../models";

export type QualityRuleCategory =
  | "identity"
  | "pricing"
  | "media"
  | "seo"
  | "inventory"
  | "marketing"
  | "content";

export interface QualityRule<T = unknown> {
  key: string;
  name: string;
  description: string;
  category: QualityRuleCategory;
  weight: number;
  required: boolean;
  enabled: boolean;
  validate(item: T, context?: { items?: T[] }): QualityIssue[];
}
