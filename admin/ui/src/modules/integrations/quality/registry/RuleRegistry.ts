import type { QualityRule } from "../contracts/QualityRule";
import type {
  Product,
} from "@wooly/contracts/types/product";

class Registry {
  private rules:
    QualityRule<Product>[] = [];

  register(
    rule:
      QualityRule<Product>,
  ) {
    const exists = this.rules.some((item) => item.key === rule.key);
    if (!exists) this.rules.push(rule);
  }

  getAll() {
    return this.rules.filter(
      (rule) => rule.enabled,
    );
  }

  getByKey(key: string) {
    return this.rules.find((rule) => rule.key === key);
  }
}

export const RuleRegistry = new Registry();
