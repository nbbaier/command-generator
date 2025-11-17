// File read/write operation handlers

import { environment } from "@raycast/api";
import { promises as fs } from "fs";
import path from "path";
import { FileReadConfig, FileWriteConfig } from "../../../types/command-spec";

/**
 * Security check: ensure path is within supportPath
 */
function validatePath(filePath: string): string {
  const supportPath = environment.supportPath;
  const resolvedPath = path.resolve(supportPath, filePath);
  const relative = path.relative(supportPath, resolvedPath);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("File access is restricted to the extension support directory");
  }

  return resolvedPath;
}

export async function executeFileRead(config: FileReadConfig): Promise<string> {
  const safePath = validatePath(config.path);
  const encoding = (config.encoding || "utf-8") as BufferEncoding;

  try {
    return await fs.readFile(safePath, encoding);
  } catch (error) {
    throw new Error(`Failed to read file: ${error}`);
  }
}

export async function executeFileWrite(config: FileWriteConfig): Promise<void> {
  const safePath = validatePath(config.path);
  const encoding = (config.encoding || "utf-8") as BufferEncoding;

  try {
    // Ensure directory exists
    const dir = path.dirname(safePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(safePath, config.content, encoding);
  } catch (error) {
    throw new Error(`Failed to write file: ${error}`);
  }
}
