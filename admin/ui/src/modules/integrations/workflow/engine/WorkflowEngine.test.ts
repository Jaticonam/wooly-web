import { describe, expect, it, vi } from "vitest";

import type { WorkflowStep } from "../contracts/WorkflowStep";
import type { WorkflowContext } from "../models/WorkflowContext";
import { StepRegistry } from "../registry/StepRegistry";
import { WorkflowEngine } from "./WorkflowEngine";

const createContext = (): WorkflowContext<number> => ({
  workflowId: "workflow-test",
  data: [1],
  metadata: {},
  state: {},
  logs: [],
});

const registerStep = (
  key: string,
  execute: WorkflowStep["execute"],
) => {
  StepRegistry.register({
    key,
    name: key,
    enabled: true,
    execute,
  });
};

describe("WorkflowEngine", () => {
  it("ejecuta los steps registrados en orden y propaga entrada y salida", async () => {
    const order: string[] = [];
    registerStep("r82-first", async (context) => {
      order.push("first");
      return { ...context, state: { value: 2 } };
    });
    registerStep("r82-second", async (context) => {
      order.push("second");
      return {
        ...context,
        state: { value: Number(context.state.value) + 1 },
      };
    });

    const result = await new WorkflowEngine().execute(
      {
        id: "r82",
        name: "R8.2",
        enabled: true,
        steps: ["r82-first", "r82-second"],
      },
      createContext(),
    );

    expect(order).toEqual(["first", "second"]);
    expect(result).toMatchObject({
      success: true,
      executedSteps: ["r82-first", "r82-second"],
      context: { state: { value: 3 } },
    });
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it("rechaza un step inexistente sin declarar éxito", async () => {
    await expect(
      new WorkflowEngine().execute(
        {
          id: "missing",
          name: "Missing",
          enabled: true,
          steps: ["r82-missing"],
        },
        createContext(),
      ),
    ).rejects.toThrow('Workflow step "r82-missing" no registrado.');
  });

  it("propaga el error de un step e interrumpe los posteriores", async () => {
    const later = vi.fn(async (context: WorkflowContext) => context);
    registerStep("r82-failing", async () => {
      throw new Error("step failure");
    });
    registerStep("r82-later", later);

    await expect(
      new WorkflowEngine().execute(
        {
          id: "failure",
          name: "Failure",
          enabled: true,
          steps: ["r82-failing", "r82-later"],
        },
        createContext(),
      ),
    ).rejects.toThrow("step failure");
    expect(later).not.toHaveBeenCalled();
  });
});
