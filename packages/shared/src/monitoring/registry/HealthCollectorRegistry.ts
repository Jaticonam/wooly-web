import type {
  HealthCollector,
} from "@wooly/contracts/monitoring/contracts/HealthCollector";

class Registry {
  private collectors:
    HealthCollector[] = [];

  register(
    collector: HealthCollector,
  ): void {
    const collectorId =
      collector.id.trim();

    if (!collectorId) {
      throw new Error(
        "Health collector id must not be empty.",
      );
    }

    if (
      this.collectors.some(
        (registered) =>
          registered.id.trim() ===
          collectorId,
      )
    ) {
      return;
    }

    this.collectors.push(
      collector,
    );
  }

  getAll(): readonly HealthCollector[] {
    return [
      ...this.collectors,
    ];
  }
}

export const HealthCollectorRegistry =
  new Registry();
