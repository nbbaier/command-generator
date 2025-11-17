// Shell execution operation handler

import { exec } from "child_process";
import { promisify } from "util";
import { ShellConfig } from "../../../types/command-spec";

const execAsync = promisify(exec);

export async function executeShell(config: ShellConfig): Promise<{ stdout: string; stderr: string }> {
  const result = await execAsync(config.command, {
    shell: config.shell || "/bin/bash",
    timeout: config.timeout || 5000,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
