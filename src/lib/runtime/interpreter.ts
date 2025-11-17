// CommandSpec interpreter - executes command specifications

import { environment } from "@raycast/api";
import Handlebars from "handlebars";
import { CommandSpec, ExecutionResult, ExecutionContext } from "../../types/command-spec";
import { executeHttpRequest } from "./ops/http";
import { executeShell } from "./ops/shell";
import { executeTransform } from "./ops/transform";
import { executeFileRead, executeFileWrite } from "./ops/file";
import { executeClipboard } from "./ops/clipboard";
import { executeOpen } from "./ops/open";
import { executeShowToast, executeShowHUD } from "./ops/ui";

export class InterpreterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InterpreterError";
  }
}

/**
 * Execute a CommandSpec with optional form input values
 */
export async function executeCommandSpec(
  spec: CommandSpec,
  formValues?: Record<string, unknown>,
): Promise<ExecutionResult> {
  // Initialize execution context
  const context: ExecutionContext = {
    env: process.env as Record<string, string>,
    input: formValues || {},
    supportPath: environment.supportPath,
    assetsPath: environment.assetsPath,
  };

  // Execute operations sequentially
  for (let i = 0; i < spec.steps.length; i++) {
    const step = spec.steps[i];

    try {
      const result = await executeOperation(step.type, step.config, context);

      // Store result in context if outputVar is specified
      if (step.outputVar) {
        context[step.outputVar] = result;
      }
    } catch (error) {
      throw new InterpreterError(
        `Operation ${i + 1} (${step.type}) failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Return execution result with context for UI rendering
  return {
    data: context,
    uiBinding: spec.ui,
    actions: spec.actions,
  };
}

/**
 * Execute a single operation
 */
async function executeOperation(
  type: string,
  config: Record<string, unknown>,
  context: ExecutionContext,
): Promise<unknown> {
  // Interpolate templates in config
  const interpolatedConfig = interpolateConfig(config, context);

  switch (type) {
    case "httpRequest":
      return await executeHttpRequest(interpolatedConfig);

    case "shell":
      return await executeShell(interpolatedConfig);

    case "transform":
      return await executeTransform(interpolatedConfig);

    case "fileRead":
      return await executeFileRead(interpolatedConfig);

    case "fileWrite":
      return await executeFileWrite(interpolatedConfig);

    case "clipboard":
      return await executeClipboard(interpolatedConfig);

    case "open":
      return await executeOpen(interpolatedConfig);

    case "showToast":
      return await executeShowToast(interpolatedConfig);

    case "showHUD":
      return await executeShowHUD(interpolatedConfig);

    default:
      throw new InterpreterError(`Unknown operation type: ${type}`);
  }
}

/**
 * Interpolate Handlebars templates in config using context
 */
function interpolateConfig(config: Record<string, unknown>, context: ExecutionContext): Record<string, unknown> {
  try {
    function interpolateValue(value: unknown): unknown {
      if (typeof value === "string") {
        const template = Handlebars.compile(value);
        return template(context);
      } else if (Array.isArray(value)) {
        return value.map(interpolateValue);
      } else if (value && typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
          result[k] = interpolateValue(v);
        }
        return result;
      } else {
        return value;
      }
    }
    return interpolateValue(config) as Record<string, unknown>;
  } catch (error) {
    throw new InterpreterError(
      `Template interpolation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Interpolate a single template string using context
 */
export function interpolateTemplate(template: string, context: Record<string, unknown>): string {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(context);
  } catch (error) {
    throw new InterpreterError(
      `Template interpolation failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
