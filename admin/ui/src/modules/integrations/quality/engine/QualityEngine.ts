import type { QualityIssue, QualityReport } from "../models";
import { RuleRegistry } from "../registry";
import { getQualityGrade } from "../utils/score";
import type {
  Product,
} from "@wooly/contracts/types/product";

export const QualityEngine = {
  evaluate(
    items: Product[],
  ): QualityReport {
    const rules = RuleRegistry.getAll();
    const issues: QualityIssue[] = [];

    let passed = 0;
    let warningItems = 0;
    let blockedItems = 0;
    let totalScore = 0;

    for (const item of items) {
      const itemIssues = rules.flatMap((rule) => rule.validate(item, { items }));
      const itemErrors = itemIssues.filter((issue) => issue.level === "error").length;
      const itemWarnings = itemIssues.filter((issue) => issue.level === "warning").length;

      if (itemErrors === 0) passed++;
      if (itemErrors > 0) blockedItems++;
      if (itemWarnings > 0) warningItems++;

      const maxScore = rules.reduce((sum, rule) => sum + rule.weight, 0);
      const lostScore = rules.reduce((sum, rule) => {
        const hasError = itemIssues.some((issue) => issue.level === "error" && issue.field);
        return sum + (hasError && rule.required ? rule.weight : 0);
      }, 0);

      totalScore += Math.max(0, maxScore - lostScore);
      issues.push(...itemIssues);
    }

    const maxGlobalScore = items.length * rules.reduce((sum, rule) => sum + rule.weight, 0);
    const percentage = maxGlobalScore ? Math.round((totalScore / maxGlobalScore) * 100) : 100;
    const errors = issues.filter((issue) => issue.level === "error").length;
    const warnings = issues.filter((issue) => issue.level === "warning").length;

    return {
      total: items.length,
      passed,
      warnings,
      errors,
      exportable: errors === 0,
      score: { total: percentage, percentage, grade: getQualityGrade(percentage) },
      summary: {
        totalItems: items.length,
        exportableItems: passed,
        blockedItems,
        warningItems,
        averageScore: percentage,
        globalGrade: getQualityGrade(percentage),
        exportable: errors === 0,
      },
      gates: rules.map((rule) => {
        const ruleIssues = issues.filter((issue) => issue.field === rule.key || issue.code.toLowerCase().includes(rule.key));
        const hasError = ruleIssues.some((issue) => issue.level === "error");
        return { key: rule.key, name: rule.name, required: rule.required, passed: !hasError, score: hasError ? 0 : rule.weight };
      }),
      issues,
    };
  },
};
