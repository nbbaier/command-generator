// CommandSpec validator

import { CommandSpec, Operation } from "../../types/command-spec";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateCommandSpec(spec: unknown): spec is CommandSpec {
  if (!spec || typeof spec !== "object") {
    throw new ValidationError("CommandSpec must be an object");
  }

  const s = spec as Partial<CommandSpec>;

  // Validate required fields
  if (!s.id || typeof s.id !== "string") {
    throw new ValidationError("CommandSpec.id must be a string");
  }

  if (!s.title || typeof s.title !== "string") {
    throw new ValidationError("CommandSpec.title must be a string");
  }

  if (!s.description || typeof s.description !== "string") {
    throw new ValidationError("CommandSpec.description must be a string");
  }

  if (!s.mode || !["list", "form", "detail", "view"].includes(s.mode)) {
    throw new ValidationError("CommandSpec.mode must be one of: list, form, detail, view");
  }

  // Validate steps
  if (!Array.isArray(s.steps)) {
    throw new ValidationError("CommandSpec.steps must be an array");
  }

  s.steps.forEach((step, index) => {
    validateOperation(step, index);
  });

  // Validate ui
  if (!s.ui || typeof s.ui !== "object") {
    throw new ValidationError("CommandSpec.ui must be an object");
  }

  if (!["list", "form", "detail"].includes(s.ui.mode)) {
    throw new ValidationError("CommandSpec.ui.mode must be one of: list, form, detail");
  }

  if (!s.ui.dataSource || typeof s.ui.dataSource !== "string") {
    throw new ValidationError("CommandSpec.ui.dataSource must be a string");
  }

  // Validate metadata
  if (!s.metadata || typeof s.metadata !== "object") {
    throw new ValidationError("CommandSpec.metadata must be an object");
  }

  if (!s.metadata.created || typeof s.metadata.created !== "string") {
    throw new ValidationError("CommandSpec.metadata.created must be an ISO timestamp string");
  }

  if (!s.metadata.modified || typeof s.metadata.modified !== "string") {
    throw new ValidationError("CommandSpec.metadata.modified must be an ISO timestamp string");
  }

  if (!Array.isArray(s.metadata.tags)) {
    throw new ValidationError("CommandSpec.metadata.tags must be an array");
  }

  return true;
}

function validateOperation(op: unknown, index: number): op is Operation {
  if (!op || typeof op !== "object") {
    throw new ValidationError(`Operation at index ${index} must be an object`);
  }

  const operation = op as Partial<Operation>;

  const validTypes = [
    "httpRequest",
    "shell",
    "transform",
    "fileRead",
    "fileWrite",
    "clipboard",
    "open",
    "showToast",
    "showHUD",
  ];

  if (!operation.type || !validTypes.includes(operation.type)) {
    throw new ValidationError(`Operation at index ${index} has invalid type: ${operation.type}`);
  }

  if (!operation.config || typeof operation.config !== "object") {
    throw new ValidationError(`Operation at index ${index} must have a config object`);
  }

  // Validate specific operation configs
  switch (operation.type) {
    case "httpRequest":
      validateHttpRequestConfig(operation.config, index);
      break;
    case "shell":
      validateShellConfig(operation.config, index);
      break;
    case "transform":
      validateTransformConfig(operation.config, index);
      break;
    case "fileRead":
    case "fileWrite":
      validateFileConfig(operation.config, index, operation.type);
      break;
    case "clipboard":
      validateClipboardConfig(operation.config, index);
      break;
    case "open":
      validateOpenConfig(operation.config, index);
      break;
    case "showToast":
      validateToastConfig(operation.config, index);
      break;
    case "showHUD":
      validateHUDConfig(operation.config, index);
      break;
  }

  return true;
}

function validateHttpRequestConfig(config: Record<string, unknown>, index: number): void {
  if (!config.url || typeof config.url !== "string") {
    throw new ValidationError(`HTTP operation at index ${index} requires a url string`);
  }

  if (!config.method || !["GET", "POST", "PUT", "DELETE", "PATCH"].includes(config.method as string)) {
    throw new ValidationError(`HTTP operation at index ${index} requires a valid method`);
  }
}

function validateShellConfig(config: Record<string, unknown>, index: number): void {
  if (!config.command || typeof config.command !== "string") {
    throw new ValidationError(`Shell operation at index ${index} requires a command string`);
  }
}

function validateTransformConfig(config: Record<string, unknown>, index: number): void {
  if (!config.template || typeof config.template !== "string") {
    throw new ValidationError(`Transform operation at index ${index} requires a template string`);
  }
}

function validateFileConfig(config: Record<string, unknown>, index: number, type: string): void {
  if (!config.path || typeof config.path !== "string") {
    throw new ValidationError(`${type} operation at index ${index} requires a path string`);
  }

  if (type === "fileWrite" && config.content === undefined) {
    throw new ValidationError(`fileWrite operation at index ${index} requires content`);
  }
}

function validateClipboardConfig(config: Record<string, unknown>, index: number): void {
  if (!config.action || !["copy", "read"].includes(config.action as string)) {
    throw new ValidationError(`Clipboard operation at index ${index} requires action: copy or read`);
  }
}

function validateOpenConfig(config: Record<string, unknown>, index: number): void {
  if (!config.target || typeof config.target !== "string") {
    throw new ValidationError(`Open operation at index ${index} requires a target string`);
  }
}

function validateToastConfig(config: Record<string, unknown>, index: number): void {
  if (!config.title || typeof config.title !== "string") {
    throw new ValidationError(`ShowToast operation at index ${index} requires a title string`);
  }

  if (config.style && !["success", "failure", "animated"].includes(config.style as string)) {
    throw new ValidationError(`ShowToast operation at index ${index} has invalid style`);
  }
}

function validateHUDConfig(config: Record<string, unknown>, index: number): void {
  if (!config.title || typeof config.title !== "string") {
    throw new ValidationError(`ShowHUD operation at index ${index} requires a title string`);
  }
}
