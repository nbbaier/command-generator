// CommandSpec loader - loads specs from supportPath

import { environment } from "@raycast/api";
import { promises as fs } from "fs";
import path from "path";
import { CommandSpec } from "../../types/command-spec";
import { validateCommandSpec, ValidationError } from "./validator";

export class LoaderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoaderError";
  }
}

/**
 * Get the directory where command specs are stored
 */
export function getCommandsDirectory(): string {
  return path.join(environment.supportPath, "commands");
}

/**
 * Get the directory where scripts are stored
 */
export function getScriptsDirectory(): string {
  return path.join(environment.supportPath, "commands", "scripts");
}

/**
 * Ensure the commands directory exists
 */
export async function ensureCommandsDirectory(): Promise<void> {
  const commandsDir = getCommandsDirectory();
  const scriptsDir = getScriptsDirectory();

  try {
    await fs.mkdir(commandsDir, { recursive: true });
    await fs.mkdir(scriptsDir, { recursive: true });
  } catch (error) {
    throw new LoaderError(`Failed to create commands directory: ${error}`);
  }
}

/**
 * Load all command specs from the commands directory
 */
export async function loadAllCommandSpecs(): Promise<CommandSpec[]> {
  await ensureCommandsDirectory();

  const commandsDir = getCommandsDirectory();
  const specs: CommandSpec[] = [];

  try {
    const files = await fs.readdir(commandsDir);

    for (const file of files) {
      // Only load .json files
      if (!file.endsWith(".json")) {
        continue;
      }

      const filePath = path.join(commandsDir, file);

      try {
        const spec = await loadCommandSpec(filePath);
        specs.push(spec);
      } catch (error) {
        console.error(`Failed to load spec from ${file}:`, error);
        // Continue loading other specs even if one fails
      }
    }
  } catch (error) {
    throw new LoaderError(`Failed to read commands directory: ${error}`);
  }

  return specs;
}

/**
 * Load a single command spec from a file path
 */
export async function loadCommandSpec(filePath: string): Promise<CommandSpec> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const spec = JSON.parse(content);

    // Validate the spec
    validateCommandSpec(spec);

    return spec as CommandSpec;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new LoaderError(`Invalid CommandSpec in ${filePath}: ${error.message}`);
    }
    throw new LoaderError(`Failed to load CommandSpec from ${filePath}: ${error}`);
  }
}

/**
 * Load a command spec by ID
 */
export async function loadCommandSpecById(id: string): Promise<CommandSpec | null> {
  const commandsDir = getCommandsDirectory();
  const filePath = path.join(commandsDir, `${id}.json`);

  try {
    return await loadCommandSpec(filePath);
  } catch (error) {
    // If file doesn't exist, return null
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Save a command spec to the commands directory
 */
export async function saveCommandSpec(spec: CommandSpec): Promise<void> {
  await ensureCommandsDirectory();

  // Validate before saving
  validateCommandSpec(spec);

  const commandsDir = getCommandsDirectory();
  const filePath = path.join(commandsDir, `${spec.id}.json`);

  try {
    const content = JSON.stringify(spec, null, 2);
    await fs.writeFile(filePath, content, "utf-8");
  } catch (error) {
    throw new LoaderError(`Failed to save CommandSpec: ${error}`);
  }
}

/**
 * Delete a command spec by ID
 */
export async function deleteCommandSpec(id: string): Promise<void> {
  const commandsDir = getCommandsDirectory();
  const filePath = path.join(commandsDir, `${id}.json`);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    throw new LoaderError(`Failed to delete CommandSpec: ${error}`);
  }
}

/**
 * Check if a command spec with the given ID exists
 */
export async function commandSpecExists(id: string): Promise<boolean> {
  const commandsDir = getCommandsDirectory();
  const filePath = path.join(commandsDir, `${id}.json`);

  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
