// Shell execution operation handler

import { spawn } from "child_process";
import * as shellQuote from "shell-quote";
import { ShellConfig } from "../../../types/command-spec";

// List of dangerous shell metacharacters
const DANGEROUS_SHELL_CHARS = ['|', '&', ';', '$', '>', '<', '`', '\\', '"', "'", '\n'];

function containsDangerousShellChars(command: string): boolean {
  return DANGEROUS_SHELL_CHARS.some(char => command.includes(char));
}

export async function executeShell(config: ShellConfig): Promise<{ stdout: string; stderr: string }> {
  if (containsDangerousShellChars(config.command)) {
    throw new Error("Command contains potentially dangerous shell metacharacters.");
  }

  // Parse the command into argv array
  const parsed = shellQuote.parse(config.command);
  if (parsed.length === 0 || typeof parsed[0] !== "string") {
    throw new Error("Invalid command.");
  }
  const cmd = parsed[0] as string;
  const args = parsed.slice(1).map(arg => {
    if (typeof arg !== "string") throw new Error("Invalid command argument.");
    return arg;
  });

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(cmd, args, {
      timeout: config.timeout || 5000,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (err) => {
      reject(err);
    });
    child.on("close", (code) => {
      resolve({ stdout, stderr });
    });
  });
}
